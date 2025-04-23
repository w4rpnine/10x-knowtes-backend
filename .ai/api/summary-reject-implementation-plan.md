# API Endpoint Implementation Plan: PUT /topics/{topicId}/summaries/{summaryId}/reject

## 1. Przegląd punktu końcowego
Endpoint służy do odrzucenia wygenerowanego podsumowania dla danego tematu. Po odrzuceniu, podsumowanie nie będzie dostępne dla użytkownika, a jego status zostanie zaktualizowany w bazie danych. Umożliwia to użytkownikowi zignorowanie wygenerowanych podsumowań, które nie spełniają jego oczekiwań.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/topics/{topicId}/summaries/{summaryId}/reject`
- Parametry ścieżki:
  - `topicId` (UUID, wymagane): Identyfikator tematu
  - `summaryId` (UUID, wymagane): Identyfikator statystyki podsumowania
- Request Body: Puste ciało żądania (wykorzystujemy typ `RejectSummaryCommand` z `types.ts`, który jest pustym obiektem)

## 3. Wykorzystywane typy
- **Modele wejściowe**:
  - `RejectSummaryCommand` z `src/types.ts` - pusty obiekt typu Record<string, never>
- **Modele wyjściowe**:
  - Odpowiedź zawierająca `summary_stat_id` (UUID)

## 4. Szczegóły odpowiedzi
- Sukces (204 No Content): Brak zawartości w odpowiedzi
- Błędy:
  - 400 Bad Request: Nieprawidłowe parametry lub podsumowanie nie należy do tematu
  - 401 Unauthorized: Brak autoryzacji
  - 403 Forbidden: Użytkownik nie ma dostępu do tematu lub podsumowania
  - 404 Not Found: Temat lub podsumowanie nie istnieje
  - 500 Internal Server Error: Błąd wewnętrzny serwera

## 5. Przepływ danych
1. Walidacja parametrów ścieżki (topicId, summaryId) za pomocą Zod
2. Weryfikacja czy temat istnieje i należy do zalogowanego użytkownika
3. Weryfikacja czy podsumowanie istnieje i należy do zalogowanego użytkownika
4. Sprawdzenie czy podsumowanie należy do podanego tematu
5. Usunięcie podsumowania z bazy danych (aktualizacja rekordu summary_stats)
6. Zwrócenie odpowiedzi z kodem 204 No Content

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wykorzystanie middleware Astro do weryfikacji sesji użytkownika
- **Autoryzacja**: Sprawdzenie czy temat i podsumowanie należą do zalogowanego użytkownika
- **Walidacja danych**: Użycie Zod do walidacji parametrów ścieżki
- **Sanityzacja**: Parametry są walidowane jako UUID, co zapobiega SQL Injection
- **CORS**: Obsługa żądań OPTIONS dla Cross-Origin Resource Sharing

## 7. Obsługa błędów
- Nieprawidłowy format UUID: 400 Bad Request z komunikatem o błędzie
- Brak tematu lub brak dostępu: 403 Forbidden lub 404 Not Found
- Brak podsumowania lub brak dostępu: 403 Forbidden lub 404 Not Found
- Podsumowanie nie należy do podanego tematu: 400 Bad Request
- Błąd podczas aktualizacji bazy danych: 500 Internal Server Error

## 8. Rozważania dotyczące wydajności
- Użycie indeksów bazy danych dla szybkiego wyszukiwania tematów i podsumowań
- Minimalizacja ilości zapytań do bazy danych przez łączenie operacji
- Logowanie tylko istotnych błędów, aby uniknąć nadmiernego obciążenia systemu logów

## 9. Etapy wdrożenia

### 1. Rozszerzenie schematu walidacji

Dodanie schematu walidacji dla parametrów ścieżki w pliku `src/lib/schemas/summary.schema.ts`:

```typescript
// Schema for summary reject endpoint parameters
export const summaryRejectParamsSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID format"),
  summaryId: z.string().uuid("Invalid summary ID format"),
});
```

### 2. Rozszerzenie SummaryService

Dodanie metody `rejectSummary` w klasie `SummaryService` w pliku `src/lib/services/summary.service.ts`:

```typescript
/**
 * Rejects a generated summary for a topic
 * @param userId User ID (currently using DEFAULT_USER_ID for development)
 * @param topicId Topic ID
 * @param summaryId Summary stat ID
 * @returns void
 * @throws APIError for various error conditions
 */
