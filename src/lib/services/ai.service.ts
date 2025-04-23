import type { NoteDTO } from "../../types";

export class AIService {
  private readonly OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

  constructor(private readonly apiKey: string) {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }

  /**
   * Generates a summary based on the provided notes using AI
   * @param notes Array of notes to summarize
   * @returns Generated title and content
   * @throws Error if AI service fails or timeout occurs
   */
  async generateSummary(notes: NoteDTO[]): Promise<{ title: string; content: string }> {
    const prompt = this.buildSummaryPrompt(notes);

    try {
      const response = await this.callOpenRouter(prompt);
      return this.parseSummaryResponse(response);
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private buildSummaryPrompt(notes: NoteDTO[]): string {
    const notesContent = notes.map((note) => `Title: ${note.title}\nContent: ${note.content}`).join("\n\n");

    return `Please generate a concise summary of the following notes, including a title and content:

Notes to summarize:
${notesContent}

Please provide the summary in the following format:
TITLE: <generated title>
CONTENT: <generated content>`;
  }

  private async callOpenRouter(prompt: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(this.OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://knowtes.app",
        },
        body: JSON.stringify({
          model: "openai/gpt-4-turbo-preview",
          messages: [
            { role: "system", content: "You are a helpful assistant that generates concise summaries." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseSummaryResponse(_response: Response): { title: string; content: string } {
    // Mock implementation for now
    return {
      title: "Summary of Your Notes",
      content:
        "This is a placeholder summary of your notes. The actual implementation will parse the AI response to extract meaningful title and content.",
    };
  }
}
