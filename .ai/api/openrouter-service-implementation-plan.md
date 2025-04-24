# Plan implementacji usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter jest odpowiedzialna za obsługę komunikacji z API OpenRouter.ai w celu integracji modeli LLM w aplikacji. Zapewnia ujednolicony interfejs do różnych funkcji opartych na AI, takich jak generowanie odpowiedzi, podsumowań oraz obsługa formatu strukturyzowanych odpowiedzi.

Usługa będzie funkcjonować jako warstwa abstrakcji między aplikacją a zewnętrznym API OpenRouter, zapewniając:
- Konfigurowalną komunikację z różnymi modelami LLM
- Strukturyzowanie komunikatów systemowych i użytkownika
- Obsługę formatu odpowiedzi zgodnie z zdefiniowanym schematem JSON
- Zarządzanie parametrami modelu
- Kompleksową obsługę błędów i przekroczenia czasu
- Bezpieczne zarządzanie kluczami API

## 2. Opis konstruktora

```typescript
constructor(
  private readonly apiKey: string,
  private readonly defaultModel: string = "openai/gpt-4o-mini",
  private readonly defaultTimeout: number = 30000
) {
  if (!this.apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }
}
```

Konstruktor wymaga klucza API OpenRouter. Opcjonalnie można przekazać:
- `defaultModel` - domyślny model LLM do użycia (domyślnie "openai/gpt-4o-mini")
- `defaultTimeout` - czas oczekiwania na odpowiedź w milisekundach (domyślnie 30000ms / 30s)

## 3. Publiczne metody i pola

### 3.1. `completeChatRequest`

```typescript
async completeChatRequest<T = any>(options: {
  systemMessage?: string;
  userMessage: string;
  model?: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}): Promise<T>
```

Główna metoda do wysyłania zapytań do OpenRouter. Parametry:
- `systemMessage` - opcjonalny komunikat systemowy definiujący rolę asystenta
- `userMessage` - komunikat użytkownika (wymagany)
- `model` - opcjonalny identyfikator modelu (nadpisuje wartość domyślną)
- `responseFormat` - opcjonalny format odpowiedzi dla strukturyzowanych danych
- `temperature`, `maxTokens`, `topP`, `frequencyPenalty`, `presencePenalty` - opcjonalne parametry modelu

Zwraca odpowiedź modelu, opcjonalnie sparsowaną do typu generycznego `T`.

### 3.2. `generateStructuredResponse`

```typescript
async generateStructuredResponse<T>(options: {
  schema: object;
  userMessage: string;
  systemMessage?: string;
  model?: string;
  schemaName?: string;
  strict?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<T>
```

Metoda wyspecjalizowana do generowania odpowiedzi zgodnych z podanym schematem JSON:
- `schema` - schemat JSON opisujący oczekiwaną strukturę odpowiedzi
- `schemaName` - opcjonalna nazwa schematu (domyślnie "ResponseSchema")
- `strict` - czy wymagać ścisłej zgodności ze schematem (domyślnie true)
- Pozostałe parametry są analogiczne do `completeChatRequest`

Zwraca odpowiedź zgodną z podanym schematem, sparsowaną do typu generycznego `T`.

### 3.3. `generateSummary`

```typescript
async generateSummary(options: {
  content: string | string[];
  systemMessage?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ title: string; content: string }>
```

Specjalizowana metoda do generowania podsumowań treści:
- `content` - treść do podsumowania (string lub tablica stringów)
- Pozostałe parametry są analogiczne do poprzednich metod

Zwraca obiekt zawierający wygenerowany tytuł i treść podsumowania.

## 4. Prywatne metody i pola

### 4.1. Stałe

```typescript
private readonly OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
```

### 4.2. `callOpenRouter`

```typescript
private async callOpenRouter(options: {
  messages: Array<{ role: string; content: string }>;
  model: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}): Promise<Response>
```

Metoda wykonująca faktyczne zapytanie do API OpenRouter:
- Zarządza timeout'em i przerwaniem zapytania
- Konfiguruje nagłówki HTTP i parametry zapytania
- Weryfikuje poprawność odpowiedzi

### 4.3. `parseResponse`

```typescript
private async parseResponse<T>(response: Response, responseFormat?: ResponseFormat): Promise<T>
```

