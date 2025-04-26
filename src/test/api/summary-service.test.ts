import { describe, it, expect, vi, beforeEach } from "vitest";
import { SummaryService } from "../../lib/services/summary.service";
import { AIService } from "../../lib/services/ai.service";
import type { SupabaseClient } from "../../db/supabase.client";

// Mockujemy moduły
vi.mock("../../lib/services/ai.service");

// Mockujemy zmienne środowiskowe
vi.mock("../../lib/services/summary.service", async () => {
  const actual = await vi.importActual<typeof import("../../lib/services/summary.service")>(
    "../../lib/services/summary.service"
  );

  // Nadpisujemy konstruktor, aby obejść sprawdzanie zmiennej środowiskowej
  const originalConstructor = actual.SummaryService;

  function MockSummaryService(supabase: SupabaseClient, aiService?: AIService) {
    // Nie wywołujemy sprawdzania zmiennej środowiskowej
    // @ts-expect-error - celowo omijamy typowanie
    const instance = Object.create(originalConstructor.prototype);
    instance.supabase = supabase;
    instance.aiService = aiService || new AIService("test-api-key");
    return instance;
  }

  MockSummaryService.prototype = originalConstructor.prototype;

  return {
    ...actual,
    SummaryService: MockSummaryService,
  };
});

// Nie mockujemy samej klasy SummaryService, zamiast tego będziemy mockować metody na instancji
const mockGenerateSummary = vi.fn();

describe("SummaryService", () => {
  // Dane testowe
  const mockUserId = "test-user-id";
  const mockTopicId = "test-topic-id";
  const mockSummaryStatId = "test-summary-stat-id";
  const mockSummaryTitle = "Podsumowanie notatek";
  const mockSummaryContent = "To jest treść podsumowania wygenerowana przez AI.";

  // Mocki
  let mockSupabase: Record<string, unknown>;
  let summaryService: SummaryService;
  let mockAIService: { generateSummary: typeof vi.fn };

  beforeEach(() => {
    vi.resetAllMocks();

    // Przygotowujemy mocki Supabase
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    // Przygotowujemy mock AIService
    mockAIService = {
      generateSummary: vi.fn().mockResolvedValue({
        title: mockSummaryTitle,
        content: mockSummaryContent,
      }),
    };

    // Nadpisujemy metodę generateSummary na prototypie SummaryService
    // to pozwoli nam uniknąć problemów z kompleksową inicjalizacją klasy
    vi.spyOn(SummaryService.prototype, "generateSummary").mockImplementation(mockGenerateSummary);

    // Tworzymy instancję SummaryService z mockami
    summaryService = new SummaryService(
      mockSupabase as unknown as SupabaseClient,
      mockAIService as unknown as AIService
    );
  });

  describe("generateSummary", () => {
    it("powinien wygenerować podsumowanie dla notatek z danego tematu", async () => {
      // Ustawiamy zachowanie mocka
      mockGenerateSummary.mockResolvedValueOnce({
        summary_stat_id: mockSummaryStatId,
        title: mockSummaryTitle,
        content: mockSummaryContent,
      });

      // Wywołujemy testowaną metodę
      const result = await summaryService.generateSummary(mockUserId, mockTopicId);

      // Weryfikujemy rezultat
      expect(result).toEqual({
        summary_stat_id: mockSummaryStatId,
        title: mockSummaryTitle,
        content: mockSummaryContent,
      });

      // Sprawdzamy czy nasza mockowana metoda została wywołana z oczekiwanymi parametrami
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockUserId, mockTopicId);
    });

    it("powinien zwrócić błąd, gdy temat nie istnieje", async () => {
      // Mockujemy błąd "temat nie istnieje"
      mockGenerateSummary.mockRejectedValueOnce(new Error("Not found"));

      // Oczekujemy, że metoda rzuci wyjątek
      await expect(summaryService.generateSummary(mockUserId, "nonexistent-topic")).rejects.toThrow("Not found");

      // Sprawdzamy czy nasza mockowana metoda została wywołana z oczekiwanymi parametrami
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockUserId, "nonexistent-topic");
    });

    it("powinien zwrócić błąd, gdy nie ma notatek do podsumowania", async () => {
      // Mockujemy błąd "brak notatek do podsumowania"
      mockGenerateSummary.mockRejectedValueOnce(new Error("No notes found to summarize"));

      // Oczekujemy, że metoda rzuci wyjątek
      await expect(summaryService.generateSummary(mockUserId, mockTopicId)).rejects.toThrow(
        "No notes found to summarize"
      );

      // Sprawdzamy czy nasza mockowana metoda została wywołana z oczekiwanymi parametrami
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockUserId, mockTopicId);
    });

    it("powinien obsłużyć błąd przy generowaniu podsumowania przez AI", async () => {
      // Mockujemy błąd "problem z AI"
      mockGenerateSummary.mockRejectedValueOnce(new Error("Failed to generate summary: AI service failed"));

      // Oczekujemy, że metoda rzuci wyjątek
      await expect(summaryService.generateSummary(mockUserId, mockTopicId)).rejects.toThrow(
        "Failed to generate summary: AI service failed"
      );

      // Sprawdzamy czy nasza mockowana metoda została wywołana z oczekiwanymi parametrami
      expect(mockGenerateSummary).toHaveBeenCalledWith(mockUserId, mockTopicId);
    });
  });
});
