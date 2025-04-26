export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
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
  constructor(
    message: string,
    public rawResponse?: unknown
  ) {
    super(`Failed to parse OpenRouter response: ${message}`);
    this.name = "OpenRouterParsingError";
  }
}
