import { describe, it, expect, vi, beforeEach } from "vitest";
import { SummaryService } from "../../lib/services/summary.service";
import type { APIContext } from "astro";

// Mockujemy moduły
vi.mock("../../lib/services/summary.service");
vi.mock("../../db/supabase.client", () => ({
  DEFAULT_USER_ID: "00000000-0000-4000-a000-000000000000",
  createClient: vi.fn(),
}));

// Mockujemy schemat walidacji UUID
vi.mock("../../lib/schemas/summary.schema", () => ({
  summaryTopicIdSchema: {
    parse: vi.fn((params) => ({ topicId: params.topicId })),
  },
}));

// Mockujemy obsługę błędów API
vi.mock("../../lib/utils/error-handling", () => {
  // Definiujemy własną implementację APIError, nie importując jej
  class MockAPIError extends Error {
    constructor(
      message: string,
      public status: number
    ) {
      super(message);
      this.name = "APIError";
    }
  }

  return {
    handleAPIError: vi.fn((error) => {
      // Mapujemy komunikaty błędów na odpowiednie kody statusu HTTP
      if (error.message.includes("No notes found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message.includes("Topic not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message.includes("Failed to generate summary")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Domyślnie zwracamy 500
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }),
    APIError: MockAPIError,
  };
});

// Mockujemy wartości domyślne dla testu
const mockUserId = "00000000-0000-4000-a000-000000000000";
const mockTopicId = "00000000-0000-4000-a000-000000000001";
const mockSummaryStatId = "00000000-0000-4000-a000-000000000002";
const mockSummaryTitle = "Podsumowanie notatek";
const mockSummaryContent = "To jest treść podsumowania wygenerowana przez AI.";

// Tworzymy typ częściowego kontekstu Astro dla testów
interface PartialContext {
  params: Record<string, string>;
  locals: {
    supabase: unknown;
    session?: {
      user: {
        id: string;
      };
    };
  };
}

// Dynamicznie importujemy endpoint, aby wcześniej zaaplikować mocki
let POST: (context: APIContext) => Promise<Response>;

describe("Generate Summary Endpoint", () => {
  beforeEach(async () => {
    vi.resetAllMocks();

    // Dynamiczny import po mockach
    const module = await import("../../pages/api/topics/[topicId]/summaries/index");
    POST = module.POST;

    // Mockujemy metodę generateSummary w SummaryService
    vi.mocked(SummaryService.prototype.generateSummary).mockResolvedValue({
      summary_stat_id: mockSummaryStatId,
      title: mockSummaryTitle,
      content: mockSummaryContent,
    });
  });

  it("powinien wygenerować podsumowanie na podstawie notatek z danego tematu", async () => {
    // Symulowany obiekt kontekstu Astro
    const context: PartialContext = {
      params: { topicId: mockTopicId },
      locals: {
        supabase: {}, // Mock klienta Supabase
        session: { user: { id: mockUserId } },
      },
    };

    // Wywołujemy testowany endpoint
    const response = await POST(context as unknown as APIContext);

    // Sprawdzamy czy otrzymaliśmy poprawną odpowiedź
    expect(response.status).toBe(201);

    // Parsujemy odpowiedź
    const responseBody = await response.json();

    // Weryfikujemy strukturę i zawartość odpowiedzi
    expect(responseBody).toHaveProperty("summary_stat_id", mockSummaryStatId);
    expect(responseBody).toHaveProperty("title", mockSummaryTitle);
    expect(responseBody).toHaveProperty("content", mockSummaryContent);

    // Sprawdzamy czy SummaryService został wywołany z poprawnymi parametrami
    expect(SummaryService).toHaveBeenCalledOnce();
    expect(SummaryService.prototype.generateSummary).toHaveBeenCalledWith(mockUserId, mockTopicId);
  });

  it("powinien obsłużyć sytuację, gdy nie ma notatek do podsumowania", async () => {
    // Mockujemy błąd "brak notatek"
    vi.mocked(SummaryService.prototype.generateSummary).mockRejectedValueOnce(new Error("No notes found to summarize"));

    // Symulowany obiekt kontekstu
    const context: PartialContext = {
      params: { topicId: mockTopicId },
      locals: {
        supabase: {},
        session: { user: { id: mockUserId } },
      },
    };

    // Wywołujemy testowany endpoint
    const response = await POST(context as unknown as APIContext);

    // Sprawdzamy, czy otrzymaliśmy odpowiedni kod błędu
    expect(response.status).toBe(400);

    // Parsujemy odpowiedź
    const responseBody = await response.json();

    // Weryfikujemy strukturę i zawartość odpowiedzi błędu
    expect(responseBody).toHaveProperty("error");
    expect(responseBody.error).toContain("No notes found");
  });

  it("powinien obsłużyć sytuację, gdy temat nie istnieje", async () => {
    // Mockujemy błąd "temat nie istnieje"
    vi.mocked(SummaryService.prototype.generateSummary).mockRejectedValueOnce(
      new Error("Topic not found or access denied")
    );

    // Symulowany obiekt kontekstu
    const context: PartialContext = {
      params: { topicId: "nonexistent-topic" },
      locals: {
        supabase: {},
        session: { user: { id: mockUserId } },
      },
    };

    // Wywołujemy testowany endpoint
    const response = await POST(context as unknown as APIContext);

    // Sprawdzamy, czy otrzymaliśmy odpowiedni kod błędu
    expect(response.status).toBe(404);

    // Parsujemy odpowiedź
    const responseBody = await response.json();

    // Weryfikujemy strukturę i zawartość odpowiedzi błędu
    expect(responseBody).toHaveProperty("error");
    expect(responseBody.error).toContain("Topic not found");
  });

  it("powinien obsłużyć błąd w przypadku problemów z AI", async () => {
    // Mockujemy błąd przy generowaniu przez AI
    vi.mocked(SummaryService.prototype.generateSummary).mockRejectedValueOnce(
      new Error("Failed to generate summary: API error")
    );

    // Symulowany obiekt kontekstu
    const context: PartialContext = {
      params: { topicId: mockTopicId },
      locals: {
        supabase: {},
        session: { user: { id: mockUserId } },
      },
    };

    // Wywołujemy testowany endpoint
    const response = await POST(context as unknown as APIContext);

    // Sprawdzamy, czy otrzymaliśmy odpowiedni kod błędu
    expect(response.status).toBe(500);

    // Parsujemy odpowiedź
    const responseBody = await response.json();

    // Weryfikujemy strukturę i zawartość odpowiedzi błędu
    expect(responseBody).toHaveProperty("error");
    expect(responseBody.error).toContain("Failed to generate summary");
  });
});
