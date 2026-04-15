import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { Logger } from '../utils/logger.js';
import { traceOperation } from '../utils/langsmith-tracing.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private logger: Logger;
  private modelName = 'claude-3-haiku-20240307';

  constructor(private apiKey: string) {
    this.client = new Anthropic({ apiKey });
    this.logger = new Logger('AnthropicProvider');
  }

  async generate(messages: LLMMessage[], temperature = 0.7): Promise<LLMResponse> {
    this.logger.info(`Generating with ${this.modelName}`);

    return traceOperation('AnthropicProvider.generate', { model: this.modelName, temperature }, async () => {
      try {
        // Separate system messages from other messages
        const systemMessages = messages.filter(msg => msg.role === 'system').map(msg => msg.content);
        const otherMessages = messages.filter(msg => msg.role !== 'system');

        const requestParams: any = {
          model: this.modelName,
          max_tokens: 2048,
          temperature,
          messages: otherMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
        };

        // Add system parameter if there are system messages
        if (systemMessages.length > 0) {
          requestParams.system = systemMessages.join('\n\n');
        }

        const response = await this.client.messages.create(requestParams);

        const content = response.content
          .map(block => ('text' in block ? block.text : ''))
          .join('\n');

        this.logger.success(`Generated ${content.length} chars`);

        return {
          content,
          model: this.modelName,
        };
      } catch (error) {
        this.logger.error('Anthropic generation failed', error);
        throw error;
      }
    });
  }

  getName(): string {
    return 'Anthropic';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
