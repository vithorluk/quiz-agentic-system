import { Quiz } from '../domain/entities/Quiz.js';
import { Question } from '../domain/entities/Question.js';
import { Url } from '../domain/value-objects/Url.js';
import { LLMOrchestrator } from '../llm/LLMOrchestrator.js';
import { EmbeddedChunk } from '../rag/Embedder.js';
import { Logger } from '../utils/logger.js';
import { QuizSchema } from '../types/index.js';

export interface QuizGeneratorConfig {
  minQuestions: number;
  maxQuestions: number;
  answersPerQuestion: number;
  maxRetries: number;
}

export class QuizGeneratorAgent {
  private logger: Logger;

  constructor(
    private llm: LLMOrchestrator,
    private config: QuizGeneratorConfig
  ) {
    this.logger = new Logger('QuizGenerator');
  }

  async generate(chunks: EmbeddedChunk[], sourceUrl: Url, topic: string): Promise<Quiz> {
    this.logger.info(`Generating quiz for topic: ${topic}`);

    const context = this.buildContext(chunks);
    const prompt = this.buildPrompt(context, topic);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Generation attempt ${attempt}/${this.config.maxRetries}`);

        const response = await this.llm.generate([
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ], 0.7);

        const quiz = this.parseAndValidate(response.content, sourceUrl, topic);

        this.logger.success(`Quiz generated with ${quiz.getQuestionCount()} questions`);
        return quiz;
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

  private getSystemPrompt(): string {
    return `You are an expert quiz generator. Create high-quality, educational quizzes based on the provided content.

Requirements:
- Generate ${this.config.minQuestions}-${this.config.maxQuestions} questions
- Each question must have exactly ${this.config.answersPerQuestion} answer options
- Mark correct answers with their indices (0-3)
- Support both single-choice and multiple-choice questions
- Include explanations for correct answers
- Ensure questions test understanding, not just memorization

Output ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "question": "string (min 10 chars)",
      "answers": ["option1", "option2", "option3", "option4"],
      "correctAnswers": [0],
      "isMultipleChoice": false,
      "explanation": "optional explanation"
    }
  ],
  "topic": "string",
  "sourceUrl": "string"
}`;
  }

  private buildPrompt(context: string, topic: string): string {
    return `Generate a quiz about "${topic}" based on the following content:

${context}

Create ${this.config.minQuestions}-${this.config.maxQuestions} challenging questions that test deep understanding of the material.`;
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
