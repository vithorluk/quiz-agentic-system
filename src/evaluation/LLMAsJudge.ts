import { Quiz } from '../domain/entities/Quiz.js';
import { LLMOrchestrator } from '../llm/LLMOrchestrator.js';
import { Logger } from '../utils/logger.js';

export interface LLMJudgeResult {
  score: number;
  reasoning: string;
  improvements: string[];
}

export class LLMAsJudge {
  private logger: Logger;

  constructor(private llm: LLMOrchestrator) {
    this.logger = new Logger('LLMJudge');
  }

  async judge(quiz: Quiz, sourceContent: string): Promise<LLMJudgeResult> {
    this.logger.info('Running LLM-as-judge evaluation...');

    const prompt = this.buildJudgePrompt(quiz, sourceContent);

    try {
      const response = await this.llm.generate([
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ], 0.3);

      const result = this.parseJudgeResponse(response.content);

      this.logger.success(`LLM Judge score: ${result.score}/10`);

      return result;
    } catch (error) {
      this.logger.error('LLM Judge evaluation failed', error);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert educational content evaluator. Your task is to assess quiz quality based on:

1. Question clarity and precision
2. Answer quality and plausibility of distractors
3. Appropriate difficulty level
4. Content alignment with source material
5. Educational value

Provide your evaluation in JSON format:
{
  "score": <number 1-10>,
  "reasoning": "<detailed explanation>",
  "improvements": ["<suggestion 1>", "<suggestion 2>", ...]
}

Be critical but fair. A score of 7+ indicates excellent quality.`;
  }

  private buildJudgePrompt(quiz: Quiz, sourceContent: string): string {
    const questionsText = quiz.questions.map((q, i) => {
      const correctLabels = q.correctAnswers.map(idx => String.fromCharCode(65 + idx)).join(', ');
      return `Question ${i + 1}: ${q.text}
  A) ${q.answers[0]}
  B) ${q.answers[1]}
  C) ${q.answers[2]}
  D) ${q.answers[3]}
  Correct: ${correctLabels}
  ${q.explanation ? `Explanation: ${q.explanation}` : ''}`;
    }).join('\n\n');

    return `Evaluate this quiz generated from source content:

SOURCE CONTENT (first 500 chars):
${sourceContent.substring(0, 500)}...

QUIZ (topic: ${quiz.topic}):
${questionsText}

Provide your evaluation as JSON.`;
  }

  private parseJudgeResponse(content: string): LLMJudgeResult {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in LLM Judge response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      score: parsed.score || 0,
      reasoning: parsed.reasoning || 'No reasoning provided',
      improvements: parsed.improvements || []
    };
  }
}
