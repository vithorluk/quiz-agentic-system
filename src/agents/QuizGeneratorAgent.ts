import { Quiz } from '../domain/entities/Quiz.js';
import { Question } from '../domain/entities/Question.js';
import { Url } from '../domain/value-objects/Url.js';
import { LLMOrchestrator } from '../llm/LLMOrchestrator.js';
import { EmbeddedChunk } from '../rag/Embedder.js';
import { Logger } from '../utils/logger.js';
import { QuizSchema } from '../types/index.js';
import { getPromptVersion, CURRENT_VERSION, renderUserPrompt } from '../prompts/quiz-generation.js';

export interface QuizGeneratorConfig {
  minQuestions: number;
  maxQuestions: number;
  answersPerQuestion: number;
  maxRetries: number;
}

export interface QuizGenerationResult {
  quiz: Quiz;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  promptVersion: string;
}

export class QuizGeneratorAgent {
  private logger: Logger;

  constructor(
    private llm: LLMOrchestrator,
    private config: QuizGeneratorConfig
  ) {
    this.logger = new Logger('QuizGenerator');
  }

  async generate(chunks: EmbeddedChunk[], sourceUrl: Url, topic: string): Promise<QuizGenerationResult> {
    this.logger.info(`Generating quiz for topic: ${topic}`);

    const promptVersion = getPromptVersion(CURRENT_VERSION);
    const context = this.buildContext(chunks);
    const userPrompt = renderUserPrompt(promptVersion.userPromptTemplate, {
      topic,
      context,
      minQuestions: this.config.minQuestions.toString(),
      maxQuestions: this.config.maxQuestions.toString()
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Generation attempt ${attempt}/${this.config.maxRetries} (prompt: ${CURRENT_VERSION})`);

        const response = await this.llm.generate([
          {
            role: 'system',
            content: promptVersion.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ], 0.7);

        const quiz = this.parseAndValidate(response.content, sourceUrl, topic);

        this.logger.success(`Quiz generated with ${quiz.getQuestionCount()} questions using ${response.model}`);

        return {
          quiz,
          model: response.model,
          usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          promptVersion: CURRENT_VERSION
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
      }
    }

    throw new Error(`Failed to generate valid quiz after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  private buildContext(chunks: EmbeddedChunk[]): string {
    return chunks
      .map((chunk, i) => `[Chunk ${i + 1}]\n${chunk.content}`)
      .join('\n\n');
  }

  private parseAndValidate(content: string, sourceUrl: Url, topic: string): Quiz {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const validated = QuizSchema.parse({
      ...parsed,
      topic,
      sourceUrl: sourceUrl.getValue()
    });

    const questions = validated.questions.map(q =>
      new Question(
        q.question,
        q.answers,
        q.correctAnswers,
        q.isMultipleChoice,
        q.explanation
      )
    );

    return new Quiz(questions, validated.topic, sourceUrl);
  }
}
