# API Endpoint Implementation Plan: Accept Generated Summary

## 1. Przegląd punktu końcowego

Punktu końcowy `PUT /topics/{topicId}/summaries/{summaryId}/accept` służy do zaakceptowania wygenerowanego przez AI podsumowania notatek dla danego tematu. Po zaakceptowaniu podsumowania, status jest aktualizowany w bazie danych, a podsumowanie jest zapisywane jako notatka z flagą `is_summary` ustawioną na `true`. Punkt końcowy jest krytycznym elementem cyklu życia podsumowań w aplikacji, ponieważ pozwala użytkownikom zatwierdzić wygenerowane podsumowania do przyszłego użycia.

## 2. Szczegóły żądania

- Metoda HTTP: `PUT`
- Struktura URL: `/topics/{topicId}/summaries/{summaryId}/accept`
- Parametry:
  - Wymagane:
    - `topicId` (UUID, część ścieżki) - identyfikator tematu
    - `summaryId` (UUID, część ścieżki) - identyfikator statystyki podsumowania
  - Opcjonalne: brak
- Request Body: Pusty obiekt (zgodnie z `AcceptSummaryCommand`)

## 3. Wykorzystywane typy

- `AcceptSummaryCommand` - pusty obiekt (istniejący)
- `summaryAcceptParamsSchema` - do walidacji parametrów ścieżki URL (zostanie utworzony)
- `SupabaseClient` - do interakcji z bazą danych (istniejący)

## 4. Szczegóły odpowiedzi

- Sukces (201 Created):
  ```json
  {
    "summary_stat_id": "uuid"
  }
  ```
- Błędy:
  - 400 Bad Request - Nieprawidłowy format UUID lub inne błędy walidacji
  - 401 Unauthorized - Użytkownik nie jest uwierzytelniony
  - 403 Forbidden - Użytkownik nie ma dostępu do wskazanego tematu lub podsumowania
  - 404 Not Found - Temat, podsumowanie lub statystyki podsumowania nie istnieją
  - 500 Internal Server Error - Błąd serwera podczas przetwarzania

## 5. Przepływ danych

1. Walidacja parametrów ścieżki URL oraz ciała żądania.
2. Sprawdzenie, czy temat istnieje i należy do zalogowanego użytkownika.
3. Sprawdzenie, czy rekord statystyki podsumowania istnieje i należy do zalogowanego użytkownika.
4. Aktualizacja rekordu statystyki podsumowania przez ustawienie `accepted = true`.
5. Utworzenie nowej notatki z flagą `is_summary = true` zawierającej zaakceptowane podsumowanie.
6. Aktualizacja rekordu statystyki podsumowania przez ustawienie `summary_note_id` na ID utworzonej notatki.
7. Zwrócenie odpowiedzi z identyfikatorem statystyki podsumowania.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Punkt końcowy wymaga uwierzytelnionego użytkownika.
- Autoryzacja: Sprawdzanie, czy użytkownik ma dostęp do wskazanego tematu i statystyki podsumowania.
- Walidacja danych wejściowych: Wszystkie parametry ścieżki są walidowane przed przetworzeniem.
- RLS: Bezpieczeństwo na poziomie wierszy jest już zaimplementowane w bazie danych.

## 7. Obsługa błędów

- Walidacja parametrów ścieżki:
  - Nieprawidłowy format UUID - 400 Bad Request
- Sprawdzanie dostępu:
  - Temat nie istnieje - 404 Not Found
  - Brak dostępu do tematu - 403 Forbidden
  - Statystyka podsumowania nie istnieje - 404 Not Found
  - Brak dostępu do statystyki podsumowania - 403 Forbidden
- Problemów z bazą danych:
  - Błędy podczas operacji bazodanowych - 500 Internal Server Error
- Dokumentacja błędów:
  - Wszystkie błędy są rejestrowane z odpowiednim kontekstem

## 8. Rozważania dotyczące wydajności

- Wykorzystanie transakcji bazy danych do zapewnienia atomowości operacji aktualizacji statystyki podsumowania i utworzenia notatki.
- Minimalizacja liczby zapytań do bazy danych poprzez optymalne wykorzystanie operacji Supabase.
- Odpowiednia obsługa błędów dla zapewnienia stabilności i odporności na błędy.

## 9. Etapy wdrożenia

1. Utworzenie pliku dla endpointu `src/pages/api/topics/[topicId]/summaries/[summaryId]/accept.ts`.
2. Dodanie schematu walidacji parametrów w `src/lib/schemas/summary.schema.ts`.
3. Rozszerzenie `SummaryService` w `src/lib/services/summary.service.ts` o metodę `acceptSummary`.
4. Implementacja logiki punktu końcowego zgodnie z przepływem danych.
5. Dodanie obsługi błędów i walidacji.
6. Implementacja transakcji bazodanowej dla atomowych operacji.
7. Testy jednostkowe i integracyjne.
8. Dokumentacja i przykłady użycia.

## 10. Przykładowa Implementacja

### Schema (summary.schema.ts)
```typescript
export const summaryAcceptParamsSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID format"),
  summaryId: z.string().uuid("Invalid summary ID format")
});

export type SummaryAcceptParams = z.infer<typeof summaryAcceptParamsSchema>;
```

### Service (summary.service.ts)
```typescript
async acceptSummary(
  userId: string,
  topicId: string,
  summaryId: string
): Promise<{ summary_stat_id: string }> {
  // 1. Verify topic and summary stat exist and belong to user
  // 2. Update summary stat to accepted=true
  // 3. Create summary note
  // 4. Update summary_stat with summary_note_id
  // 5. Return summary_stat_id
}
```

### Endpoint (accept.ts)
```typescript
export const PUT: APIRoute = async (context) => {
  try {
    // 1. Validate params
    // 2. Get user ID
    // 3. Call service
    // 4. Return response
  } catch (error) {
    return handleAPIError(error);
  }
};
``` 