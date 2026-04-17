export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostMetrics {
  cost: number;
  model: string;
  usage: TokenUsage;
}

export class CostTracker {
  private readonly PRICING: Record<string, { input: number; output: number }> = {
    'llama-3.1-70b-versatile': { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
    'llama-3.1-8b-instant': { input: 0.05 / 1_000_000, output: 0.08 / 1_000_000 },
    'llama3-70b-8192': { input: 0.59 / 1_000_000, output: 0.79 / 1_000_000 },
    'llama3-8b-8192': { input: 0.05 / 1_000_000, output: 0.08 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
    'gpt-4o': { input: 5.00 / 1_000_000, output: 15.00 / 1_000_000 },
    'gpt-3.5-turbo': { input: 0.50 / 1_000_000, output: 1.50 / 1_000_000 },
    'claude-3-5-sonnet-20241022': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 },
    'claude-3-haiku-20240307': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  };

  calculate(model: string, usage: TokenUsage): number {
    const pricing = this.PRICING[model];
    if (!pricing) {
      return 0;
    }
    return (usage.promptTokens * pricing.input) + (usage.completionTokens * pricing.output);
  }

  getCostMetrics(model: string, usage: TokenUsage): CostMetrics {
    return {
      cost: this.calculate(model, usage),
      model,
      usage
    };
  }
}