Metoda parsująca odpowiedź z API:
- Odczytuje dane JSON z odpowiedzi
- Ekstrahuje zawartość odpowiedzi z pola `choices[0].message.content`
- W przypadku responseFormat typu JSON, parsuje zawartość do obiektu

### 4.4. `buildMessages`

```typescript
private buildMessages(systemMessage: string | undefined, userMessage: string): Array<{ role: string; content: string }>
```

Buduje tablicę komunikatów w formacie wymaganym przez API OpenRouter.

## 5. Obsługa błędów

Usługa implementuje kompleksowy system obsługi błędów:

### 5.1. Typy błędów

```typescript
class OpenRouterError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class OpenRouterTimeoutError extends OpenRouterError {
  constructor(timeout: number) {
    super(`OpenRouter request timed out after ${timeout}ms`);
    this.name = "OpenRouterTimeoutError";
  }
}

class OpenRouterParsingError extends OpenRouterError {
  constructor(message: string, public rawResponse?: any) {
    super(`Failed to parse OpenRouter response: ${message}`);
    this.name = "OpenRouterParsingError";
  }
}
```

### 5.2. Strategie obsługi błędów

- Walidacja parametrów wejściowych przed wysłaniem zapytania
- Timeout dla długotrwałych zapytań
- Sprawdzanie kodów HTTP odpowiedzi
- Obsługa błędów parsowania JSON
- Szczegółowe komunikaty błędów dla łatwiejszego debugowania

## 6. Kwestie bezpieczeństwa

### 6.1. Zarządzanie kluczem API

- Klucz API powinien być przechowywany w zmiennych środowiskowych
- Nigdy nie hardcodować klucza API w kodzie
- Ustawić odpowiednie uprawnienia do zmiennych środowiskowych na serwerze

### 6.2. Walidacja danych wejściowych

- Sprawdzać poprawność i bezpieczeństwo danych wejściowych
- Unikać przekazywania niezaufanych danych użytkownika bezpośrednio do LLM

### 6.3. Ograniczanie użycia

- Implementacja mechanizmów rate-limitingu
- Monitorowanie kosztów i użycia API
- Obsługa limitów tokenów dla różnych modeli

## 7. Plan wdrożenia krok po kroku

### Krok 1: Utworzenie pliku serwisu

Utwórz plik `src/lib/services/openrouter.service.ts` z podstawową strukturą klasy:

```typescript
import type { ResponseFormat } from "../../types";
import { OpenRouterError, OpenRouterTimeoutError, OpenRouterParsingError } from "../errors/openrouter.errors";

export class OpenRouterService {
  private readonly OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel: string = "openai/gpt-4o-mini",
    private readonly defaultTimeout: number = 30000
  ) {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }

  // Tutaj zostaną zaimplementowane wszystkie metody
}
```

### Krok 2: Dodanie typów i interfejsów

Dodaj do pliku `src/types.ts` potrzebne interfejsy:

```typescript
export interface ResponseFormat {
  type: 'json_object' | 'json_schema';
  schema?: object;
  name?: string;
  strict?: boolean;
}

export interface OpenRouterRequestOptions {
  systemMessage?: string;
  userMessage: string;
  model?: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}

export interface OpenRouterResponse<T = any> {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: T;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Krok 3: Utworzenie pliku błędów

Utwórz plik `src/lib/errors/openrouter.errors.ts`:

```typescript
export class OpenRouterError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(timeout: number) {
    super(`OpenRouter request timed out after ${timeout}ms`);
    this.name = "OpenRouterTimeoutError";
  }
}

