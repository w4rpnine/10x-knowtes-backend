# API Endpoint Implementation Plan: POST /topics

## 1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowych tematów (topics) w systemie. Tworzy nowy rekord w tabeli `topics` powiązany z zalogowanym użytkownikiem i zwraca kompletne dane utworzonego tematu.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/topics`
- Parametry URL: Brak
- Nagłówki:
  - Content-Type: application/json
  - Authorization: Bearer {token} (domyślnie obsługiwane przez Supabase)
- Request Body:
  ```json
  {
    "title": "string"
  }
  ```

## 3. Wykorzystywane typy
- Command Model: `CreateTopicCommand` (z src/types.ts)
- Response DTO: `TopicDTO` (alias dla TopicEntity z bazy danych)
- Zod Schema dla walidacji: nowa schema dla CreateTopicCommand

## 4. Szczegóły odpowiedzi
- Status: 201 Created
- Response Body:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "user_id": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "notes": []
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowe dane wejściowe
  - 401 Unauthorized: brak autoryzacji
  - 500 Internal Server Error: błąd serwera

## 5. Przepływ danych
1. Żądanie POST trafia do handlera endpointu `/topics`
2. Middleware Astro sprawdza autentykację (Supabase)
3. Dane wejściowe są walidowane za pomocą Zod
4. Dane są przekazywane do TopicService
5. TopicService tworzy nowy temat w bazie danych Supabase
6. Szczegóły utworzonego tematu są zwracane jako odpowiedź

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Wymagana sesja Supabase (middleware sprawdza token)
- Autoryzacja: Użytkownik musi być zalogowany
- Walidacja danych: 
  - Tytuł musi być niepusty
  - Tytuł nie może przekraczać 150 znaków
- Przypisanie tematu do zalogowanego użytkownika (user_id)
- Ochrona przed atakami injection poprzez parametryzowane zapytania Supabase

## 7. Obsługa błędów
- Nieprawidłowe dane wejściowe:
  - Brak wymaganego pola title: 400 Bad Request
  - Title przekracza 150 znaków: 400 Bad Request
  - Title jest pusty: 400 Bad Request
- Błędy autoryzacji:
  - Brak sesji użytkownika: 401 Unauthorized
- Wewnętrzne błędy serwera:
  - Błąd podczas wykonywania operacji na bazie danych: 500 Internal Server Error

## 8. Rozważania dotyczące wydajności
- Zastosowanie indeksów na kolumnie user_id w tabeli topics
- Minimalna ilość danych przesyłana w odpowiedzi
- Szybka walidacja wejścia przed jakimkolwiek dostępem do bazy danych

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji
Stworzenie schematu Zod do walidacji danych wejściowych w `src/lib/schemas/topic.schema.ts`:

```typescript
import { z } from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(150, "Tytuł nie może przekraczać 150 znaków"),
});
```

### Krok 2: Utworzenie lub rozbudowa TopicService
Utworzenie lub rozbudowa serwisu `src/lib/services/topic.service.ts`:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateTopicCommand, TopicDTO } from "../../types";

export class TopicService {
  constructor(private supabase: SupabaseClient) {}

  async createTopic(userId: string, command: CreateTopicCommand): Promise<TopicDTO> {
    const { data, error } = await this.supabase
      .from("topics")
      .insert({
        title: command.title,
        user_id: userId
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Nie można utworzyć tematu: ${error.message}`);
    }

    return data;
  }
}
```

### Krok 3: Implementacja handlera endpointu
Utworzenie pliku `src/pages/api/topics.ts`:

```typescript
import type { APIRoute } from "astro";
import { createTopicSchema } from "../../lib/schemas/topic.schema";
import { TopicService } from "../../lib/services/topic.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    const { supabase, user } = locals;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Wymagane uwierzytelnienie" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parsowanie i walidacja danych wejściowych
    const body = await request.json();
    const validateResult = createTopicSchema.safeParse(body);
    
    if (!validateResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Nieprawidłowe dane wejściowe", 
          details: validateResult.error.errors 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Tworzenie tematu
    const topicService = new TopicService(supabase);
    const newTopic = await topicService.createTopic(user.id, validateResult.data);

    // Zwrócenie utworzonego tematu
    return new Response(
      JSON.stringify(newTopic),
      { 
        status: 201, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Błąd podczas tworzenia tematu:", error);
    
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Krok 4: Testy

1. Test jednostkowy dla schematu walidacji
2. Test jednostkowy dla TopicService
3. Test integracyjny dla endpointu API
4. Testowanie manualne z użyciem narzędzia takiego jak Postman

### Krok 5: Dokumentacja

Zaktualizować dokumentację API, aby uwzględnić nowy endpoint wraz z przykładowymi żądaniami i odpowiedziami. 