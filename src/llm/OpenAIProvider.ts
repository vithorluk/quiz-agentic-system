import { ChatOpenAI } from '@langchain/openai';
import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { Logger } from '../utils/logger.js';

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
  }

  getName(): string {
    return 'OpenAI';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
