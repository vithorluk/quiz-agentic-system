import Groq from 'groq-sdk';
import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { Logger } from '../utils/logger.js';
import { traceOperation } from '../utils/langsmith-tracing.js';

export class GroqProvider implements LLMProvider {
  private client: Groq;
  private logger: Logger;
  private modelName = 'llama-3.1-70b-versatile';

  constructor(private apiKey: string) {
    this.client = new Groq({ apiKey });
    this.logger = new Logger('GroqProvider');
  }

  async generate(messages: LLMMessage[], temperature = 0.7): Promise<LLMResponse> {
    this.logger.info(`Generating with ${this.modelName}`);

    return traceOperation(
      'GroqProvider.generate',
      {
        model: this.modelName,
        temperature,
        messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 500) + (m.content.length > 500 ? '...' : '') })),
        message_count: messages.length,
      },
      async () => {
      try {
        const response = await this.client.chat.completions.create({
          model: this.modelName,
          messages: messages as any,
          temperature,
          max_tokens: 4096,
        });

        const content = response.choices[0]?.message?.content || '';

        this.logger.success(`Generated ${content.length} chars`);

        return {
          content,
          model: this.modelName,
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
        };
      } catch (error) {
        this.logger.error('Groq generation failed', error);
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
    return 'Groq';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
