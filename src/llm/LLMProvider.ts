export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generate(messages: LLMMessage[], temperature?: number): Promise<LLMResponse>;
  getName(): string;
  isAvailable(): boolean;
}
