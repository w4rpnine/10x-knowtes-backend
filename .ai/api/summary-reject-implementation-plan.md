# API Endpoint Implementation Plan: PUT /summary-stats/{id}/reject

## 1. Przegląd punktu końcowego
Endpoint umożliwia odrzucenie wygenerowanego podsumowania dla notatek w danym temacie. Gdy użytkownik odrzuca podsumowanie, rekord w tabeli `summary_stats` zostaje zaktualizowany z ustawieniem flagi `accepted` na `false`.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/api/summary/{id}/reject`
- Parametry:
  - Wymagane: `id` (UUID) - identyfikator rekordu podsumowania w tabeli `summary_stats`
  - Opcjonalne: brak
- Request Body: pusty obiekt ({}), zgodnie z typem `RejectSummaryCommand`

## 3. Wykorzystywane typy
- **RejectSummaryCommand**: `Record<string, never>` - pusty obiekt
- **SummaryStatDTO**: reprezentuje rekord z tabeli `summary_stats`

## 4. Szczegóły odpowiedzi
- Status: 200 OK
- Response Body:
  ```json
  {
    "id": "uuid",
    "topic_id": "uuid",
    "summary_note_id": "uuid lub null",
    "generated_at": "timestamp",
    "accepted": false,
    "user_id": "uuid"
  }
  ```

## 5. Przepływ danych
1. Walidacja parametru `id` jako poprawnego UUID
2. Walidacja pustego ciała żądania
3. Sprawdzenie czy rekord `summary_stats` istnieje i należy do zalogowanego użytkownika
4. Sprawdzenie czy powiązana notatka jest rzeczywiście podsumowaniem (`is_summary = true`)
5. Aktualizacja rekordu w tabeli `summary_stats` z ustawieniem `accepted = false`
6. Zwrócenie zaktualizowanego rekordu podsumowania

## 6. Względy bezpieczeństwa
- Walidacja parametru `id` jako poprawnego UUID
- Sprawdzenie czy użytkownik jest właścicielem rekordu podsumowania
- Użycie klienta Supabase z kontekstu `locals` dla zapewnienia bezpieczeństwa zapytań do bazy danych
- Walidacja ciała żądania przy użyciu Zod, aby zapobiec atakowi polegającemu na wstrzyknięciu nieprawidłowych danych

## 7. Obsługa błędów
- 400 Bad Request:
  - Nieprawidłowy format UUID w parametrze `id`
  - Niepuste ciało żądania
- 404 Not Found:
  - Podsumowanie nie istnieje
  - Podsumowanie nie należy do użytkownika
  - Powiązana notatka nie jest podsumowaniem
- 500 Internal Server Error:
  - Błąd podczas aktualizacji rekordu w bazie danych
  - Nieoczekiwane błędy serwera

## 8. Rozważania dotyczące wydajności
- Pojedyncze zapytanie do bazy danych w celu sprawdzenia istnienia podsumowania i jego właściciela
- Pojedyncza operacja aktualizacji w bazie danych
- Brak zewnętrznych zależności lub dodatkowych operacji, które mogłyby wpłynąć na wydajność

## 9. Etapy wdrożenia
1. Rozszerzenie funkcji w serwisie `summary.service.ts`:
   - Dodanie funkcji `rejectSummary` analogicznej do istniejącej funkcji `acceptSummary`
   - Funkcja powinna:
     - Sprawdzić czy rekord istnieje i należy do użytkownika
     - Sprawdzić czy powiązana notatka jest podsumowaniem
     - Zaktualizować rekord z `accepted = false`
     - Zwrócić zaktualizowany rekord lub `null` w przypadku błędu

2. Utworzenie pliku `src/pages/api/summary/[id]/reject.ts`:
   - Zdefiniowanie schematu walidacji parametrów URL (uuid)
   - Zdefiniowanie schematu walidacji ciała żądania (pusty obiekt)
   - Implementacja obsługi metody HTTP PUT
   - Obsługa zapytań CORS preflight
   - Walidacja danych wejściowych
   - Wywołanie funkcji serwisu `rejectSummary`
   - Obsługa i formatowanie odpowiedzi
   - Obsługa potencjalnych błędów z odpowiednimi kodami statusu HTTP

3. Testy:
   - Test jednostkowy dla funkcji `rejectSummary` w serwisie
   - Test integracyjny dla endpointu `/api/summary/{id}/reject`
   - Testy scenariuszy błędów (nieprawidłowy UUID, nieistniejący rekord, itp.) 