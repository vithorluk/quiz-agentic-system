import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { Logger } from '../utils/logger.js';

export interface LLMOrchestratorConfig {
  groqApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export class LLMOrchestrator {
  private providers: LLMProvider[] = [];
  private logger: Logger;

  constructor(config: LLMOrchestratorConfig) {
    this.logger = new Logger('LLMOrchestrator');

    if (config.groqApiKey) {
      this.providers.push(new GroqProvider(config.groqApiKey));
    }

    if (config.openaiApiKey) {
      this.providers.push(new OpenAIProvider(config.openaiApiKey));
    }

    if (this.providers.length === 0) {
      throw new Error('At least one LLM provider must be configured');
    }

    this.logger.info(`Initialized with ${this.providers.length} provider(s): ${this.providers.map(p => p.getName()).join(', ')}`);
  }

  async generate(messages: LLMMessage[], temperature = 0.7): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        this.logger.info(`Attempting generation with ${provider.getName()}`);
        const response = await provider.generate(messages, temperature);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`${provider.getName()} failed: ${lastError.message}`);
      }
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
  }

  getAvailableProviders(): string[] {
    return this.providers.filter(p => p.isAvailable()).map(p => p.getName());
  }
}
