# API Endpoint Implementation Plan: POST /topics/{topicId}/summary

## 1. Przegląd punktu końcowego
Endpoint umożliwia generowanie podsumowania (w formie notatki) dla wszystkich notatek w danym temacie przy użyciu AI. Po wywołaniu tego endpointu, tworzone jest nowe podsumowanie statystyczne (summary_stats) oraz notatka zawierająca wygenerowaną treść.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/api/topics/{topicId}/summary`
- Parametry:
  - Wymagane: `topicId` (UUID tematu w ścieżce URL)
  - Opcjonalne: brak
- Request Body: brak (puste ciało żądania)

## 3. Wykorzystywane typy
```typescript
// Już zdefiniowane w types.ts
export interface SummaryGenerationResponseDTO {
  summary_stat_id: string;
  topic_id: string;
  note_id: string; // Brakujący element, który należy dodać do istniejącej definicji
}

// Nowy model żądania (opcjonalnie, jeśli będziemy chcieli dodać parametry konfiguracji w przyszłości)
export interface GenerateSummaryCommand {
  // Potencjalne parametry konfiguracyjne AI, np.:
  // max_length?: number;
}
```

## 4. Szczegóły odpowiedzi
- Kod statusu: 202 Accepted
- Format odpowiedzi:
```json
{
  "summary_stat_id": "uuid",
  "topic_id": "uuid",
  "note_id": "uuid"
}
```

## 5. Przepływ danych
1. Sprawdzenie czy temat (topic) istnieje i należy do zalogowanego użytkownika
2. Utworzenie nowego rekordu w tabeli `summary_stats` z informacją o rozpoczęciu procesu generowania
3. Utworzenie nowej notatki (note) z flagą `is_summary=true`
4. Powiązanie notatki z rekordem `summary_stats` poprzez aktualizację pola `summary_note_id`
5. Zwrócenie odpowiedzi 202 Accepted z identyfikatorami utworzonych zasobów

## 6. Względy bezpieczeństwa
- Autoryzacja: Sprawdzenie czy użytkownik jest zalogowany za pomocą Supabase Auth
- Walidacja dostępu: Weryfikacja czy temat należy do zalogowanego użytkownika
- Walidacja parametrów: Sprawdzenie poprawności UUID tematu za pomocą Zod
- Ograniczenie dostępu: Użycie RLS (Row Level Security) w Supabase dla tabel notes i summary_stats

## 7. Obsługa błędów
- 400 Bad Request: Nieprawidłowy format UUID tematu
- 401 Unauthorized: Brak autoryzacji lub wygasły token
- 403 Forbidden: Użytkownik nie ma uprawnień do danego tematu
- 404 Not Found: Temat nie istnieje
- 500 Internal Server Error: Błąd serwera podczas tworzenia podsumowania

## 8. Rozważania dotyczące wydajności
- Asynchroniczne przetwarzanie: Generowanie podsumowania może być czasochłonne, dlatego zwracamy 202 Accepted
- Indeksowanie: Upewnić się, że kolumny używane do filtrowania (user_id, topic_id) są odpowiednio zindeksowane
- Limitowanie: Wprowadzić ewentualne limity na liczbę podsumowań na użytkownika lub temat

## 9. Etapy wdrożenia

### 1. Utworzenie schematu Zod dla walidacji
```typescript
// src/lib/schemas/summary.schema.ts
import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const topicIdSchema = uuidSchema;

export const generateSummarySchema = z.object({
  // Puste lub przyszłe parametry konfiguracyjne
});
```

### 2. Utworzenie serwisu do obsługi podsumowań
```typescript
// src/lib/services/summary.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type { SummaryStatDTO, SummaryGenerationResponseDTO } from "../../types";
import { createNote } from "./notes.service";

export async function generateSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicId: string
): Promise<SummaryGenerationResponseDTO | null> {
  // Sprawdź czy temat istnieje i należy do użytkownika
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .eq("user_id", userId)
    .single();

  if (topicError || !topic) {
    return null;
  }

  // Utwórz rekord w summary_stats
  const { data: summaryStats, error: statsError } = await supabase
    .from("summary_stats")
    .insert({
      user_id: userId,
      topic_id: topicId,
      accepted: false
    })
    .select("*")
    .single();

  if (statsError) {
    throw statsError;
  }

  // Utwórz nową notatkę jako podsumowanie
  const note = await createNote(
    supabase,
    userId,
    topicId,
    {
      title: `Podsumowanie: ${topic.title || 'Temat'}`,
      content: "Trwa generowanie podsumowania...",
      is_summary: true
    }
  );

  if (!note) {
    throw new Error("Nie udało się utworzyć notatki podsumowującej");
  }

  // Powiąż notatkę z rekordem summary_stats
  const { error: updateError } = await supabase
    .from("summary_stats")
    .update({ summary_note_id: note.id })
    .eq("id", summaryStats.id);

  if (updateError) {
    throw updateError;
  }

  // Zwróć informacje o utworzonym podsumowaniu
  return {
    summary_stat_id: summaryStats.id,
    topic_id: topicId,
    note_id: note.id
  };
}
```

### 3. Implementacja handlera endpointu
```typescript
// src/pages/api/topics/[topicId]/summary.ts
import type { APIRoute } from "astro";
import { generateSummary } from "../../../../lib/services/summary.service";
import { topicIdSchema } from "../../../../lib/schemas/summary.schema";
import { fromZodError } from "zod-validation-error";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Pobierz klienta Supabase z kontekstu
    const supabase = locals.supabase;
    
    // Waliduj parametr topicId
    const { topicId } = params;
    
    if (!topicId) {
      return new Response(
        JSON.stringify({ error: "Brakujący identyfikator tematu" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const topicIdValidation = topicIdSchema.safeParse(topicId);
    
    if (!topicIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator tematu",
          details: fromZodError(topicIdValidation.error).message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Wygeneruj podsumowanie
    const summaryResponse = await generateSummary(
      supabase,
      DEFAULT_USER_ID,
      topicIdValidation.data
    );
    
    // Jeśli nie znaleziono tematu lub użytkownik nie ma uprawnień
    if (!summaryResponse) {
      return new Response(
        JSON.stringify({ error: "Temat nie został znaleziony lub brak uprawnień" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Zwróć informacje o rozpoczętym procesie generowania
    return new Response(
      JSON.stringify(summaryResponse),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Błąd podczas generowania podsumowania:", error);
    
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania żądania" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### 4. Aktualizacja typu SummaryGenerationResponseDTO
Upewnij się, że typ SummaryGenerationResponseDTO w src/types.ts zawiera pole note_id:

```typescript
export interface SummaryGenerationResponseDTO {
  summary_stat_id: string;
  topic_id: string;
  note_id: string; // Dodaj to pole
}
```

### 5. Implementacja faktycznego generowania podsumowania
W osobnym zadaniu należy zaimplementować rzeczywiste generowanie podsumowania (np. przy użyciu webhooków lub periodycznego zadania), które:
1. Pobierze wszystkie notatki dla danego tematu
2. Wygeneruje podsumowanie przy użyciu AI
3. Zaktualizuje treść utworzonej notatki podsumowującej 