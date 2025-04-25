# API Endpoint Implementation Plan: POST /auth/login

## 1. Przegląd punktu końcowego
Endpoint `/auth/login` pozwala na uwierzytelnienie użytkownika przy użyciu adresu email i hasła. Po pomyślnej weryfikacji danych uwierzytelniających, system zwraca tokeny JWT (access i refresh), informacje o użytkowniku oraz czas wygaśnięcia tokenu. Endpoint jest kluczowym komponentem systemu uwierzytelniania, umożliwiającym bezpieczny dostęp do chronionych zasobów aplikacji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/auth/login`
- Parametry: Brak parametrów URL
- Request Body:
  ```typescript
  interface LoginRequest {
    email: string;
    password: string;
    remember_me?: boolean; // Opcjonalne, domyślnie false
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Command Model dla żądania logowania
export interface LoginCommand {
  email: string;
  password: string;
  remember_me?: boolean;
}

// DTO dla odpowiedzi z danymi użytkownika
export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
}

// DTO dla pełnej odpowiedzi logowania
export interface LoginResponseDTO {
  access_token: string;
  refresh_token: string;
  user: UserDTO;
  expires_at: string;
}
```

## 4. Szczegóły odpowiedzi
- Status 200 OK:
  ```typescript
  {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      created_at: string;
    };
    expires_at: string;
  }
  ```
- Status 400 Bad Request:
  ```typescript
  {
    error: string; // "Invalid email format"
  }
  ```
- Status 401 Unauthorized:
  ```typescript
  {
    error: string; // "Invalid credentials"
  }
  ```
- Status 500 Internal Server Error:
  ```typescript
  {
    error: string; // "Server error during authentication"
  }
  ```

## 5. Przepływ danych
1. Endpoint otrzymuje żądanie zawierające email i hasło użytkownika
2. Dane wejściowe są walidowane przy użyciu Zod schemy
3. Service autentykacji przekazuje dane uwierzytelniające do Supabase Auth API
4. Supabase Auth weryfikuje dane uwierzytelniające z tabelą auth.users
5. W przypadku pomyślnej weryfikacji, Supabase generuje tokeny JWT
6. Tokeny JWT i dane użytkownika są zwracane do klienta
7. Cookies są ustawiane przy użyciu @supabase/ssr dla zarządzania sesją

## 6. Względy bezpieczeństwa
1. **Walidacja danych wejściowych**: Wszystkie dane wejściowe powinny być walidowane przy użyciu Zod dla zapewnienia poprawnego formatu i zabezpieczenia przed atakami injection
2. **Zabezpieczenie tokenów**: Tokeny powinny być przechowywane w bezpiecznych cookies (httpOnly, secure, sameSite)
3. **Zarządzanie sesją**: Używaj @supabase/ssr do zarządzania cookies i sesją
4. **Limity prób logowania**: Implementacja mechanizmu ograniczającego liczbę prób logowania dla ochrony przed atakami brute-force
5. **Szyfrowanie**: Wszystkie komunikacje powinny odbywać się przez HTTPS
6. **Czas wygaśnięcia tokenu**: Ustawienie odpowiedniego czasu wygaśnięcia tokenów JWT

## 7. Obsługa błędów
1. **Nieprawidłowy format email**: Status 400, komunikat "Invalid email format"
2. **Nieprawidłowe dane uwierzytelniające**: Status 401, komunikat "Invalid credentials"
3. **Nieaktywowane konto**: Status 401, komunikat "Account not activated"
4. **Zablokowane konto**: Status 401, komunikat "Account locked due to too many failed attempts"
5. **Błąd wewnętrzny serwera**: Status 500, komunikat "Server error during authentication"

## 8. Rozważania dotyczące wydajności
1. **Caching**: Rozważ cache'owanie danych użytkownika po pomyślnym logowaniu
2. **Rate limiting**: Implementacja rate limitingu na endpointach uwierzytelniania
3. **Rozmiar payload**: Minimalizacja rozmiaru zwracanych danych użytkownika
4. **Lazy loading**: Pobieranie tylko niezbędnych informacji o użytkowniku podczas logowania

## 9. Etapy wdrożenia
1. **Utworzenie schematu walidacji**:
   - Zdefiniuj schemat Zod dla walidacji danych logowania w `src/lib/schemas/auth.schema.ts`

2. **Utworzenie typów**:
   - Dodaj definicje LoginCommand, UserDTO i LoginResponseDTO do `src/types.ts`

3. **Utworzenie serwisu uwierzytelniania**:
   - Utwórz `src/lib/services/auth.service.ts` dla obsługi logiki uwierzytelniania
   - Implementuj metody dla logowania, weryfikacji i odświeżania tokenów

4. **Utworzenie endpointu API**:
   - Utwórz `src/pages/api/auth/login.ts` zgodnie ze specyfikacją Astro
   - Użyj serwisu uwierzytelniania do obsługi logowania

5. **Rozszerzenie obsługi cookies w middleware**:
   - Zaktualizuj `src/middleware/index.ts` do obsługi tokenów uwierzytelniania
   - Zintegruj @supabase/ssr dla zarządzania cookies

6. **Implementacja obsługi błędów**:
   - Utwórz standardowe formatery błędów dla endpointów uwierzytelniania
   - Zapewnij spójne komunikaty błędów

7. **Testy jednostkowe i integracyjne**:
   - Napisz testy dla serwisu uwierzytelniania
   - Napisz testy dla endpointu API

8. **Dokumentacja**:
   - Zaktualizuj dokumentację API
   - Dodaj przykłady użycia dla klientów frontendowych

9. **Wdrożenie**:
   - Zweryfikuj zgodność z zasadami bezpieczeństwa
   - Przeprowadź testy wydajnościowe
   - Wdróż na środowisko produkcyjne 