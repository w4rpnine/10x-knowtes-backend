# API Endpoint Implementation Plan: GET /topics/{topicId}/notes

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy notatek przypisanych do konkretnego tematu. Umożliwia filtrowanie notatek będących podsumowaniami oraz obsługuje paginację wyników.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/topics/{topicId}/notes`
- Parametry:
  - Wymagane: 
    - `topicId` (UUID, parametr ścieżki) - identyfikator tematu
  - Opcjonalne: 
    - `is_summary` (boolean, query) - filtrowanie notatek według statusu podsumowania
    - `limit` (integer, query) - maksymalna liczba wyników (domyślnie: 50)
    - `offset` (integer, query) - przesunięcie dla paginacji (domyślnie: 0)
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy
- `NoteDTO` - typ reprezentujący pojedynczą notatkę w odpowiedzi
- `PaginatedNotesResponseDTO` - typ reprezentujący paginowaną odpowiedź zawierającą notatki
- `Database["public"]["Tables"]["notes"]["Row"]` - typ encji notatki w bazie danych

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "topic_id": "uuid",
        "title": "string",
        "content": "string",
        "is_summary": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "count": "integer",
    "total": "integer"
  }
  ```
- Błędy:
  - 401 Unauthorized - brak autentykacji
  - 403 Forbidden - brak uprawnień do tematu
  - 404 Not Found - temat nie istnieje

## 5. Przepływ danych
1. Walidacja parametrów URL i query przy użyciu Zod
2. Sprawdzenie autentykacji użytkownika
3. Sprawdzenie czy temat istnieje w bazie danych
4. Sprawdzenie czy użytkownik ma dostęp do tematu
5. Pobranie notatek z tabeli `notes` z filtrami:
   - `topic_id` równy podanemu `topicId`
   - `is_summary` równy podanej wartości (jeśli podano)
   - Zastosowanie limitów paginacji (`limit` i `offset`)
6. Zliczenie wszystkich pasujących notatek (dla pola `total`)
7. Zwrócenie paginowanej odpowiedzi zawierającej dane notatek, liczbę zwróconych wyników (`count`) i łączną liczbę pasujących rekordów (`total`)

## 6. Względy bezpieczeństwa
- Sprawdzenie autentykacji użytkownika poprzez Supabase Auth
- Autoryzacja dostępu do tematu (upewnienie się, że temat należy do zalogowanego użytkownika)
- Walidacja parametrów wejściowych przy użyciu Zod, aby zapobiec atakom wstrzykiwania SQL i nieprawidłowym danym
- Korzystanie z Supabase Row Level Security (RLS) do dodatkowej warstwy zabezpieczeń na poziomie bazy danych
- Weryfikacja limitów paginacji, aby zapobiec atakom DoS

## 7. Obsługa błędów
- Nieprawidłowy format UUID dla `topicId`: 400 Bad Request z komunikatem o błędzie
- Nieprawidłowy typ dla `is_summary`, `limit` lub `offset`: 400 Bad Request z komunikatem o błędzie
- Brak autentykacji: 401 Unauthorized
- Brak dostępu do tematu: 403 Forbidden
- Temat nie istnieje: 404 Not Found
- Błędy bazy danych: 500 Internal Server Error z odpowiednim logowaniem błędu (bez ujawniania szczegółów w odpowiedzi)

## 8. Rozważania dotyczące wydajności
- Indeksowanie tabeli `notes` według kolumn `topic_id` i `is_summary` dla szybszego filtrowania
- Implementacja efektywnej paginacji przy użyciu `limit` i `offset`
- Ograniczenie domyślnej liczby zwracanych wyników (limit: 50) aby zapobiegać dużym zapytaniom
- Monitorowanie wydajności zapytań do bazy danych
- Rozważenie implementacji cache'owania dla często odwiedzanych tematów

## 9. Etapy wdrożenia
1. Stworzenie pliku `src/pages/api/topics/[topicId]/notes.ts` dla obsługi endpointu
2. Implementacja schematu walidacyjnego Zod dla parametrów zapytania
3. Stworzenie lub aktualizacja serwisu `src/lib/services/notes.service.ts` z metodą `getNotesByTopicId`
4. Implementacja handlera GET w pliku endpointu
5. Dodanie obsługi błędów i walidacji
6. Implementacja logiki dostępu do danych przy użyciu Supabase
7. Dodanie testów jednostkowych dla serwisu
8. Przeprowadzenie testów integracyjnych endpointu
9. Dokumentacja API w oparciu o implementację 