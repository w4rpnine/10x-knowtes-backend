# API Endpoint Implementation Plan: DELETE /topics/{id}

## 1. Przegląd punktu końcowego
Endpoint służący do usuwania tematów wraz ze wszystkimi powiązanymi notatkami. Implementuje kaskadowe usuwanie z bazy danych, co oznacza, że usunięcie tematu spowoduje automatyczne usunięcie wszystkich notatek związanych z tym tematem.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- Struktura URL: `/api/topics/{id}`
- Parametry:
  - Wymagane: `id` (UUID tematu w ścieżce URL)
  - Opcjonalne: brak
- Request Body: brak (body nie jest wymagane dla metody DELETE)

## 3. Wykorzystywane typy
```typescript
// Z istniejącej struktury typów
import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";

// Walidacja parametrów
import { z } from "zod";
const topicIdSchema = z.string().uuid("Topic ID must be a valid UUID");
```

## 4. Szczegóły odpowiedzi
- Status 204 No Content (pomyślne usunięcie)
  - Odpowiedź: pusta (zgodnie z konwencją dla 204 No Content)
- Status 401 Unauthorized
  - Odpowiedź: `{ "error": "Unauthorized" }`
- Status 403 Forbidden
  - Odpowiedź: `{ "error": "Access denied" }`
- Status 404 Not Found
  - Odpowiedź: `{ "error": "Topic not found" }`
- Status 500 Internal Server Error
  - Odpowiedź: `{ "error": "Internal server error" }`

## 5. Przepływ danych
1. Endpoint otrzymuje żądanie DELETE do `/api/topics/{id}`
2. Walidacja parametru `id` (czy jest poprawnym UUID)
3. Weryfikacja, czy temat istnieje i czy użytkownik ma do niego dostęp
4. Usunięcie tematu z bazy danych (kaskadowe usunięcie powiązanych notatek obsługiwane jest przez bazę danych)
5. Zwrócenie odpowiedzi 204 No Content w przypadku powodzenia

## 6. Względy bezpieczeństwa
- Walidacja parametru `id` jako poprawnego UUID
- Weryfikacja, czy bieżący użytkownik jest właścicielem tematu przed usunięciem
- Implementacja mechanizmu autoryzacji, wykorzystując `userId` z kontekstu
- Obsługa potencjalnych błędów SQL poprzez opakowanie operacji bazodanowych w blok try-catch

## 7. Obsługa błędów
- Nieprawidłowy format UUID: 400 Bad Request
- Temat nie istnieje: 404 Not Found
- Użytkownik nie jest właścicielem tematu: 403 Forbidden
- Błąd bazy danych: 500 Internal Server Error
- Obsługa innych nieoczekiwanych błędów: 500 Internal Server Error

## 8. Rozważania dotyczące wydajności
- Operacja usuwania jest nieodwracalna, należy zwrócić uwagę na potencjalne problemy z przypadkowym usunięciem danych
- Dodanie indeksów do kolumny `topic_id` w tabeli `notes` może przyspieszyć kaskadowe usuwanie (choć to jest już obsługiwane przez bazę danych)
- Rozważenie mechanizmu soft delete w przyszłości dla ważnych danych

## 9. Etapy wdrożenia

### 1. Rozszerzenie usługi dla tematów (topics.service.ts):
```typescript
/**
 * Deletes a topic and all its related notes
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user
 * @param topicId - The ID of the topic to delete
 * @throws Error if topic not found, access denied, or deletion fails
 */
export async function deleteTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string
): Promise<void> {
  // Verify topic exists and user has access
  const { data: existingTopic, error: fetchError } = await supabase
    .from('topics')
    .select()
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingTopic) {
    throw new Error('Topic not found or access denied');
  }

  // Delete the topic (notes will be deleted via CASCADE)
  const { error: deleteError } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error('Failed to delete topic');
  }
}
```

### 2. Implementacja endpointu DELETE w [id].ts:
```typescript
/**
 * Deletes a topic and all related notes
 * 
 * @route DELETE /topics/{id}
 * @param {string} id - Topic UUID
 * 
 * @returns {object} 204 - No Content on successful deletion
 * @returns {object} 400 - Invalid UUID format
 * @returns {object} 401 - Unauthorized
 * @returns {object} 403 - Forbidden
 * @returns {object} 404 - Topic not found
 * @returns {object} 500 - Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate topic ID
    const topicId = await topicIdSchema.parseAsync(params.id);
    
    // Get supabase client from locals
    const { supabase } = locals as { 
      supabase: SupabaseClient<Database> 
    };

    // Delete topic
    await deleteTopic(
      supabase,
      DEFAULT_USER_ID, // In future, this should be replaced with authenticated user ID
      topicId
    );

    // Return 204 No Content for successful deletion
    return new Response(null, {
      status: 204,
      headers: commonHeaders
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes('not found') ? 404 : 
                    error.message.includes('access denied') ? 403 : 
                    error.message.includes('Invalid') ? 400 : 500;
      
      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: commonHeaders
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: commonHeaders
    });
  }
};
```

### 3. Aktualizacja deklaracji metod OPTIONS:
```typescript
// Upewnij się, że DELETE jest również wymienione w allowedMethods
const commonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
```

### 4. Testy do przeprowadzenia:
- Pomyślne usunięcie istniejącego tematu
- Próba usunięcia nieistniejącego tematu (oczekiwany 404)
- Próba usunięcia tematu innego użytkownika (oczekiwany 403)
- Próba usunięcia tematu z nieprawidłowym UUID (oczekiwany 400)
- Sprawdzenie, czy kaskadowe usunięcie notatek działa poprawnie

### 5. Aktualizacja dokumentacji API, jeśli istnieje 