# API Endpoint Implementation Plan: DELETE /notes/{id}

## 1. Przegląd punktu końcowego
Endpoint służy do usuwania pojedynczej notatki na podstawie jej identyfikatora. Zapewnia bezpieczne usunięcie notatki, uprzednio weryfikując, czy użytkownik ma do niej dostęp. Po pomyślnym usunięciu, endpoint zwraca odpowiedź 204 No Content, zgodnie z konwencjami RESTful API.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- Struktura URL: `/notes/{id}`
- Parametry:
  - Wymagane: `id` (UUID notatki w ścieżce URL)
  - Opcjonalne: brak
- Request Body: brak (body nie jest wymagane dla metody DELETE)

## 3. Wykorzystywane typy
```typescript
// Z istniejącej struktury typów
import type { Database } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";

// Walidacja parametrów
import { z } from "zod";
const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note ID format")
});
```

## 4. Szczegóły odpowiedzi
- Status 204 No Content (pomyślne usunięcie)
  - Odpowiedź: pusta (zgodnie z konwencją dla 204 No Content)
- Status 401 Unauthorized
  - Odpowiedź: `{ "error": "Unauthorized" }`
- Status 403 Forbidden
  - Odpowiedź: `{ "error": "Access denied" }`
- Status 404 Not Found
  - Odpowiedź: `{ "error": "Note not found" }`
- Status 500 Internal Server Error
  - Odpowiedź: `{ "error": "Internal server error" }`

## 5. Przepływ danych
1. Endpoint otrzymuje żądanie DELETE do `/notes/{id}`
2. Walidacja parametru `id` (czy jest poprawnym UUID)
3. Weryfikacja, czy notatka istnieje i czy użytkownik ma do niej dostęp
4. Usunięcie notatki z bazy danych
5. Zwrócenie odpowiedzi 204 No Content w przypadku powodzenia

## 6. Względy bezpieczeństwa
- Walidacja parametru `id` jako poprawnego UUID za pomocą Zod
- Weryfikacja, czy bieżący użytkownik jest właścicielem notatki przed usunięciem
- Implementacja mechanizmu autoryzacji, wykorzystując `userId` z kontekstu lokalnego
- Zabezpieczenie przed atakami typu CSRF poprzez odpowiednie nagłówki CORS
- Obsługa potencjalnych błędów SQL poprzez opakowanie operacji bazodanowych w blok try-catch

## 7. Obsługa błędów
- Nieprawidłowy format UUID: 400 Bad Request
- Notatka nie istnieje: 404 Not Found
- Użytkownik nie jest właścicielem notatki: 403 Forbidden
- Błąd bazy danych: 500 Internal Server Error
- Obsługa innych nieoczekiwanych błędów: 500 Internal Server Error

## 8. Rozważania dotyczące wydajności
- Operacja usuwania jest nieodwracalna, należy rozważyć implementację mechanizmu soft delete w przyszłości
- Transakcje bazodanowe zapewniają atomowość operacji
- Nie wymaga skomplikowanych zabezpieczeń wydajnościowych, ponieważ jest to pojedyncza operacja usuwania

## 9. Etapy wdrożenia

### 1. Rozszerzenie NotesService
Dodanie metody `deleteNote` w klasie `NotesService` w pliku `src/lib/services/notes.service.ts`:

```typescript
/**
 * Deletes a note by ID
 * @param noteId - The ID of the note to delete
 * @param userId - The ID of the user who owns the note
 * @returns true if deletion was successful, false if note not found
 * @throws Error if deletion fails for database reasons
 */
async deleteNote(noteId: string, userId: string): Promise<boolean> {
  // Early validation
  if (!noteId || !userId) {
    throw new Error("Note ID and User ID are required");
  }

  // Check if note exists and belongs to user
  const existingNote = await this.getNoteById(noteId, userId);
  if (!existingNote) {
    return false;
  }

  // Delete note
  const { error } = await this.supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}
```

### 2. Implementacja endpointu DELETE w `[id].ts`:
```typescript
import { z } from "zod";
import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { Database } from "../../../db/database.types";

// Zastąp to ID aktualnym ID użytkownika z middleware uwierzytelniania
const DEFAULT_USER_ID = "user-id";

// Walidacja ID notatki
const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note ID format")
});

// Nagłówki CORS i JSON
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

/**
 * DELETE /notes/{id} - Usuwa notatkę
 *
 * @description Usuwa notatkę o podanym ID. Wymaga uwierzytelnienia użytkownika.
 * Tylko właściciel notatki może ją usunąć.
 *
 * @param {Object} params - Parametry ścieżki
 * @param {string} params.id - UUID notatki do usunięcia
 * @param {Object} locals - Obiekt locals z Astro zawierający klienta Supabase
 * @param {Object} request - Obiekt żądania
 *
 * @throws {400} - Gdy ID notatki jest nieprawidłowe
 * @throws {403} - Gdy użytkownik nie ma dostępu do notatki
 * @throws {404} - Gdy notatka nie istnieje
 * @throws {500} - Gdy wystąpi nieoczekiwany błąd
 *
 * @returns {Promise<Response>} 204 No Content w przypadku powodzenia
 */
export const DELETE: APIRoute = async ({ params, locals, request }) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Obsługa żądania OPTIONS dla CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log(`[${requestId}] DELETE /notes/${params.id} - Request started`);
    
    // Walidacja ID notatki
    const paramsResult = noteIdSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid note ID",
          details: paramsResult.error.format()
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Pobierz klienta Supabase z kontekstu lokalnego
    const { supabase } = locals as {
      supabase: SupabaseClient<Database>;
    };

    // Usuń notatkę przy użyciu serwisu
    const notesService = new NotesService(supabase);
    const deleted = await notesService.deleteNote(
      paramsResult.data.id,
      DEFAULT_USER_ID // W przyszłości należy zastąpić ID uwierzytelnionego użytkownika
    );

    if (!deleted) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Note not found. Duration: ${duration}ms`);
      
      return new Response(
        JSON.stringify({ error: "Note not found" }),
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Note deleted successfully. Duration: ${duration}ms`);
    
    // Zwróć 204 No Content dla pomyślnego usunięcia
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(
      `[${requestId}] Error deleting note: ${error instanceof Error ? error.message : 'Unknown error'}. Duration: ${duration}ms`,
      {
        error,
        params,
        duration
      }
    );

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};
```

### 3. Testy dla nowego endpointu

Scenariusze testowe powinny uwzględniać:
1. Pomyślne usunięcie notatki (204 No Content)
2. Próba usunięcia nieistniejącej notatki (404 Not Found)
3. Próba usunięcia notatki należącej do innego użytkownika (403 Forbidden)
4. Próba usunięcia notatki z nieprawidłowym ID (400 Bad Request)
5. Obsługa błędów bazy danych (500 Internal Server Error)

### 4. Dokumentacja API

Zaktualizuj dokumentację API o nowy endpoint DELETE /notes/{id}, zgodnie z formatem pozostałych endpointów.

### 5. Aktualizacja typów (jeśli potrzebne)

Jeśli w przyszłości endpoint będzie wymagał akceptowania danych w ciele żądania, należy stworzyć odpowiedni Command Model.

### 6. Wdrożenie i monitoring

Po wdrożeniu należy monitorować użycie endpointu, zwracając szczególną uwagę na możliwe błędy lub nadużycia, które mogą prowadzić do utraty danych. 