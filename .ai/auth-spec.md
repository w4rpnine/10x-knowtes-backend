# Specyfikacja architektury modułu autentykacji dla 10x-knowtes

## 1. Wprowadzenie

Dokument przedstawia szczegółową architekturę modułu rejestracji, logowania i odzyskiwania hasła użytkowników dla aplikacji 10x-knowtes. Specyfikacja uwzględnia wymagania określone w pliku PRD oraz technologie wymienione w tech-stack.md.

## 2. Logika backendowa

### 2.1. Struktura endpointów API

#### Endpointy API związane z autentykacją

|---------------------------------------------------------------------------------------------|
| Endpoint                       | Metoda | Opis                                              |
|--------------------------------|--------|---------------------------------------------------|
| `/api/auth/register`           | POST   | Rejestracja nowego użytkownika                    |
| `/api/auth/login`              | POST   | Logowanie użytkownika                             |
| `/api/auth/logout`             | POST   | Wylogowanie użytkownika                           |
| `/api/auth/reset-password`     | POST   | Inicjacja procesu resetowania hasła               |
| `/api/auth/verify-reset-token` | GET    | Weryfikacja tokenu resetowania hasła              |
| `/api/auth/change-password`    | POST   | Zmiana hasła użytkownika                          |
| `/api/auth/me`                 | GET    | Pobranie informacji o zalogowanym użytkowniku     |
| `/api/auth/delete-account`     | POST   | Usunięcie konta użytkownika                       |
|---------------------------------------------------------------------------------------------|

### 2.2. Modele danych

Wykorzystanie modeli danych z bazy Supabase:

```typescript
// Modele autentykacji
export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
}

// Komendy związane z autentykacją
export interface RegisterCommand {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface ResetPasswordCommand {
  email: string;
}

export interface ChangePasswordCommand {
  token?: string; // Opcjonalne - potrzebne przy resetowaniu
  currentPassword?: string; // Opcjonalne - potrzebne przy zmianie przez zalogowanego użytkownika
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountCommand {
  password: string;
  confirmation: string; // "DELETE" - potwierdzenie zamiaru usunięcia konta
}
```

### 2.3. Mechanizm walidacji danych wejściowych

Wykorzystanie biblioteki Zod do walidacji danych wejściowych:

```typescript
// src/lib/schemas/auth.schema.ts
import { z } from 'zod';

export const emailSchema = z.string().email('Nieprawidłowy format adresu email');

export const passwordSchema = z
  .string()
  .min(8, 'Hasło musi składać się z co najmniej 8 znaków')
  .regex(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
  .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
  .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
  confirmation: z.string().refine(val => val === 'DELETE', {
    message: 'Musisz wpisać "DELETE", aby potwierdzić usunięcie konta'
  })
});

export const changePasswordSchema = z
  .object({
    token: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  })
  .refine(
    data => (data.token && !data.currentPassword) || (!data.token && data.currentPassword),
    {
      message: 'Wymagany jest token lub aktualne hasło',
      path: ['token', 'currentPassword'],
    }
  );
```

### 2.4. Obsługa wyjątków

Utworzenie dedykowanych klas błędów dla modułu autentykacji:

```typescript
// src/lib/errors/auth.errors.ts
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Nieprawidłowe dane logowania');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor() {
    super('Użytkownik o podanym adresie email już istnieje');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('Token wygasł');
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super('Nieprawidłowy token');
    this.name = 'InvalidTokenError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super('Brak uprawnień');
    this.name = 'UnauthorizedError';
  }
}

// Funkcja mapująca błędy Supabase na nasze błędy aplikacyjne
export function mapSupabaseError(error: any): AuthError {
  const message = error?.message || 'Nieznany błąd';
  
  if (message.includes('User already exists')) {
    return new EmailAlreadyExistsError();
  }
  
  if (message.includes('Invalid login')) {
    return new InvalidCredentialsError();
  }
  
  if (message.includes('expired')) {
    return new TokenExpiredError();
  }
  
  return new AuthError(message);
}
```

### 2.5. Obsługa żądań API

Implementacja kontrolerów obsługujących żądania:

