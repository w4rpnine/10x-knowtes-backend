# API Endpoint Implementation Plan: POST /auth/logout

## 1. Przegląd punktu końcowego
Endpoint służy do wylogowania użytkownika poprzez unieważnienie jego sesji. Po poprawnym wylogowaniu użytkownik otrzymuje komunikat potwierdzający operację.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /auth/logout
- Parametry:
  - Wymagane: Brak parametrów URL ani query parameters
  - Opcjonalne: Brak
- Request Body: Brak

## 3. Wykorzystywane typy
- DTO:
  - LoginResponseDTO (dla kontekstu sesji, lecz nie bezpośrednio wykorzystywany w tym endpointcie)
  - W odpowiedzi: { message: string } (prosty komunikat potwierdzający)
- Command Modele: Brak, ponieważ nie ma danych wejściowych do walidacji.

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  { "message": "Successfully logged out" }
  ```
- Błędy:
  - 401 Unauthorized: Gdy użytkownik nie jest zalogowany lub sesja jest nieważna.
  - 500 Internal Server Error: W przypadku błędu po stronie serwera podczas wylogowania.

## 5. Przepływ danych
1. Klient wysyła żądanie POST do `/auth/logout`.
2. Middleware uwierzytelniający sprawdza autentyczność sesji; w razie braku ważnych danych sesji zwraca błąd 401.
3. Logika endpointu dokonuje unieważnienia sesji (np. kasowanie ciasteczek lub tokenów) poprzez Supabase lub mechanizm zarządzania sesją w Astro.
4. W przypadku niepowodzenia operacji, logowana jest informacja o błędzie oraz zwracany jest odpowiedni komunikat błędu (500).
5. Przy sukcesie zwracany jest JSON z komunikatem "Successfully logged out".

## 6. Względy bezpieczeństwa
- Upewnić się, że endpoint jest dostępny tylko dla uwierzytelnionych użytkowników poprzez middleware autoryzacji.
- Podczas unieważniania sesji należy upewnić się, że wszystkie tokeny oraz ciasteczka związane z sesją są poprawnie usunięte.
- Monitorować potencjalne próby wylogowania z nieważną lub zmanipulowaną sesją, co mogłoby wskazywać na próbę ataku.

## 7. Obsługa błędów
- 401 Unauthorized: Gdy żądanie nie zawiera prawidłowych danych sesji. W odpowiedzi zwrócić komunikat "Unauthorized".
- 500 Internal Server Error: W przypadku wystąpienia błędu podczas operacji wylogowania. Zalogować szczegóły błędu przy użyciu centralnego loggera i zwrócić komunikat "Server error during logout".

## 8. Rozważania dotyczące wydajności
- Ponieważ operacja wylogowania to głównie operacje kasowania danych ciasteczek/tokenów, obciążenie bazy danych jest minimalne. 
- Upewnić się, że logika middleware jest zoptymalizowana pod kątem niskich opóźnień.

## 9. Etapy wdrożenia
1. Utworzenie nowego endpointu POST `/auth/logout` w katalogu `src/pages/api`.
2. Implementacja middleware autoryzacyjnego w celu weryfikacji uwierzytelnienia sesji.
3. Utworzenie logiki wylogowania, która:
   - Kasuje ciasteczka lub tokeny sesji
   - Ewentualnie aktualizuje stan sesji w Supabase
4. Implementacja obsługi błędów: zwracanie 401 dla nieautoryzowanych i 500 dla błędów serwera.
5. Testowanie endpointu pod kątem poprawności działania oraz scenariuszy błędnych.
6. Dodanie logowania zdarzeń wylogowania przy pomocy centralnego loggera.
7. Przegląd kodu przez zespół i wdrożenie do środowiska staging przed wdrożeniem produkcyjnym. 