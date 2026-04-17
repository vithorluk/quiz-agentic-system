import { InputGuard } from '../guards/InputGuard.js';
import { ContentFetcherAgent } from '../agents/ContentFetcherAgent.js';
import { QuizGeneratorAgent } from '../agents/QuizGeneratorAgent.js';
import { QuizRunnerAgent } from '../agents/QuizRunnerAgent.js';
import { ScorerAgent } from '../agents/ScorerAgent.js';
import { TextChunker } from '../rag/TextChunker.js';
import { Embedder } from '../rag/Embedder.js';
import { VectorRetriever } from '../rag/VectorRetriever.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { QuizEvaluator, EvaluationMetrics } from '../evaluation/QuizEvaluator.js';
import { Quiz } from '../domain/entities/Quiz.js';
import { QuizSession } from '../domain/entities/QuizSession.js';
import { Logger } from '../utils/logger.js';
import { CostTracker } from '../llmops/CostTracker.js';

export interface QuizResult {
  quiz: Quiz;
  evaluation?: EvaluationMetrics;
  sessionId?: string;
}

export class QuizOrchestrator {
  private logger: Logger;
  private costTracker: CostTracker;

  constructor(
    private inputGuard: InputGuard,
    private contentFetcher: ContentFetcherAgent,
    private chunker: TextChunker,
    private embedder: Embedder,
    private retriever: VectorRetriever,
    private quizGenerator: QuizGeneratorAgent,
    private quizRunner: QuizRunnerAgent,
    private scorer: ScorerAgent,
    private database: DatabaseService,
    private evaluator: QuizEvaluator
  ) {
    this.logger = new Logger('Orchestrator');
    this.costTracker = new CostTracker();
  }

  async generateQuiz(rawUrl: string): Promise<QuizResult> {
    this.logger.info('Starting quiz generation pipeline');

    const startTime = Date.now();

    const url = await this.inputGuard.validate(rawUrl);

    const fetchedContent = await this.contentFetcher.fetch(url);

    const chunks = this.chunker.chunk(fetchedContent.content);

    await this.embedder.initialize();
    const embeddedChunks = await this.embedder.embed(chunks);

    await this.retriever.initialize();
    await this.retriever.indexChunks(embeddedChunks);

    const topic = this.extractTopic(fetchedContent.content);

    const topChunks = embeddedChunks.slice(0, 10);

    const generationResult = await this.quizGenerator.generate(topChunks, url, topic);

    const latency = Date.now() - startTime;

    const cost = this.costTracker.calculate(generationResult.model, generationResult.usage);

    this.logger.info(`💰 Cost: $${cost.toFixed(4)}, ⏱️  Latency: ${latency}ms, 🤖 Model: ${generationResult.model}`);

    const evaluation = this.evaluator.evaluate(generationResult.quiz, fetchedContent.content);

    if (!evaluation.passed) {
      this.logger.warn('Quiz failed quality evaluation but will proceed');
    }

    const sessionId = await this.database.saveGeneratedQuiz(generationResult.quiz);

    await this.database.saveMetrics(sessionId, {
      cost,
      latency,
      model: generationResult.model,
      promptTokens: generationResult.usage.promptTokens,
      completionTokens: generationResult.usage.completionTokens,
      totalTokens: generationResult.usage.totalTokens,
      qualityScore: evaluation.overallScore,
      promptVersion: generationResult.promptVersion
    });

    this.logger.success('Quiz generation pipeline completed');

    return { quiz: generationResult.quiz, evaluation, sessionId };
  }

  async runFullPipeline(rawUrl: string): Promise<QuizResult> {
    const { quiz } = await this.generateQuiz(rawUrl);

    const runResult = await this.quizRunner.run(quiz);

    const scoreReport = this.scorer.calculate(runResult.answers);

    this.scorer.displayReport(scoreReport);

    const quizSession = new QuizSession(
      quiz,
      runResult.answers,
      scoreReport.finalScore,
      runResult.completedAt
    );

    const sessionId = await this.database.saveSession(quiz, quizSession, scoreReport);

    this.logger.success(`Quiz session saved with ID: ${sessionId}`);

    return { quiz, sessionId };
  }

  private extractTopic(content: string): string {
    const lines = content.split('\n');

    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        return h1Match[1].trim();
      }
    }

    const words = content.split(/\s+/).slice(0, 10).join(' ');
    return words.length > 50 ? words.substring(0, 50) + '...' : words;
  }
}