```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { registerSchema } from '../../../lib/schemas/auth.schema';
import { mapSupabaseError } from '../../../lib/errors/auth.errors';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const { data, error } = await locals.supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({ success: false, errors: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Nieznany błąd' }),
      {
        status: error.name === 'AuthError' ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

Podobne implementacje dla pozostałych endpointów.

## 3. System autentykacji

### 3.1. Middleware autentykacji

Rozszerzenie istniejącego middleware w celu weryfikacji sesji użytkownika:

```typescript
// src/middleware/index.ts
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  
  // Pobierz i ustaw sesję jeśli istnieje
  const authHeader = context.request.headers.get('Authorization');
  let session = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data, error } = await supabaseClient.auth.getUser(token);
    
    if (!error && data?.user) {
      session = {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        },
      };
    }
  } else {
    // Sprawdź cookie sesji
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
      session = {
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
          role: data.session.user.role,
        },
      };
    }
  }
  
  context.locals.session = session;
  context.locals.request = context.request;
  
  // Chroniona trasa, która wymaga uwierzytelnienia
  if (
    !context.url.pathname.startsWith('/api/auth/') &&
    context.url.pathname.startsWith('/api/') &&
    !session
  ) {
    return new Response(JSON.stringify({ success: false, message: 'Wymagane uwierzytelnienie' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  return next();
});
```

### 3.2. Serwis autentykacji

Utworzenie abstraktcyjnej warstwy serwisowej do obsługi operacji Supabase Auth:

```typescript
// src/lib/services/auth.service.ts
import type { SupabaseClient } from '../../db/supabase.client';
import { mapSupabaseError } from '../errors/auth.errors';
import type { 
  RegisterCommand, 
  LoginCommand, 
  ResetPasswordCommand, 
  ChangePasswordCommand,
  DeleteAccountCommand
} from '../../types';

export class AuthService {
  constructor(private readonly supabase: SupabaseClient) {}
  
  async register(command: RegisterCommand) {
    const { data, error } = await this.supabase.auth.signUp({
      email: command.email,
      password: command.password,
    });
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return data;
  }
  
  async login(command: LoginCommand) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return data;
  }
  
  async logout() {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return { success: true };
  }
  
  async resetPassword(command: ResetPasswordCommand) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(
      command.email,
      {
        redirectTo: `${new URL(import.meta.env.SITE).origin}/reset-password`,
      }
    );
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return { success: true };
  }
  
  async changePassword(command: ChangePasswordCommand) {
    let result;
    
    if (command.token) {
      // Resetowanie hasła za pomocą tokenu
      result = await this.supabase.auth.updateUser({
        password: command.newPassword,
      });
    } else if (command.currentPassword) {
      // Zmiana hasła przez zalogowanego użytkownika
      // Najpierw weryfikujemy aktualne hasło (Supabase nie oferuje bezpośredniej metody)
      const currentSession = await this.supabase.auth.getSession();
      if (!currentSession.data.session) {
        throw new Error('Brak sesji użytkownika');
      }
      
      const email = currentSession.data.session.user.email;
      if (!email) {
        throw new Error('Brak adresu email');
      }
      
      // Weryfikacja obecnego hasła
      const verifyResult = await this.supabase.auth.signInWithPassword({
        email,
        password: command.currentPassword,
      });
      
      if (verifyResult.error) {
        throw new Error('Nieprawidłowe aktualne hasło');
      }
      
      // Zmiana hasła
      result = await this.supabase.auth.updateUser({
        password: command.newPassword,
      });
    } else {
      throw new Error('Wymagany jest token lub aktualne hasło');
    }
    
    if (result.error) {
      throw mapSupabaseError(result.error);
    }
    
    return { success: true };
  }
  
  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return data.user;
  }
  
  async deleteAccount(command: DeleteAccountCommand) {
    // Weryfikacja hasła przed usunięciem konta
    const currentSession = await this.supabase.auth.getSession();
    if (!currentSession.data.session) {
      throw new Error('Brak sesji użytkownika');
    }
    
    const email = currentSession.data.session.user.email;
    if (!email) {
      throw new Error('Brak adresu email');
    }
    
    // Sprawdzenie czy confirmation zawiera oczekiwaną wartość
    if (command.confirmation !== 'DELETE') {
      throw new Error('Nieprawidłowe potwierdzenie usunięcia konta');
    }
    
    // Weryfikacja hasła
    const verifyResult = await this.supabase.auth.signInWithPassword({
      email,
      password: command.password,
    });
    
    if (verifyResult.error) {
      throw new Error('Nieprawidłowe hasło');
    }
    
    // Usunięcie konta
    const { error } = await this.supabase.auth.admin.deleteUser(
      currentSession.data.session.user.id
    );
    
    if (error) {
      throw mapSupabaseError(error);
    }
    
    return { success: true };
  }
}
```

### 3.3. Rozszerzenie typów dla Astro

Aktualizacja typów dla Astro Locals w celu obsługi sesji użytkownika:

```typescript
// Rozszerzenie w src/types.ts (już istniejące)

