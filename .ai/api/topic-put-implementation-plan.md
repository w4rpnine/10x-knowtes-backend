# API Endpoint Implementation Plan: PUT /topics/{id}

## 1. Przegląd punktu końcowego
Endpoint służy do aktualizacji istniejącego tematu (topic) w systemie. Umożliwia modyfikację tytułu tematu przy zachowaniu wszystkich powiązanych notatek i statystyk podsumowań.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/topics/{id}`
- Parametry ścieżki:
  - `id` (UUID, wymagane): Identyfikator tematu do aktualizacji
- Request Body (JSON):
  ```typescript
  {
    title: string // 1-150 znaków
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Command Model
import { UpdateTopicCommand } from '../types';

// Entity
type TopicEntity = Database["public"]["Tables"]["topics"]["Row"];

// DTO
import { TopicDTO } from '../types';
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```typescript
  {
    id: string;         // UUID tematu
    title: string;      // Zaktualizowany tytuł
    created_at: string; // Data utworzenia (ISO 8601)
    updated_at: string; // Data aktualizacji (ISO 8601)
  }
  ```
- Kody błędów:
  - 400 Bad Request: Nieprawidłowe dane wejściowe
  - 401 Unauthorized: Brak uwierzytelnienia
  - 403 Forbidden: Brak uprawnień do modyfikacji tematu
  - 404 Not Found: Temat nie istnieje

## 5. Przepływ danych
1. Walidacja danych wejściowych (Zod)
2. Pobranie tematu z bazy danych
3. Weryfikacja uprawnień użytkownika
4. Aktualizacja tematu w bazie danych
5. Zwrócenie zaktualizowanego tematu

## 6. Względy bezpieczeństwa
- Uwierzytelnianie:
  - Wymagane uwierzytelnienie użytkownika poprzez Supabase Auth
  - Weryfikacja tokenu JWT w middleware
- Autoryzacja:
  - Sprawdzenie czy użytkownik jest właścicielem tematu (user_id)
- Walidacja danych:
  - Sanityzacja danych wejściowych
  - Sprawdzenie długości tytułu (1-150 znaków)
  - Walidacja UUID

## 7. Obsługa błędów
- Walidacja wejścia:
  - Nieprawidłowy format UUID
  - Brak wymaganego pola title
  - Nieprawidłowa długość tytułu
- Błędy biznesowe:
  - Temat nie istnieje
  - Brak uprawnień do modyfikacji
- Błędy techniczne:
  - Błąd połączenia z bazą danych
  - Konflikt współbieżności

## 8. Rozważania dotyczące wydajności
- Indeks na kolumnie id w tabeli topics
- Indeks na kolumnie user_id w tabeli topics
- Optymalizacja zapytania UPDATE poprzez użycie tylko zmienionych pól
- Minimalizacja liczby zapytań do bazy danych

## 9. Etapy wdrożenia
1. Utworzenie serwisu dla operacji na tematach (jeśli nie istnieje):
   ```typescript
   // src/lib/services/topic.service.ts
   export class TopicService {
     async updateTopic(id: string, userId: string, command: UpdateTopicCommand): Promise<TopicDTO>
   }
   ```

2. Implementacja walidacji danych wejściowych:
   ```typescript
   // src/lib/schemas/topic.schema.ts
   export const updateTopicSchema = z.object({
     title: z.string().min(1).max(150)
   });
   ```

3. Implementacja endpointu:
   ```typescript
   // src/pages/api/topics/[id].ts
   export const PUT: APIRoute = async ({ params, request, locals }) => {
     // Implementacja logiki
   }
   ```

4. Implementacja testów:
   - Testy jednostkowe dla serwisu
   - Testy integracyjne dla endpointu
   - Testy walidacji danych
   - Testy przypadków błędów

5. Dokumentacja API:
   - Aktualizacja dokumentacji OpenAPI/Swagger
   - Dodanie przykładów użycia
   - Dokumentacja kodów błędów

6. Wdrożenie:
   - Code review
   - Testy na środowisku staging
   - Deployment na produkcję 