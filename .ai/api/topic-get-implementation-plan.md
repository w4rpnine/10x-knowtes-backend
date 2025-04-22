# API Endpoint Implementation Plan: GET /topics/{id}

## 1. Przegląd punktu końcowego
Endpoint GET /topics/{id} umożliwia pobranie szczegółów konkretnego tematu wraz ze wszystkimi przypisanymi do niego notatkami. Endpoint zapewnia dostęp do pełnych metadanych tematu oraz wszystkich powiązanych notatek. Jest to kluczowy endpoint dla funkcjonalności wyświetlania szczegółów pojedynczego tematu w aplikacji.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/topics/{id}`
- Parametry:
  - Wymagane:
    - `id` (UUID): Identyfikator tematu w ścieżce URL
- Wymagania autoryzacyjne: Wymagane uwierzytelnienie użytkownika

## 3. Wykorzystywane typy
```typescript
// Typy odpowiedzi
import { TopicDTO, NoteDTO } from "../../types";

// Typy walidacji parametrów zapytania
import { z } from "zod";

const topicIdSchema = z.string().uuid("Identyfikator tematu musi być poprawnym UUID");

type TopicIdParam = z.infer<typeof topicIdSchema>;
```

## 4. Szczegóły odpowiedzi
- Status sukcesu: 200 OK
- Format odpowiedzi: JSON
- Struktura:
```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "notes": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "is_summary": "boolean"
    }
  ]
}
```
- Kody błędów:
  - 400: Nieprawidłowy format identyfikatora tematu
  - 401: Brak autoryzacji
  - 403: Zabroniony dostęp (temat należy do innego użytkownika)
  - 404: Temat nie został znaleziony
  - 500: Błąd serwera

## 5. Przepływ danych
1. Walidacja parametru ID przy użyciu Zod
2. Uwierzytelnienie użytkownika poprzez middleware Supabase
3. Zapytanie do bazy danych o konkretny temat użytkownika wraz z powiązanymi notatkami
   - Sprawdzenie czy temat istnieje
   - Sprawdzenie czy temat należy do zalogowanego użytkownika
   - Dołączenie powiązanych notatek poprzez relację
4. Konwersja danych encji do DTO z zagnieżdżonymi notatkami
5. Zwrócenie danych w formacie JSON

## 6. Względy bezpieczeństwa
- Uwierzytelnienie: Każde żądanie musi zawierać ważny token JWT w nagłówku
- Autoryzacja: Użytkownicy mogą wyświetlać tylko własne tematy (filtrowanie przez user_id)
- Walidacja danych wejściowych: Parametr ID jest walidowany przez Zod
- Ochrona przed atakami wstrzykiwania SQL: Używanie parametryzowanych zapytań Supabase
- Weryfikacja formatu UUID: Zapobieganie próbom manipulacji identyfikatorami

## 7. Obsługa błędów
- Walidacja parametru ID:
  - Jeśli ID nie jest poprawnym UUID, zwróć 400 z informacją o błędzie
- Uwierzytelnienie:
  - Jeśli token nie jest obecny lub jest nieprawidłowy, zwróć 401
- Autoryzacja:
  - Jeśli temat nie należy do zalogowanego użytkownika, zwróć 403
- Temat nie znaleziony:
  - Jeśli temat nie istnieje, zwróć 404
- Zapytanie do bazy danych:
  - Obsługa błędów połączenia lub zapytania, zwracając 500 z ogólną informacją o błędzie
  - Logowanie szczegółów błędu po stronie serwera

## 8. Rozważania dotyczące wydajności
- Indeksowanie: 
  - Zapewnienie indeksów na kolumnach id i user_id w tabeli topics
  - Indeksowanie relacji między tematami a notatkami
- Selektywne pobieranie kolumn: Wybieranie tylko wymaganych kolumn z obu tabel
- Pamięć podręczna:
  - Rozważenie pamięci podręcznej po stronie klienta z nagłówkami Cache-Control
  - Potencjalne dodanie pamięci podręcznej po stronie serwera dla częstych zapytań

## 9. Etapy wdrożenia
1. Rozszerzenie usługi dla tematów (`src/lib/services/topics.service.ts`) o metodę pobierania pojedynczego tematu:
   ```typescript
   /**
    * Retrieves a single topic with all its notes for a specific user
    * @param supabase - The Supabase client instance
    * @param userId - The ID of the user
    * @param topicId - The ID of the topic to retrieve
    * @returns The topic with all its notes as a DTO
    */
   export async function getTopic(
     supabase: typeof supabaseClient,
     userId: string,
     topicId: string
   ): Promise<TopicDTO> {
     const { data, error } = await supabase
       .from("topics")
       .select(`
         *,
         notes (*)
       `)
       .eq("id", topicId)
       .eq("user_id", userId)
       .single();
     
     if (error) {
       if (error.code === "PGRST116") {
         throw new Error("Topic not found");
       }
       throw error;
     }
     
     return {
       ...data,
       notes: data.notes || []
     };
   }
   ```

2. Utworzenie katalogu dla endpointu (jeśli nie istnieje):
   ```bash
   mkdir -p src/pages/api/topics
   ```

3. Implementacja endpointu (`src/pages/api/topics/[id].ts`):
   ```typescript
   import { getTopic } from "../../../lib/services/topics.service";
   import type { APIRoute } from "astro";
   import { z } from "zod";
   
   export const prerender = false;
   
   const topicIdSchema = z.string().uuid("Identyfikator tematu musi być poprawnym UUID");
   
   export const GET: APIRoute = async ({ params, locals }) => {
     try {
       // Sprawdzenie uwierzytelnienia
       const { supabase, session } = locals;
       
       if (!session) {
         return new Response(
           JSON.stringify({ error: "Unauthorized" }),
           { status: 401, headers: { "Content-Type": "application/json" } }
         );
       }
       
       // Walidacja parametru ID
       const topicId = params.id;
       const parseResult = topicIdSchema.safeParse(topicId);
       
       if (!parseResult.success) {
         return new Response(
           JSON.stringify({ 
             error: "Invalid topic ID format", 
             details: parseResult.error.format() 
           }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }
       
       try {
         // Pobieranie tematu wraz z notatkami
         const topic = await getTopic(
           supabase,
           session.user.id,
           topicId
         );
         
         // Zwracanie odpowiedzi
         return new Response(
           JSON.stringify(topic),
           { status: 200, headers: { "Content-Type": "application/json" } }
         );
       } catch (error) {
         // Obsługa błędu, gdy temat nie został znaleziony
         if (error instanceof Error && error.message === "Topic not found") {
           return new Response(
             JSON.stringify({ error: "Topic not found" }),
             { status: 404, headers: { "Content-Type": "application/json" } }
           );
         }
         
         // Rzucanie błędu ponownie, aby obsłużyć go w głównym bloku catch
         throw error;
       }
     } catch (error) {
       console.error("Error fetching topic:", error);
       
       return new Response(
         JSON.stringify({ error: "Internal server error" }),
         { status: 500, headers: { "Content-Type": "application/json" } }
       );
     }
   };
   ```

4. Utworzenie testów jednostkowych dla nowej funkcji usługi i kontrolera.

5. Aktualizacja dokumentacji API o nowy endpoint.

6. Wdrożenie i monitorowanie wydajności po uruchomieniu. 