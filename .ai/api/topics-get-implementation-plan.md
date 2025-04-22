# API Endpoint Implementation Plan: GET /topics

## 1. Przegląd punktu końcowego
Endpoint GET /topics umożliwia pobranie listy wszystkich tematów dla zalogowanego użytkownika z opcjonalnym filtrowaniem i paginacją. Zapewnia dostęp do podstawowych metadanych tematów oraz wszystkich notatek przypisanych do każdego tematu.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/topics`
- Parametry:
  - Opcjonalne:
    - `limit` (integer): Maksymalna liczba wyników do zwrócenia (domyślnie: 50)
    - `offset` (integer): Offset dla paginacji (domyślnie: 0)
- Wymagania autoryzacyjne: Wymagane uwierzytelnienie użytkownika

## 3. Wykorzystywane typy
```typescript
// Typy odpowiedzi
import { TopicDTO, NoteDTO, PaginatedTopicsResponseDTO } from "../../types";

// Typy walidacji parametrów zapytania
import { z } from "zod";

const topicsQuerySchema = z.object({
  limit: z.coerce.number().positive().default(50),
  offset: z.coerce.number().nonnegative().default(0)
});

type TopicsQueryParams = z.infer<typeof topicsQuerySchema>;
```

## 4. Szczegóły odpowiedzi
- Status sukcesu: 200 OK
- Format odpowiedzi: JSON
- Struktura:
```json
{
  "data": [
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
          "is_summary": "boolean",
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "topic_id": "uuid"
        }
      ]
    }
  ],
  "count": "integer",
  "total": "integer"
}
```
- Kody błędów:
  - 400: Nieprawidłowe parametry zapytania
  - 401: Brak autoryzacji
  - 500: Błąd serwera

## 5. Przepływ danych
1. Walidacja parametrów zapytania przy użyciu Zod
2. Uwierzytelnienie użytkownika poprzez middleware Supabase
3. Zapytanie do bazy danych o tematy użytkownika wraz z ich notatkami
   - Zastosowanie paginacji (limit/offset)
   - Dołączenie notatek poprzez relację w Supabase
4. Konwersja danych encji do DTO
5. Formatowanie odpowiedzi paginowanej
6. Zwrócenie danych w formacie JSON

## 6. Względy bezpieczeństwa
- Uwierzytelnienie: Każde żądanie musi zawierać ważny token JWT w nagłówku
- Autoryzacja: Użytkownicy mogą widzieć tylko własne tematy (filtrowanie przez user_id)
- Walidacja danych wejściowych: Wszystkie parametry zapytania są walidowane przez Zod
- Ochrona przed atakami wstrzykiwania SQL: Używanie parametryzowanych zapytań Supabase
- Weryfikacja parametrów typu UUID przy użyciu walidacji Zod
- Ograniczenie rozmiaru odpowiedzi poprzez paginację

## 7. Obsługa błędów
- Walidacja parametrów zapytania:
  - Jeśli parametry są nieprawidłowe, zwróć 400 z informacją o błędzie
- Uwierzytelnienie:
  - Jeśli token nie jest obecny lub jest nieprawidłowy, zwróć 401
- Zapytanie do bazy danych:
  - Obsługa błędów połączenia lub zapytania, zwracając 500 z ogólną informacją o błędzie
  - Logowanie szczegółów błędu po stronie serwera

## 8. Rozważania dotyczące wydajności
- Paginacja: Ograniczenie liczby zwracanych rekordów
- Indeksowanie: Upewnienie się, że kolumny user_id i topic_id są zaindeksowane
- Selektywne pobieranie kolumn: Wybieranie tylko wymaganych kolumn
- Optymalizacja zapytań JOIN: Efektywne łączenie tematów z notatkami
- Pamięć podręczna:
  - Rozważenie pamięci podręcznej po stronie klienta z nagłówkami Cache-Control
  - Potencjalne dodanie pamięci podręcznej po stronie serwera dla częstych zapytań

## 9. Etapy wdrożenia
1. Utworzenie katalogu dla usług (jeśli nie istnieje):
   ```bash
   mkdir -p src/lib/services
   ```

2. Stworzenie usługi dla tematów (`src/lib/services/topics.service`):
   ```typescript
   import type { TopicDTO, PaginatedTopicsResponseDTO } from "../../types";
   import type { SupabaseClient } from "../../db/supabase.client";
   
   export interface TopicsQueryParams {
     limit?: number;
     offset?: number;
   }
   
   export async function getTopics(
     supabase: SupabaseClient,
     userId: string,
     params: TopicsQueryParams
   ): Promise<PaginatedTopicsResponseDTO> {
     const { limit = 50, offset = 0 } = params;
     
     // Przygotowanie zapytania z filtrowaniem według user_id i dołączeniem notatek
     let query = supabase
       .from("topics")
       .select(`
         *,
         notes (*)
       `, { count: "exact" })
       .eq("user_id", userId);
     
     // Paginacja
     query = query.range(offset, offset + limit - 1);
     
     // Sortowanie według daty utworzenia
     query = query.order("created_at", { ascending: false });
     
     // Wykonanie zapytania
     const { data, count, error } = await query;
     
     if (error) {
       throw error;
     }
     
     // Tworzenie obiektów DTO z zagnieżdżonymi notatkami
     const topicDTOs: TopicDTO[] = data.map(topic => ({
       ...topic,
       notes: topic.notes || []
     }));
     
     return {
       data: topicDTOs,
       count: topicDTOs.length,
       total: count || 0
     };
   }
   ```

3. Utworzenie katalogu API (jeśli nie istnieje):
   ```bash
   mkdir -p src/pages/api
   ```

4. Implementacja endpointu (`src/pages/api/topics/index.ts`):
   ```typescript
   import { getTopics } from "../../../lib/services/topics.service";
   import type { APIRoute } from "astro";
   import { z } from "zod";
   
   export const prerender = false;
   
   const topicsQuerySchema = z.object({
     limit: z.coerce.number().positive().default(50),
     offset: z.coerce.number().nonnegative().default(0)
   });
   
   export const GET: APIRoute = async ({ request, locals }) => {
     try {
       // Sprawdzenie uwierzytelnienia
       const { supabase, session } = locals;
       
       if (!session) {
         return new Response(
           JSON.stringify({ error: "Unauthorized" }),
           { status: 401, headers: { "Content-Type": "application/json" } }
         );
       }
       
       // Parsowanie i walidacja parametrów zapytania
       const url = new URL(request.url);
       const result = topicsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
       
       if (!result.success) {
         return new Response(
           JSON.stringify({ 
             error: "Invalid query parameters", 
             details: result.error.format()
           }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }
       
       // Pobieranie tematów użytkownika
       const topics = await getTopics(
         supabase,
         session.user.id,
         result.data
       );
       
       // Zwracanie odpowiedzi
       return new Response(
         JSON.stringify(topics),
         { status: 200, headers: { "Content-Type": "application/json" } }
       );
     } catch (error) {
       console.error("Error fetching topics:", error);
       
       return new Response(
         JSON.stringify({ error: "Internal server error" }),
         { status: 500, headers: { "Content-Type": "application/json" } }
       );
     }
   };
   ```

5. Aktualizacja middlewara (jeśli potrzebne):
   Upewnij się, że middleware odpowiednio inicjalizuje Supabase i obsługuje uwierzytelnianie.

6. Dodanie testów jednostkowych dla usługi i kontrolera.

7. Dokumentacja endpointu w wewnętrznej dokumentacji API.

8. Wdrożenie i monitorowanie wydajności po uruchomieniu. 