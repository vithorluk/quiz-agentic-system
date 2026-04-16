import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { Logger } from '../utils/logger.js';
import { traceOperation } from '../utils/langsmith-tracing.js';

export class XAIProvider implements LLMProvider {
  private logger: Logger;
  private modelName = 'grok-4-1-fast-non-reasoning';

  constructor(private apiKey: string) {
    this.logger = new Logger('XAIProvider');
  }

  async generate(messages: LLMMessage[], _temperature = 0.7): Promise<LLMResponse> {
    this.logger.info(`Generating with ${this.modelName}`);

    return traceOperation(
      'XAIProvider.generate',
      {
        model: this.modelName,
        temperature: _temperature,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content.substring(0, 500) + (msg.content.length > 500 ? '...' : '') })),
        message_count: messages.length,
      },
      async () => {
      try {
        const requestBody = {
          model: this.modelName,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: _temperature,
          max_tokens: 4096,
        };

        this.logger.info(`Request payload: ${JSON.stringify(requestBody)}`);

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          this.logger.error(`xAI API error response: ${errorBody}`);
          throw new Error(`xAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content || '';

        this.logger.success(`Generated ${content.length} chars`);

        return {
          content,
          model: this.modelName,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
        };
      } catch (error) {
        this.logger.error('xAI generation failed', error);
        throw error;
      }
    },
    (result) => ({
      content: result.content.substring(0, 1000) + (result.content.length > 1000 ? '...' : ''),
      content_length: result.content.length,
      model: result.model,
      usage: result.usage,
    }));
  }

  getName(): string {
    return 'xAI';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
