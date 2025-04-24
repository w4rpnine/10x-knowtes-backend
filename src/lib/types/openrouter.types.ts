export interface ResponseFormat {
  type: "json_object" | "json_schema";
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

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChoice {
  index: number;
  message: OpenRouterMessage;
  finish_reason: string;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse<T = string> {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: T;
    };
    finish_reason: string;
  }[];
  usage: OpenRouterUsage;
}

export interface OpenRouterSummaryResponse {
  title: string;
  content: string;
}
