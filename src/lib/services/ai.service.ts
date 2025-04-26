import type { NoteDTO } from "../../types";
import { OpenRouterService } from "./openrouter.service";

export class AIService {
  private readonly openRouterService: OpenRouterService;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "PUBLIC_OPENROUTER_API_KEY environment variable is required. Please add it to your .env or .env.local file."
      );
    }
    this.openRouterService = new OpenRouterService(apiKey);
  }

  /**
   * Generates a summary based on the provided notes using AI
   * @param notes Array of notes to summarize
   * @returns Generated title and content
   * @throws Error if AI service fails or timeout occurs
   */
  async generateSummary(notes: NoteDTO[]): Promise<{ title: string; content: string }> {
    if (!notes?.length) {
      throw new Error("At least one note is required for summarization");
    }

    try {
      const content = notes.map((note) => `Title: ${note.title}\nContent: ${note.content}`);

      return await this.openRouterService.generateSummary({
        content,
        systemMessage:
          "You are a helpful assistant that generates concise summaries. Focus on extracting key points and maintaining context between related notes.",
        model: "openai/gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
      });
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