// Extend Astro's Locals interface
declare module "astro" {
  interface Locals {
    supabase: SupabaseClient;
    session: {
      user: {
        id: string;
        email?: string;
        role?: string;
        [key: string]: string | undefined;
      };
    } | null;
    request: Request;
  }
}
```

## 4. Przepływ autentykacji

### 4.1. Rejestracja użytkownika

1. Użytkownik wprowadza adres e-mail i hasło na stronie rejestracji.
2. Frontend wysyła dane do `/api/auth/register`.
3. Backend waliduje dane za pomocą `registerSchema`.
4. Jeśli dane są poprawne, wywołuje `supabase.auth.signUp()`.
5. Użytkownik otrzymuje e-mail z linkiem potwierdzającym.
6. Po kliknięciu linku, konto zostaje aktywowane.
7. Użytkownik jest przekierowywany na stronę logowania.

### 4.2. Logowanie użytkownika

1. Użytkownik wprowadza adres e-mail i hasło na stronie logowania.
2. Frontend wysyła dane do `/api/auth/login`.
3. Backend waliduje dane za pomocą `loginSchema`.
4. Jeśli dane są poprawne, wywołuje `supabase.auth.signInWithPassword()`.
5. Sesja użytkownika jest zapisywana w cookies.
6. Użytkownik jest przekierowywany na stronę główną aplikacji.

### 4.3. Wylogowanie użytkownika

1. Użytkownik klika przycisk wylogowania.
2. Frontend wysyła żądanie do `/api/auth/logout`.
3. Backend wywołuje `supabase.auth.signOut()`.
4. Sesja użytkownika jest usuwana.
5. Użytkownik jest przekierowywany na stronę logowania.

### 4.4. Resetowanie hasła

1. Użytkownik klika link "Zapomniałem hasła" na stronie logowania.
2. Użytkownik wprowadza adres e-mail na stronie resetowania hasła.
3. Frontend wysyła dane do `/api/auth/reset-password`.
4. Backend waliduje dane za pomocą `resetPasswordSchema`.
5. Jeśli adres e-mail istnieje, wywołuje `supabase.auth.resetPasswordForEmail()`.
6. Użytkownik otrzymuje e-mail z linkiem do resetowania hasła.
7. Po kliknięciu linku, użytkownik jest przekierowywany na stronę zmiany hasła.
8. Użytkownik wprowadza nowe hasło i potwierdza je.
9. Frontend wysyła dane do `/api/auth/change-password`.
10. Backend waliduje dane za pomocą `changePasswordSchema`.
11. Jeśli dane są poprawne, wywołuje `supabase.auth.updateUser()`.
12. Użytkownik jest przekierowywany na stronę logowania.

### 4.5. Zmiana hasła

1. Zalogowany użytkownik przechodzi do ustawień konta.
2. Użytkownik wprowadza aktualne hasło, nowe hasło i potwierdza nowe hasło.
3. Frontend wysyła dane do `/api/auth/change-password`.
4. Backend waliduje dane za pomocą `changePasswordSchema`.
5. Jeśli dane są poprawne, weryfikuje aktualne hasło i wywołuje `supabase.auth.updateUser()`.
6. Użytkownik otrzymuje potwierdzenie zmiany hasła.

### 4.6. Usunięcie konta

1. Zalogowany użytkownik przechodzi do ustawień konta.
2. Użytkownik wybiera opcję usunięcia konta.
3. System wyświetla ostrzeżenie o konsekwencjach usunięcia konta.
4. Użytkownik musi wpisać swoje hasło oraz potwierdzenie "DELETE".
5. Frontend wysyła dane do `/api/auth/delete-account`.
6. Backend waliduje dane, weryfikuje hasło i usuwa konto.
7. Wszystkie dane użytkownika są trwale usuwane z bazy danych.
8. Użytkownik jest wylogowywany i przekierowywany na stronę główną.
9. System wyświetla potwierdzenie usunięcia konta.

## 5. Zabezpieczenia

### 5.1. Ochrona endpointów API

Wszystkie endpointy API (poza tymi zaczynającymi się od `/api/auth/`) są chronione przez middleware, który sprawdza istnienie ważnej sesji użytkownika. Dzięki temu endpointy `/api/auth/register`, `/api/auth/login` czy `/api/auth/reset-password` pozostają dostępne dla niezalogowanych użytkowników, co jest niezbędne do prawidłowego funkcjonowania systemu autentykacji.

### 5.2. Walidacja danych wejściowych

Wszystkie dane wejściowe są walidowane za pomocą schematów Zod przed wykonaniem operacji na bazie danych.

### 5.3. CORS

Konfiguracja CORS dla API, aby umożliwić żądania tylko z dozwolonych domen.

### 5.4. Limity prób logowania

Wykorzystanie mechanizmów Supabase do ograniczenia liczby nieudanych prób logowania.

## 6. Uwagi implementacyjne

1. Wykorzystanie istniejącego klienta Supabase z `src/db/supabase.client.ts`.
2. Rozbudowa middleware `src/middleware/index.ts` o obsługę sesji użytkownika.
3. Dodanie typów związanych z autentykacją do `src/types.ts`.
4. Utworzenie schematów walidacji w `src/lib/schemas/auth.schema.ts`.
5. Utworzenie klas błędów w `src/lib/errors/auth.errors.ts`.
6. Utworzenie serwisu autentykacji w `src/lib/services/auth.service.ts`.
7. Implementacja kontrolerów w `src/pages/api/auth/`.

## 7. Zgodność z wymaganiami PRD

Specyfikacja uwzględnia wszystkie wymagania określone w PRD:
- Logowanie wymagające podania adresu email i hasła
- Rejestracja wymagająca podania adresu email, hasła i potwierdzenia hasła
- Ograniczenie dostępu do funkcji aplikacji tylko dla zalogowanych użytkowników
- Brak integracji z zewnętrznymi serwisami logowania
- Możliwość odzyskiwania hasła
- Możliwość zmiany hasła
- Możliwość usunięcia konta 