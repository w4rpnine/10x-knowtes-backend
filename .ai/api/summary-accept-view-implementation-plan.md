# API Endpoint Implementation Plan: PUT /summary/{id}/accept

## 1. Przegląd punktu końcowego
Endpoint służy do akceptacji wygenerowanego podsumowania (summary) przez użytkownika. Po akceptacji, status podsumowania w tabeli `summary_stats` zostanie zaktualizowany jako zaakceptowany (`accepted = true`).

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/summary/{id}/accept`
- Parametry:
  - Wymagane: `id` (UUID podsumowania w ścieżce URL)
  - Opcjonalne: brak
- Request Body: puste ciało żądania (zgodnie z `AcceptSummaryCommand = Record<string, never>`)

## 3. Wykorzystywane typy
- `AcceptSummaryCommand`: pusty obiekt typu Record dla ciała żądania (już zdefiniowany w types.ts)
- `SummaryStatDTO`: typ odpowiedzi zawierający informacje o zaakceptowanym podsumowaniu
- `SummaryStatEntity`: bazowy typ encji z bazy danych

## 4. Szczegóły odpowiedzi
- Kod statusu: 200 OK (w przypadku powodzenia)
- Format odpowiedzi:
  ```json
  {
    "id": "uuid",
    "topic_id": "uuid",
    "note_id": "uuid",
    "generated_at": "timestamp",
    "accepted": true
  }
  ```
- Typ zwracany: `SummaryStatDTO`

## 5. Przepływ danych
1. Otrzymanie żądania PUT z parametrem `id` w ścieżce
2. Walidacja istnienia sesji użytkownika (użytkownik musi być zalogowany)
3. Pobranie rekordu `summary_stats` z bazy danych na podstawie ID
4. Weryfikacja, czy podsumowanie należy do zalogowanego użytkownika
5. Aktualizacja rekordu `summary_stats`, ustawiając `accepted = true`
6. Zwrócenie zaktualizowanego rekordu jako odpowiedzi

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Wymagana aktywna sesja użytkownika
- Autoryzacja: Sprawdzenie czy podsumowanie należy do zalogowanego użytkownika
- Walidacja danych: Sprawdzenie poprawności UUID podsumowania
- Obsługa błędów CSRF: Zapewniona przez middleware Astro

## 7. Obsługa błędów
- 400 Bad Request: Nieprawidłowy format UUID
- 401 Unauthorized: Brak uwierzytelnienia (użytkownik nie jest zalogowany)
- 403 Forbidden: Użytkownik nie ma uprawnień do tego podsumowania
- 404 Not Found: Podsumowanie o podanym ID nie istnieje
- 500 Internal Server Error: Nieoczekiwany błąd serwera podczas aktualizacji

## 8. Rozważania dotyczące wydajności
- Operacja jest prosta i szybka, wymaga jedynie jednej aktualizacji w bazie danych
- Nie wymaga przetwarzania dużych ilości danych
- Dobrym pomysłem jest dodanie indeksu na kolumnie `id` w tabeli `summary_stats`

## 9. Etapy wdrożenia

### 1. Implementacja funkcji serwisowej w summary.service.ts

```typescript
/**
 * Akceptuje wygenerowane podsumowanie.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the user accepting the summary
 * @param summaryId - The ID of the summary to accept
 * @returns The updated summary stat record or null if not found or not owned by user
 */
export async function acceptSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  summaryId: string
): Promise<SummaryStatDTO | null> {
  // Sprawdź czy podsumowanie istnieje i należy do użytkownika
  const { data: existingSummary, error: fetchError } = await supabase
    .from("summary_stats")
    .select("*")
    .eq("id", summaryId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingSummary) {
    return null;
  }

  // Aktualizuj rekord, ustawiając accepted = true
  const { data: updatedSummary, error: updateError } = await supabase
    .from("summary_stats")
    .update({ accepted: true })
    .eq("id", summaryId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedSummary;
}
```

### 2. Utworzenie katalogu dla endpointów podsumowań
Utworzenie katalogu `src/pages/api/summary` jeśli jeszcze nie istnieje.

### 3. Implementacja endpointu API

Utworzenie pliku `src/pages/api/summary/[id]/accept.ts`:

```typescript
import { z } from "zod";
import { acceptSummary } from "../../../../lib/services/summary.service";
import type { APIContext } from "astro";
import type { AcceptSummaryCommand, SummaryStatDTO } from "../../../../types";

export const prerender = false;

// Schemat walidacji parametru ID
const paramsSchema = z.object({
  id: z.string().uuid("ID podsumowania musi być poprawnym UUID")
});

// Schemat walidacji pustego ciała żądania
const bodySchema = z.object({}).strict();

export async function PUT({ locals, params, request }: APIContext) {
  // Sprawdź czy użytkownik jest zalogowany
  if (!locals.session?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Brak dostępu" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Walidacja parametrów URL
  const paramsResult = paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    return new Response(
      JSON.stringify({ 
        error: "Bad Request", 
        message: "Nieprawidłowy format ID podsumowania",
        details: paramsResult.error.format()
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Walidacja ciała żądania (powinno być puste)
  try {
    const body: AcceptSummaryCommand = await request.json();
    const bodyResult = bodySchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Ciało żądania powinno być puste", 
          details: bodyResult.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    // Brak ciała lub nieprawidłowy JSON są akceptowalne, ponieważ oczekujemy pustego ciała
  }

  // Pobierz ID użytkownika i podsumowania
  const { id: summaryId } = paramsResult.data;
  const userId = locals.session.user.id;

  try {
    // Wywołaj funkcję serwisu do akceptacji podsumowania
    const summary = await acceptSummary(locals.supabase, userId, summaryId);

    // Jeśli nie znaleziono podsumowania lub nie należy do użytkownika
    if (!summary) {
      return new Response(
        JSON.stringify({ 
          error: "Not Found", 
          message: "Nie znaleziono podsumowania lub brak uprawnień" 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Zwróć zaktualizowane podsumowanie
    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error accepting summary:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: "Wystąpił błąd podczas akceptacji podsumowania" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### 4. Testy endpointu

Testy powinny obejmować następujące scenariusze:
1. Pomyślna akceptacja podsumowania przez właściciela
2. Próba akceptacji nieistniejącego podsumowania
3. Próba akceptacji podsumowania bez uwierzytelnienia
4. Próba akceptacji podsumowania należącego do innego użytkownika
5. Próba akceptacji z niepoprawnym UUID
6. Próba akceptacji z nieprawidłowym ciałem żądania (nieoczekiwane pola)

### 5. Dokumentacja API

Zaktualizowanie dokumentacji API o nowy endpoint PUT /summary/{id}/accept z odpowiednimi szczegółami żądania, odpowiedzi i obsługą błędów. 