import { LLMProvider, LLMMessage, LLMResponse } from './LLMProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { XAIProvider } from './XAIProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { Logger } from '../utils/logger.js';

export interface LLMOrchestratorConfig {
  xaiApiKey?: string;
  groqApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

// Check if an API key is a valid (non-placeholder) value
function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  
  // Consider it invalid if it contains placeholder text
  return !key.toLowerCase().includes('example') &&
         !key.toLowerCase().includes('placeholder') &&
         !key.startsWith('your_') &&
         !key.includes('*') &&
         key.length > 15; // Valid API keys are typically longer
}

export class LLMOrchestrator {
  private providers: LLMProvider[] = [];
  private logger: Logger;

  constructor(config: LLMOrchestratorConfig) {
    this.logger = new Logger('LLMOrchestrator');

    if (isValidApiKey(config.anthropicApiKey)) {
      this.providers.push(new AnthropicProvider(config.anthropicApiKey!));
      this.logger.info('✓ Anthropic provider enabled');
    } else {
      this.logger.warn('⚠ Anthropic API key not configured or invalid');
    }

    if (isValidApiKey(config.xaiApiKey)) {
      this.providers.push(new XAIProvider(config.xaiApiKey!));
      this.logger.info('✓ xAI provider enabled');
    } else {
      this.logger.warn('⚠ xAI API key not configured or invalid');
    }

    if (isValidApiKey(config.groqApiKey)) {
      this.providers.push(new GroqProvider(config.groqApiKey!));
      this.logger.info('✓ Groq provider enabled');
    } else {
      this.logger.warn('⚠ Groq API key not configured or invalid (must start with "gsk_")');
    }

    if (isValidApiKey(config.openaiApiKey)) {
      this.providers.push(new OpenAIProvider(config.openaiApiKey!));
      this.logger.info('✓ OpenAI provider enabled');
    } else {
      this.logger.warn('⚠ OpenAI API key not configured or invalid');
    }

    if (this.providers.length === 0) {
      throw new Error('At least one valid LLM provider must be configured. Please add a valid API key to your .env file.');
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