async rejectSummary(
  _userId: string,
  topicId: string,
  summaryId: string
): Promise<{ summary_stat_id: string }> {
  // Using DEFAULT_USER_ID for development/testing
  const userId = DEFAULT_USER_ID;

  // 1. Verify topic exists and belongs to user
  const { data: topic, error: topicError } = await this.supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (topicError) {
    if (topicError.code === "PGRST116") {
      throw new APIError("Topic not found", 404);
    }
    throw new APIError(`Failed to fetch topic: ${topicError.message}`, 500);
  }

  if (!topic) {
    throw new APIError("Topic not found or access denied", 403);
  }

  // 2. Verify summary stat exists and belongs to user
  const { data: summaryStat, error: summaryStatError } = await this.supabase
    .from("summary_stats")
    .select("id, topic_id")
    .eq("id", summaryId)
    .eq("user_id", userId)
    .single();

  if (summaryStatError) {
    if (summaryStatError.code === "PGRST116") {
      throw new APIError("Summary not found", 404);
    }
    throw new APIError(`Failed to fetch summary: ${summaryStatError.message}`, 500);
  }

  if (!summaryStat) {
    throw new APIError("Summary not found or access denied", 403);
  }

  // 3. Ensure the summary belongs to the specified topic
  if (summaryStat.topic_id !== topicId) {
    throw new APIError("Summary does not belong to the specified topic", 400);
  }

  // 4. Delete the summary stat record
  const { error: deleteError } = await this.supabase
    .from("summary_stats")
    .delete()
    .eq("id", summaryId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new APIError(`Failed to delete summary: ${deleteError.message}`, 500);
  }

  // 5. Return the summary stat ID
  return { summary_stat_id: summaryId };
}
```

### 3. Implementacja endpointu

Utworzenie pliku `src/pages/api/topics/[topicId]/summaries/[summaryId]/reject.ts`:

```typescript
import type { APIRoute } from "astro";
import { SummaryService } from "../../../../../../lib/services/summary.service";
import { handleAPIError } from "../../../../../../lib/utils/error-handling";
import { summaryRejectParamsSchema } from "../../../../../../lib/schemas/summary.schema";
import { DEFAULT_USER_ID } from "../../../../../../db/supabase.client";

export const prerender = false;

/**
 * PUT /topics/{topicId}/summaries/{summaryId}/reject
 *
 * Rejects a generated summary for a topic, removing it from the database.
 *
 * @param context - The Astro API context
 * @returns Response with no content (204)
 *
 * @throws {APIError} 400 - If validation fails or summary doesn't belong to topic
 * @throws {APIError} 401 - If user is not authenticated
 * @throws {APIError} 403 - If user doesn't have access to topic or summary
 * @throws {APIError} 404 - If topic or summary doesn't exist
 * @throws {APIError} 500 - If an error occurs during processing
 */
export const PUT: APIRoute = async (context) => {
  try {
    // For development purposes, we're using DEFAULT_USER_ID and skipping auth check
    // In production, uncomment the following:
    // requireAuth(context);
    // const userId = context.locals.session?.user.id;
    // if (!userId) {
    //   throw new APIError("User ID is required", 401);
    // }

    const userId = DEFAULT_USER_ID;

    // Validate URL parameters
    const params = summaryRejectParamsSchema.parse({
      topicId: context.params.topicId,
      summaryId: context.params.summaryId,
    });

    // Create service and reject summary
    const summaryService = new SummaryService(context.locals.supabase);
    await summaryService.rejectSummary(userId, params.topicId, params.summaryId);

    // Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleAPIError(error);
  }
};
```

### 4. Testowanie

Testowanie endpointu za pomocą narzędzi takich jak Postman lub curl:

```bash
curl -X PUT http://localhost:4321/api/topics/{topicId}/summaries/{summaryId}/reject \
  -H "Content-Type: application/json"
```

Scenariusze testowe:
1. Pomyślne odrzucenie podsumowania (204 No Content)
2. Próba odrzucenia nieistniejącego podsumowania (404 Not Found)
3. Próba odrzucenia podsumowania bez uprawnień (403 Forbidden)
4. Próba odrzucenia podsumowania z nieprawidłowym identyfikatorem (400 Bad Request)
5. Próba odrzucenia podsumowania, które nie należy do podanego tematu (400 Bad Request)

### 5. Dokumentacja

Zaktualizowanie dokumentacji API o nowy endpoint PUT /topics/{topicId}/summaries/{summaryId}/reject. 