# API Endpoint Implementation Plan: POST /topics/{topicId}/summaries

## 1. Przegląd punktu końcowego
Endpoint służy do wygenerowania podsumowania notatek w ramach określonego tematu przy użyciu AI. Jest to synchroniczny proces, który tworzy nowy rekord w tabeli `summary_stats` oraz zwraca wynik w formacie JSON.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/topics/{topicId}/summaries`
- Parametry:
  - Wymagane: `topicId` (UUID tematu w ścieżce URL)
  - Opcjonalne: brak
- Request Body: brak

## 3. Wykorzystywane typy
```typescript
// Istniejące typy z src/types.ts
import { SummaryGenerationResponseDTO, TopicDTO, NoteDTO } from "../../types";

// Nowe typy do zdefiniowania
interface SummaryGenerationParams {
  userId: string;
  topicId: string;
}

interface SummaryGenerationResult {
  summaryStatId: string;
  title: string;
  content: string;
}
```

## 4. Szczegóły odpowiedzi
- Kod statusu: 201 Created
- Response Body:
```json
{
  "summary_stat_id": "uuid",
  "title": "string",
  "content": "string"
}
```
- Typy błędów:
  - 400 Bad Request - nieprawidłowy format UUID lub brak notatek do podsumowania
  - 401 Unauthorized - brak autoryzacji użytkownika
  - 403 Forbidden - użytkownik nie ma dostępu do tematu
  - 404 Not Found - temat nie istnieje
  - 500 Internal Server Error - błąd generowania podsumowania

## 5. Przepływ danych
1. Endpoint przyjmuje żądanie z identyfikatorem tematu (topicId)
2. Weryfikacja dostępu użytkownika do tematu
3. Pobranie wszystkich notatek dla tematu (które nie są podsumowaniami)
4. Sprawdzenie czy istnieją notatki do podsumowania
5. Utworzenie rekordu w tabeli `summary_stats` z wartością `accepted=false`
6. Wywołanie usługi AI do wygenerowania podsumowania
7. Zwrócenie identyfikatora utworzonego podsumowania oraz treści

## 6. Względy bezpieczeństwa
- Wykorzystanie Row Level Security (RLS) na poziomie bazy danych
- Sprawdzenie czy użytkownik jest właścicielem tematu przed generowaniem podsumowania
- Używanie supabase z context.locals zamiast bezpośredniego importu klienta
- Walidacja identyfikatora tematu (UUID) przy użyciu Zod
- Zapobieganie atakom typu injection przez używanie parametryzowanych zapytań

## 7. Obsługa błędów
- Nieprawidłowy format UUID topicId → 400 Bad Request
- Brak autoryzacji → 401 Unauthorized
- Temat nie należy do użytkownika → 403 Forbidden
- Temat nie istnieje → 404 Not Found
- Brak notatek do podsumowania → 400 Bad Request z odpowiednim komunikatem
- Przekroczenie limitu czasu generowania (30 sekund) → 500 Internal Server Error
- Błąd AI podczas generowania → 500 Internal Server Error
- Błąd bazy danych → 500 Internal Server Error z odpowiednim logowaniem

## 8. Rozważania dotyczące wydajności
- Limitowanie długości treści notatek używanych do podsumowania
- Timeout dla generowania podsumowania (max 30 sekund)
- Monitorowanie czasu odpowiedzi usługi AI
- Obsługa limitów API dla zewnętrznego dostawcy AI (Openrouter.ai)

## 9. Etapy wdrożenia

1. Utworzenie schematu Zod dla walidacji parametrów
```typescript
// src/lib/schemas/summary.schema.ts
import { z } from "zod";

export const summaryTopicIdSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID format"),
});

export type SummaryTopicIdParams = z.infer<typeof summaryTopicIdSchema>;
```

2. Implementacja usługi do generowania podsumowań
```typescript
// src/lib/services/summary.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { SummaryGenerationResponseDTO } from "../../types";
import { NotesService } from "./notes.service";

export class SummaryService {
  private notesService: NotesService;
  
  constructor(private readonly supabase: SupabaseClient) {
    this.notesService = new NotesService(supabase);
  }

  /**
   * Generuje podsumowanie notatek w temacie
   */
  async generateSummary(userId: string, topicId: string): Promise<SummaryGenerationResponseDTO | null> {
    // 1. Sprawdź czy temat istnieje i należy do użytkownika
    // 2. Pobierz notatki do podsumowania
    // 3. Sprawdź czy są notatki do podsumowania
    // 4. Utwórz rekord w tabeli summary_stats
    // 5. Wywołaj AI do wygenerowania podsumowania
    // 6. Zwróć wynik
  }

  /**
   * Wywołuje usługę AI do wygenerowania podsumowania
   */
  private async callAIService(notes: NoteDTO[]): Promise<{ title: string; content: string }> {
    // Implementacja wywołania usługi AI (Openrouter.ai)
  }
}
```

3. Implementacja kontrolera API w Astro
```typescript
// src/pages/api/topics/[topicId]/summaries/index.ts
import type { APIRoute } from "astro";
import { SummaryService } from "../../../../lib/services/summary.service";
import { summaryTopicIdSchema } from "../../../../lib/schemas/summary.schema";

export const POST: APIRoute = async ({ params, locals, request }) => {
  // 1. Walidacja parametrów
  // 2. Sprawdzenie autoryzacji
  // 3. Wywołanie usługi
  // 4. Zwrócenie odpowiedzi
};
```

4. Dodanie testów jednostkowych
```typescript
// tests/summary.service.test.ts
describe("SummaryService", () => {
  describe("generateSummary", () => {
    // Testy dla różnych scenariuszy
  });
});
```

5. Dodanie dokumentacji OpenAPI (Swagger)
```yaml
# openapi.yaml
paths:
  /topics/{topicId}/summaries:
    post:
      summary: Generate a summary for a topic's notes using AI
      parameters:
        - name: topicId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '201':
          description: Summary generation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SummaryGenerationResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/ServerError'
```

6. Implementacja integracji z usługą AI Openrouter.ai
```typescript
// src/lib/services/ai.service.ts
export class AIService {
  /**
   * Generuje podsumowanie na podstawie notatek
   */
  async generateSummary(notes: NoteDTO[]): Promise<{ title: string; content: string }> {
    // Implementacja wywołania Openrouter.ai
  }
}
```

7. Konfiguracja monitoringu i obsługi błędów
```typescript
// src/lib/utils/error-handling.ts
export function handleSummaryError(error: unknown): Response {
  // Logika obsługi błędów specyficznych dla podsumowań
}
``` 