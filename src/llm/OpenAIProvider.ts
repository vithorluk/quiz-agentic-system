import { ChatOpenAI } from '@langchain/openai';
import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { Logger } from '../utils/logger.js';
import { traceOperation } from '../utils/langsmith-tracing.js';

export class OpenAIProvider implements LLMProvider {
  private model: ChatOpenAI;
  private logger: Logger;
  private modelName = 'gpt-4o-mini';

  constructor(private apiKey: string) {
    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: this.modelName,
      temperature: 0.7,
    });
    this.logger = new Logger('OpenAIProvider');
  }

  async generate(messages: LLMMessage[], _temperature = 0.7): Promise<LLMResponse> {
    this.logger.info(`Generating with ${this.modelName}`);

    return traceOperation(
      'OpenAIProvider.generate',
      {
        model: this.modelName,
        temperature: _temperature,
        messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 500) + (m.content.length > 500 ? '...' : '') })),
        message_count: messages.length,
      },
      async () => {
      try {
        const formattedMessages = messages.map(msg => [msg.role, msg.content] as [string, string]);

        const response = await this.model.invoke(formattedMessages);

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

        this.logger.success(`Generated ${content.length} chars`);

        return {
          content,
          model: this.modelName,
        };
      } catch (error) {
        this.logger.error('OpenAI generation failed', error);
        throw error;
      }
    },
    (result) => ({
      content: result.content.substring(0, 1000) + (result.content.length > 1000 ? '...' : ''),
      content_length: result.content.length,
      model: result.model,
    }));
  }

  getName(): string {
    return 'OpenAI';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
