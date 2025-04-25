# API Endpoint Implementation Plan: POST /auth/register

## 1. Przegląd punktu końcowego
Endpoint `/auth/register` umożliwia rejestrację nowego konta użytkownika w systemie. Po pomyślnej walidacji danych, endpoint tworzy nowe konto użytkownika w Supabase Auth, wysyła email weryfikacyjny i zwraca podstawowe informacje o utworzonym użytkowniku. Jest to kluczowy element procesu onboardingu nowych użytkowników do aplikacji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/auth/register`
- Parametry: Brak parametrów URL
- Request Body:
  ```typescript
  interface RegisterRequest {
    email: string;
    password: string;
    password_confirmation: string;
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Command Model dla żądania rejestracji
export interface RegisterCommand {
  email: string;
  password: string;
  password_confirmation: string;
}

// DTO dla odpowiedzi z danymi użytkownika
export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
}

// DTO dla odpowiedzi rejestracji
export interface RegisterResponseDTO {
  user: UserDTO;
  message: string;
}
```

## 4. Szczegóły odpowiedzi
- Status 201 Created:
  ```typescript
  {
    user: {
      id: string;
      email: string;
      created_at: string;
    },
    message: string; // "Verification email sent"
  }
  ```
- Status 400 Bad Request:
  ```typescript
  {
    error: string; // "Invalid email format" | "Password must be at least 8 characters" | "Passwords don't match"
  }
  ```
- Status 409 Conflict:
  ```typescript
  {
    error: string; // "Email already in use"
  }
  ```
- Status 500 Internal Server Error:
  ```typescript
  {
    error: string; // "Server error during registration"
  }
  ```

## 5. Przepływ danych
1. Endpoint otrzymuje żądanie zawierające email, hasło i potwierdzenie hasła
2. Dane wejściowe są walidowane przy użyciu Zod schemy
3. Sprawdzane jest, czy hasło i potwierdzenie hasła są identyczne
4. Service autentykacji przekazuje dane rejestracji do Supabase Auth API
5. Supabase Auth tworzy nowego użytkownika w tabeli auth.users
6. Supabase Auth wysyła email weryfikacyjny
7. Dane utworzonego użytkownika i informacja o wysłaniu emaila weryfikacyjnego są zwracane do klienta

## 6. Względy bezpieczeństwa
1. **Walidacja danych wejściowych**: Wszystkie dane wejściowe powinny być walidowane przy użyciu Zod dla zapewnienia poprawnego formatu i zabezpieczenia przed atakami injection
2. **Siła hasła**: Wymaganie silnych haseł (min. 8 znaków, preferowane znaki specjalne, cyfry i duże litery)
3. **Weryfikacja email**: Implementacja mechanizmu weryfikacji adresu email
4. **Ochrona przed atakami brute-force**: Implementacja rate limitingu dla endpointu rejestracji
5. **Szyfrowanie**: Wszystkie komunikacje powinny odbywać się przez HTTPS
6. **Bezpieczne przechowywanie haseł**: Supabase Auth automatycznie haszuje hasła

## 7. Obsługa błędów
1. **Nieprawidłowy format email**: Status 400, komunikat "Invalid email format"
2. **Zbyt słabe hasło**: Status 400, komunikat "Password must be at least 8 characters"
3. **Niezgodność haseł**: Status 400, komunikat "Passwords don't match"
4. **Email już w użyciu**: Status 409, komunikat "Email already in use"
5. **Błąd wewnętrzny serwera**: Status 500, komunikat "Server error during registration"

## 8. Rozważania dotyczące wydajności
1. **Asynchroniczna wysyłka emaili**: Zapewnienie, że wysyłka emaila weryfikacyjnego nie blokuje odpowiedzi API
2. **Rate limiting**: Implementacja rate limitingu dla zapobiegania nadużyciom
3. **Mechanizm CAPTCHA**: Rozważenie implementacji CAPTCHA dla ochrony przed botami

## 9. Etapy wdrożenia
1. **Utworzenie schematu walidacji**: Implementacja schematu Zod do walidacji danych rejestracyjnych
```typescript
// src/lib/schemas/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
  password_confirmation: z
    .string()
    .min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});
```

2. **Rozszerzenie interfejsu AuthService**: Dodanie metody `register` do istniejącego serwisu autentykacji
```typescript
// src/lib/services/auth.service.ts
import type { RegisterCommand, RegisterResponseDTO } from "../../types";
import { registerSchema } from "../schemas/auth.schema";

export class AuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  // Istniejące metody...

  async register(command: RegisterCommand): Promise<RegisterResponseDTO> {
    // Walidacja danych wejściowych
    const validationResult = registerSchema.safeParse(command);
    if (!validationResult.success) {
      throw new AuthenticationError(validationResult.error.errors[0].message);
    }

    // Próba rejestracji użytkownika w Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email: command.email,
      password: command.password,
      options: {
        emailRedirectTo: `${new URL(import.meta.env.SITE).origin}/auth/confirm`,
      },
    });

    // Obsługa błędów Supabase
    if (error) {
      // Mapowanie błędów Supabase na własne komunikaty błędów
      if (error.message.includes("already registered")) {
        throw new EmailAlreadyInUseError("Email already in use");
      }
      throw new AuthenticationError(error.message);
    }

    if (!data.user?.email || !data.user?.created_at) {
      throw new AuthenticationError("Invalid user data");
    }

    // Zwróć sformatowaną odpowiedź
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      message: "Verification email sent",
    };
  }
}

// Dodatkowe klasy błędów
export class EmailAlreadyInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailAlreadyInUseError";
  }
}
```

3. **Implementacja endpointu rejestracji**:
```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { AuthService, AuthenticationError, EmailAlreadyInUseError } from "../../../lib/services/auth.service";
import { createSupabaseServerInstance } from "../../../lib/services/supabase.server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Inicjalizacja supabase i serwisu autentykacji
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const authService = new AuthService(supabase);
    
    // Odczytanie i przetworzenie body żądania
    const body = await request.json();
    
    // Wywołanie logiki biznesowej
    const response = await authService.register(body);
    
    // Zwrócenie odpowiedzi
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    // Obsługa nieoczekiwanych błędów
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Server error during registration" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
```

4. **Aktualizacja typów DTO**:
```typescript
// src/types.ts
// Istniejące typy...

export interface RegisterCommand {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponseDTO {
  user: UserDTO;
  message: string;
}
```

5. **Konfiguracja szablonu emaila weryfikacyjnego**:
   - W panelu administracyjnym Supabase skonfigurować wygląd i treść emaila weryfikacyjnego
   - Ustawić odpowiedni URL przekierowania po weryfikacji

6. **Testy**:
   - Przygotować testy jednostkowe dla walidacji danych wejściowych
   - Przygotować testy integracyjne sprawdzające interakcję z Supabase Auth
   - Przetestować przepływ rejestracji end-to-end 