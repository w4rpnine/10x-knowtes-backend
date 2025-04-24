import type {
  ResponseFormat,
  OpenRouterRequestOptions,
  OpenRouterResponse,
  OpenRouterMessage,
  OpenRouterSummaryResponse,
} from "../types/openrouter.types";
import { OpenRouterError, OpenRouterTimeoutError, OpenRouterParsingError } from "../errors/openrouter.errors";

export class OpenRouterService {
  private readonly OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = "openai/gpt-4o-mini",
    private readonly defaultTimeout = 30000
  ) {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required");
    }
  }

  private buildMessages(systemMessage: string | undefined, userMessage: string): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    if (systemMessage) {
      messages.push({ role: "system", content: systemMessage });
    }

    messages.push({ role: "user", content: userMessage });

    return messages;
  }

  private async callOpenRouter(options: {
    messages: OpenRouterMessage[];
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
      timeout = this.defaultTimeout,
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestBody: Record<string, unknown> = {
        model,
        messages,
        temperature,
      };

      if (maxTokens) requestBody.max_tokens = maxTokens;
      if (topP) requestBody.top_p = topP;
      if (frequencyPenalty) requestBody.frequency_penalty = frequencyPenalty;
      if (presencePenalty) requestBody.presence_penalty = presencePenalty;

      if (responseFormat) {
        if (responseFormat.type === "json_object") {
          requestBody.response_format = { type: "json_object" };
        } else if (responseFormat.type === "json_schema") {
          requestBody.response_format = {
            type: "json_schema",
            schema: responseFormat.schema,
            name: responseFormat.name || "ResponseSchema",
            strict: responseFormat.strict !== false,
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

  private async parseResponse<T>(response: Response, responseFormat?: ResponseFormat): Promise<T> {
    try {
      const data = (await response.json()) as OpenRouterResponse<T>;

      if (!data.choices?.length || !data.choices[0].message) {
        throw new OpenRouterParsingError("Invalid response structure", data);
      }

      const content = data.choices[0].message.content;

      if (responseFormat?.type === "json_object" || responseFormat?.type === "json_schema") {
        try {
          if (typeof content === "object") {
            return content as T;
          }
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

  /**
   * Sends a chat completion request to the OpenRouter API.
   *
   * @template T - The expected type of the response content. Defaults to string.
   * @param {OpenRouterRequestOptions} options - The request options.
   * @param {string} options.userMessage - The message from the user to process.
   * @param {string} [options.systemMessage] - Optional system message to set the context or behavior.
   * @param {string} [options.model] - The model to use. Defaults to the service's default model.
   * @param {ResponseFormat} [options.responseFormat] - Format specification for structured responses.
   * @param {number} [options.temperature] - Controls randomness in the response (0-1).
   * @param {number} [options.maxTokens] - Maximum number of tokens to generate.
   * @param {number} [options.topP] - Controls diversity via nucleus sampling.
   * @param {number} [options.frequencyPenalty] - Reduces repetition of token sequences.
   * @param {number} [options.presencePenalty] - Reduces repetition of topics.
   * @param {number} [options.timeout] - Request timeout in milliseconds.
   * @returns {Promise<T>} The processed response from the model.
   * @throws {OpenRouterError} If the request fails or validation fails.
   */
  async completeChatRequest<T = string>(options: OpenRouterRequestOptions): Promise<T> {
    // Validate required fields
    if (!options?.userMessage?.trim()) {
      throw new OpenRouterError("User message is required and cannot be empty");
    }

    // Validate numeric parameters
    if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 1)) {
      throw new OpenRouterError("Temperature must be between 0 and 1");
    }

    if (options.maxTokens !== undefined && options.maxTokens <= 0) {
      throw new OpenRouterError("Max tokens must be greater than 0");
    }

    if (options.topP !== undefined && (options.topP < 0 || options.topP > 1)) {
      throw new OpenRouterError("Top P must be between 0 and 1");
    }

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
      timeout,
    } = options;

    const messages = this.buildMessages(systemMessage, userMessage.trim());

    const response = await this.callOpenRouter({
      messages,
      model,
      responseFormat,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      timeout,
    });

    return this.parseResponse<T>(response, responseFormat);
  }

  /**
   * Generates a response that conforms to a specified JSON schema.
   *
   * @template T - The TypeScript type that matches the schema structure.
   * @param {Object} options - The structured response options.
   * @param {object} options.schema - JSON schema that defines the response structure.
   * @param {string} options.userMessage - The message to process.
   * @param {string} [options.systemMessage] - Optional system message for context.
   * @param {string} [options.model] - Model to use. Defaults to service's default.
   * @param {string} [options.schemaName="ResponseSchema"] - Name of the schema for documentation.
   * @param {boolean} [options.strict=true] - Whether to enforce strict schema validation.
   * @param {number} [options.temperature=0.5] - Temperature for response generation.
   * @param {number} [options.maxTokens] - Maximum tokens to generate.
   * @param {number} [options.timeout] - Request timeout in milliseconds.
   * @returns {Promise<T>} The structured response matching the schema.
   * @throws {OpenRouterError} If validation fails or the request fails.
   */
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
    // Validate schema
    if (!options?.schema || typeof options.schema !== "object") {
      throw new OpenRouterError("A valid JSON schema object is required");
    }

    // Validate user message
    if (!options?.userMessage?.trim()) {
      throw new OpenRouterError("User message is required and cannot be empty");
    }

    const {
      schema,
      userMessage,
      systemMessage,
      model = this.defaultModel,
      schemaName = "ResponseSchema",
      strict = true,
      temperature = 0.5,
      maxTokens,
      timeout,
    } = options;

    const responseFormat: ResponseFormat = {
      type: "json_schema",
      schema,
      name: schemaName,
      strict,
    };

    return this.completeChatRequest<T>({
      systemMessage,
      userMessage: userMessage.trim(),
      model,
      responseFormat,
      temperature,
      maxTokens,
      timeout,
    });
  }

  /**
   * Generates a concise summary of the provided content.
   *
   * @param {Object} options - The summary generation options.
   * @param {string | string[]} options.content - Content to summarize. Can be a single string or array of strings.
   * @param {string} [options.systemMessage] - Custom system message for summary generation.
   * @param {string} [options.model] - Model to use. Defaults to service's default.
   * @param {number} [options.maxTokens] - Maximum tokens for the summary.
   * @param {number} [options.temperature=0.7] - Temperature for summary generation.
   * @param {number} [options.timeout] - Request timeout in milliseconds.
   * @returns {Promise<OpenRouterSummaryResponse>} Object containing the summary title and content.
   * @throws {OpenRouterError} If content is empty or the request fails.
   * @throws {OpenRouterParsingError} If the response format is invalid.
   */
  async generateSummary(options: {
    content: string | string[];
    systemMessage?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  }): Promise<OpenRouterSummaryResponse> {
    // Validate content
    if (!options?.content || (Array.isArray(options.content) && options.content.length === 0)) {
      throw new OpenRouterError("Content for summarization is required and cannot be empty");
    }

    const {
      content,
      systemMessage = "You are a helpful assistant that generates concise summaries.",
      model = this.defaultModel,
      maxTokens,
      temperature = 0.7,
      timeout,
    } = options;

    const contentText = Array.isArray(content) ? content.filter((text) => text?.trim()).join("\n\n") : content.trim();

    if (!contentText) {
      throw new OpenRouterError("Content for summarization is required and cannot be empty");
    }

    const userMessage = `Generate a concise summary of the following content:

${contentText}

Please provide the summary in the following format:
TITLE: <generated title>
CONTENT: <generated content>`;

    const response = await this.completeChatRequest<string>({
      systemMessage,
      userMessage,
      model,
      temperature,
      maxTokens,
      timeout,
    });

    const titleMatch = response.match(/TITLE:\s*(.*?)(?=\nCONTENT:|$)/s);
    const contentMatch = response.match(/CONTENT:\s*([\s\S]*?)$/s);

    if (!titleMatch?.[1] || !contentMatch?.[1]) {
      throw new OpenRouterParsingError("Failed to parse summary response format - missing title or content", response);
    }

    return {
      title: titleMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  }
}