export class OpenRouterParsingError extends OpenRouterError {
  constructor(message: string, public rawResponse?: any) {
    super(`Failed to parse OpenRouter response: ${message}`);
    this.name = "OpenRouterParsingError";
  }
}
```

### Krok 4: Implementacja metody `callOpenRouter`

Dodaj prywatną metodę do wykonywania zapytań:

```typescript
private async callOpenRouter(options: {
  messages: Array<{ role: string; content: string }>;
  model: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}): Promise<Response> {
  const {
    messages,
    model,
    responseFormat,
    temperature = 0.7,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    timeout = this.defaultTimeout
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const requestBody: Record<string, any> = {
      model,
      messages,
      temperature
    };

    // Dodanie opcjonalnych parametrów, jeśli zostały podane
    if (maxTokens) requestBody.max_tokens = maxTokens;
    if (topP) requestBody.top_p = topP;
    if (frequencyPenalty) requestBody.frequency_penalty = frequencyPenalty;
    if (presencePenalty) requestBody.presence_penalty = presencePenalty;

    // Dodanie responseFormat, jeśli został podany
    if (responseFormat) {
      if (responseFormat.type === 'json_object') {
        requestBody.response_format = { type: 'json_schema', json_schema: { name: 'weather', strict: true, schema: jsonSchemaObj } };
      } else if (responseFormat.type === 'json_schema') {
        requestBody.response_format = {
          type: 'json_schema',
          schema: {
            name: responseFormat.name || 'ResponseSchema',
            strict: responseFormat.strict !== false,
            schema: responseFormat.schema
          }
        };
      }
    }

    const response = await fetch(this.OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://knowtes.app",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response;
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OpenRouterTimeoutError(timeout);
    }

    throw new OpenRouterError(
      `Failed to call OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Krok 5: Implementacja metody `parseResponse`

Dodaj metodę parsującą odpowiedzi:

```typescript
private async parseResponse<T>(response: Response, responseFormat?: ResponseFormat): Promise<T> {
  try {
    const data = await response.json() as OpenRouterResponse;
    
    if (!data.choices || !data.choices.length || !data.choices[0].message) {
      throw new OpenRouterParsingError("Invalid response structure", data);
    }

    const content = data.choices[0].message.content;

    // Jeśli oczekujemy odpowiedzi w formacie JSON, próbujemy ją sparsować
    if (responseFormat?.type === 'json_object' || responseFormat?.type === 'json_schema') {
      try {
        // Jeśli content jest już obiektem (model zwrócił JSON), używamy go bezpośrednio
        if (typeof content === 'object') {
          return content as T;
        }
        // W przeciwnym razie próbujemy sparsować string
        return JSON.parse(content as string) as T;
      } catch (parseError) {
        throw new OpenRouterParsingError(
          `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
          content
        );
      }
    }

    return content as unknown as T;
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }
    throw new OpenRouterParsingError(
      `Failed to parse response: ${error instanceof Error ? error.message : "Unknown error"}`,
      response
    );
  }
}
```

### Krok 6: Implementacja metody `buildMessages`

Dodaj pomocniczą metodę do budowania wiadomości:

```typescript
private buildMessages(
  systemMessage: string | undefined,
  userMessage: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }

  messages.push({ role: "user", content: userMessage });
  
  return messages;
}
```

### Krok 7: Implementacja metody `completeChatRequest`

Dodaj główną metodę publiczną:

```typescript
async completeChatRequest<T = any>(options: {
  systemMessage?: string;
  userMessage: string;
  model?: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}): Promise<T> {
  const {
    systemMessage,
    userMessage,
    model = this.defaultModel,
    responseFormat,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    timeout
  } = options;

  if (!userMessage) {
    throw new OpenRouterError("User message is required");
  }

  const messages = this.buildMessages(systemMessage, userMessage);
  
  const response = await this.callOpenRouter({
    messages,
    model,
    responseFormat,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    timeout
  });

  return this.parseResponse<T>(response, responseFormat);
}
```

### Krok 8: Implementacja metody `generateStructuredResponse`

Dodaj wyspecjalizowaną metodę do generowania strukturyzowanych odpowiedzi:

```typescript
async generateStructuredResponse<T>(options: {
  schema: object;
  userMessage: string;
  systemMessage?: string;
  model?: string;
  schemaName?: string;
  strict?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}): Promise<T> {
  const {
    schema,
    userMessage,
    systemMessage,
    model = this.defaultModel,
    schemaName = "ResponseSchema",
    strict = true,
    temperature = 0.5, // Niższa temperatura dla dokładniejszego wyniku
    maxTokens,
    timeout
  } = options;

  const responseFormat: ResponseFormat = {
    type: 'json_schema',
    schema,
    name: schemaName,
    strict
  };

  return this.completeChatRequest<T>({
    systemMessage,
    userMessage,
    model,
    responseFormat,
    temperature,
    maxTokens,
    timeout
  });
}
```

### Krok 9: Implementacja metody `generateSummary`

Dodaj wyspecjalizowaną metodę do generowania podsumowań:

```typescript
async generateSummary(options: {
  content: string | string[];
  systemMessage?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}): Promise<{ title: string; content: string }> {
  const {
    content,
    systemMessage = "Jesteś pomocnym asystentem, który generuje zwięzłe podsumowania.",
    model = this.defaultModel,
    maxTokens,
    temperature = 0.7,
    timeout
  } = options;

  const contentText = Array.isArray(content) ? content.join("\n\n") : content;
  const userMessage = `Wygeneruj zwięzłe podsumowanie następującej treści:

${contentText}

Proszę podać podsumowanie w następującym formacie:
TITLE: <wygenerowany tytuł>
CONTENT: <wygenerowana treść>`;

  const response = await this.completeChatRequest<string>({
    systemMessage,
    userMessage,
    model,
    temperature,
    maxTokens,
    timeout
  });

  // Parsujemy odpowiedź, aby wyodrębnić tytuł i treść
  const titleMatch = response.match(/TITLE:\s*(.*?)(?=\nCONTENT:|$)/s);
  const contentMatch = response.match(/CONTENT:\s*([\s\S]*?)$/s);

  return {
    title: titleMatch?.[1]?.trim() || "Podsumowanie",
    content: contentMatch?.[1]?.trim() || response.trim()
  };
}
```

### Krok 10: Aktualizacja pliku środowiskowego

Upewnij się, że w pliku `.env` istnieje zmienna dla klucza API:

```
OPENROUTER_API_KEY=your_api_key_here
```

### Krok 11: Rejestracja serwisu

Zarejestruj serwis w odpowiednim miejscu (np. w kontenerze DI, jeśli jest używany, lub jako export):

```typescript
// W pliku src/lib/services/index.ts
export * from './openrouter.service';

// Lub możesz stworzyć instancję z zmiennej środowiskowej
import { OpenRouterService } from './openrouter.service';

export const openRouterService = new OpenRouterService(
  import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ''
);
```

### Krok 12: Użycie serwisu w aplikacji

Przykład użycia serwisu w komponencie (np. w `src/components/Chat.astro`):

```typescript
---
import { openRouterService } from '../lib/services';

const message = "Wygeneruj 5 pomysłów na temat mojej kolejnej aplikacji mobilnej.";
const response = await openRouterService.completeChatRequest({
  systemMessage: "Jesteś kreatywnym asystentem pomagającym w burzy mózgów.",
  userMessage: message
});
---

<div class="chat-container">
  <div class="user-message">
    <p>{message}</p>
  </div>
  <div class="ai-response">
    <p>{response}</p>
  </div>
</div>
```

### Krok 13: Przykład strukturyzowanej odpowiedzi

Przykład użycia `generateStructuredResponse`:

```typescript
const productIdeas = await openRouterService.generateStructuredResponse<{
  ideas: Array<{ title: string; description: string; difficulty: 'easy' | 'medium' | 'hard' }>
}>({
  schema: {
    type: 'object',
    properties: {
      ideas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
          },
          required: ['title', 'description', 'difficulty']
        }
      }
    },
    required: ['ideas']
  },
  systemMessage: "Jesteś kreatywnym asystentem pomagającym w burzy mózgów.",
  userMessage: "Wygeneruj 5 pomysłów na temat mojej kolejnej aplikacji mobilnej."
});

// productIdeas.ideas będzie typizowane jako Array<{ title: string; description: string; difficulty: 'easy' | 'medium' | 'hard' }>
```

## Podsumowanie

Powyższy plan wdrożenia zapewnia kompleksowe rozwiązanie do integracji z API OpenRouter.ai. Usługa została zaprojektowana z myślą o elastyczności, bezpieczeństwie i łatwości użycia. Implementuje wszystkie wymagane funkcje, w tym komunikaty systemowe, komunikaty użytkownika, ustrukturyzowane odpowiedzi poprzez response_format, nazwy modeli i parametry modeli.

Postępując zgodnie z tym planem, deweloper powinien być w stanie skutecznie zaimplementować usługę OpenRouter, która spełni wszystkie wymagania projektu. 