# API Endpoint Implementation Plan: GET /notes/{id}

## 1. Przegląd punktu końcowego
Endpoint GET /notes/{id} umożliwia pobranie szczegółowych informacji o pojedynczej notatce na podstawie jej identyfikatora. Endpoint zwraca pełne informacje o notatce, w tym jej zawartość, powiązany temat oraz metadane, takie jak data utworzenia i aktualizacji.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /notes/{id}
- Parametry:
  - Wymagane: id (UUID notatki w ścieżce URL)
  - Opcjonalne: brak

## 3. Wykorzystywane typy
- **DTOs**:
  - `NoteDTO` - typ reprezentujący notatkę zwracaną w odpowiedzi

## 4. Szczegóły odpowiedzi
- Kod statusu: 200 OK (sukces)
- Format odpowiedzi: JSON
- Struktura odpowiedzi:
  ```json
  {
    "id": "uuid",
    "topic_id": "uuid",
    "title": "string",
    "content": "string",
    "is_summary": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- Kody błędów:
  - 401 Unauthorized - użytkownik nie jest zalogowany
  - 403 Forbidden - użytkownik nie ma dostępu do tej notatki
  - 404 Not Found - notatka o podanym ID nie istnieje

## 5. Przepływ danych
1. Klient wysyła żądanie GET do /notes/{id}
2. Middleware sprawdza uwierzytelnianie użytkownika
3. Endpoint pobiera ID notatki z parametrów ścieżki
4. Wywołuje się funkcję service `getNoteById` z przekazanym ID notatki i ID użytkownika
5. Service wykonuje zapytanie do bazy danych Supabase, filtrując po ID notatki i ID użytkownika
6. Dane są mapowane na `NoteDTO` i zwracane
7. Odpowiedź jest wysyłana do klienta w formacie JSON

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane uwierzytelnienie użytkownika przed dostępem do danych
- **Autoryzacja**: Sprawdzenie, czy notatka należy do zalogowanego użytkownika
- **Walidacja danych**:
  - Sprawdzenie poprawności formatu UUID dla parametru ID
  - Filtrowanie danych na poziomie bazy danych (WHERE user_id = x AND id = y)

## 7. Obsługa błędów
- **401 Unauthorized**:
  - Brak tokenu JWT lub token wygasł
  - Obsługa przez middleware Astro
- **403 Forbidden**:
  - Notatka istnieje, ale należy do innego użytkownika
  - Zwrócenie standardowej odpowiedzi 403 bez ujawniania informacji o istnieniu notatki
- **404 Not Found**:
  - Notatka o podanym ID nie istnieje
  - Notatka została usunięta
- **500 Internal Server Error**:
  - Błąd połączenia z bazą danych
  - Nieoczekiwany błąd podczas przetwarzania żądania

## 8. Rozważania dotyczące wydajności
- Użycie indeksu na kolumnie `id` w tabeli `notes` dla szybkiego wyszukiwania
- Implementacja mechanizmu cache dla często pobieranych notatek (opcjonalnie)
- Zwracanie jedynie potrzebnych pól z bazy danych (SELECT *)

## 9. Etapy wdrożenia
1. **Rozszerzenie istniejącego serwisu notes.service.ts**:
   - Dodanie nowej funkcji `getNoteById` do pobierania pojedynczej notatki
   - Implementacja logiki sprawdzania dostępu użytkownika

2. **Utworzenie nowego pliku endpointu**:
   - Stworzenie pliku `src/pages/api/notes/[id].ts`
   - Implementacja handlera GET

3. **Implementacja walidacji**:
   - Walidacja poprawności UUID dla parametru ID
   - Obsługa przypadków brzegowych

4. **Testowanie**:
   - Testy jednostkowe dla serwisu
   - Testy integracyjne dla endpointu
   - Testy scenariuszy błędów i autoryzacji

5. **Dokumentacja**:
   - Zaktualizowanie dokumentacji API
   - Przykłady użycia endpointu 