import { config } from '../config/index.js';
import { InputGuard } from '../guards/InputGuard.js';
import { ContentFetcherAgent } from '../agents/ContentFetcherAgent.js';
import { QuizGeneratorAgent } from '../agents/QuizGeneratorAgent.js';
import { QuizRunnerAgent } from '../agents/QuizRunnerAgent.js';
import { ScorerAgent } from '../agents/ScorerAgent.js';
import { TextChunker } from '../rag/TextChunker.js';
import { Embedder } from '../rag/Embedder.js';
import { VectorRetriever } from '../rag/VectorRetriever.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { LLMOrchestrator } from '../llm/LLMOrchestrator.js';
import { QuizEvaluator } from '../evaluation/QuizEvaluator.js';
import { QuizOrchestrator } from './QuizOrchestrator.js';

export class ServiceFactory {
  static createInputGuard(): InputGuard {
    return new InputGuard({
      allowedDomains: config.allowedDomains,
      allowedSchemes: ['http', 'https']
    });
  }

  static createContentFetcher(): ContentFetcherAgent {
    return new ContentFetcherAgent({
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      maxContentLength: config.maxContentLength
    });
  }

  static createTextChunker(): TextChunker {
    return new TextChunker({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap
    });
  }

  static createEmbedder(): Embedder {
    return new Embedder();
  }

  static createVectorRetriever(): VectorRetriever {
    return new VectorRetriever();
  }

  static createLLMOrchestrator(): LLMOrchestrator {
    return new LLMOrchestrator({
      groqApiKey: config.groqApiKey,
      openaiApiKey: config.openaiApiKey,
      anthropicApiKey: config.anthropicApiKey
    });
  }

  static createQuizGenerator(): QuizGeneratorAgent {
    const llm = this.createLLMOrchestrator();

    return new QuizGeneratorAgent(llm, {
      minQuestions: config.minQuestions,
      maxQuestions: config.maxQuestions,
      answersPerQuestion: config.answersPerQuestion,
      maxRetries: 2
    });
  }

  static createQuizRunner(): QuizRunnerAgent {
    return new QuizRunnerAgent();
  }

  static createScorer(): ScorerAgent {
    return new ScorerAgent();
  }

  static createDatabase(): DatabaseService {
    return new DatabaseService(config.databasePath);
  }

  static createEvaluator(): QuizEvaluator {
    return new QuizEvaluator({
      minQualityScore: 70,
      maxDuplicateAnswerRatio: 0.2,
      minQuestionDiversity: 0.7
    });
  }

  static createOrchestrator(): QuizOrchestrator {
    return new QuizOrchestrator(
      this.createInputGuard(),
      this.createContentFetcher(),
      this.createTextChunker(),
      this.createEmbedder(),
      this.createVectorRetriever(),
      this.createQuizGenerator(),
      this.createQuizRunner(),
      this.createScorer(),
      this.createDatabase(),
      this.createEvaluator()
    );
  }
}
