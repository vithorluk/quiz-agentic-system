import { Quiz } from '../domain/entities/Quiz.js';
import { Question } from '../domain/entities/Question.js';
import { Logger } from '../utils/logger.js';

export interface EvaluationMetrics {
  overallScore: number;
  questionQuality: number;
  answerDistribution: number;
  difficultyBalance: number;
  contentRelevance: number;
  issues: string[];
  warnings: string[];
  passed: boolean;
}

export interface EvaluationConfig {
  minQualityScore: number;
  maxDuplicateAnswerRatio: number;
  minQuestionDiversity: number;
}

export class QuizEvaluator {
  private logger: Logger;

  constructor(private config: EvaluationConfig) {
    this.logger = new Logger('QuizEvaluator');
  }

  evaluate(quiz: Quiz, sourceContent: string): EvaluationMetrics {
    this.logger.info(`Evaluating quiz: ${quiz.topic}`);

    const issues: string[] = [];
    const warnings: string[] = [];

    const questionQuality = this.evaluateQuestionQuality(quiz.questions, issues, warnings);
    const answerDistribution = this.evaluateAnswerDistribution(quiz.questions, issues, warnings);
    const difficultyBalance = this.evaluateDifficultyBalance(quiz.questions, warnings);
    const contentRelevance = this.evaluateContentRelevance(quiz, sourceContent, issues);

    const overallScore = (
      questionQuality * 0.35 +
      answerDistribution * 0.25 +
      difficultyBalance * 0.20 +
      contentRelevance * 0.20
    );

    const passed = overallScore >= this.config.minQualityScore && issues.length === 0;

    const metrics: EvaluationMetrics = {
      overallScore,
      questionQuality,
      answerDistribution,
      difficultyBalance,
      contentRelevance,
      issues,
      warnings,
      passed
    };

    this.logResults(metrics);

    return metrics;
  }

  private evaluateQuestionQuality(
    questions: ReadonlyArray<Question>,
    issues: string[],
    warnings: string[]
  ): number {
    let score = 100;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (q.text.length < 20) {
        issues.push(`Q${i + 1}: Question too short (${q.text.length} chars)`);
        score -= 15;
      }

      if (q.text.length > 200) {
        warnings.push(`Q${i + 1}: Question quite long (${q.text.length} chars)`);
        score -= 5;
      }

      if (!q.text.includes('?') && !q.text.toLowerCase().includes('which') &&
          !q.text.toLowerCase().includes('what') && !q.text.toLowerCase().includes('how')) {
        warnings.push(`Q${i + 1}: Question might not be properly formatted`);
        score -= 5;
      }

      const avgAnswerLength = q.answers.reduce((sum, a) => sum + a.length, 0) / q.answers.length;
      if (avgAnswerLength < 3) {
        issues.push(`Q${i + 1}: Answers too short (avg ${avgAnswerLength.toFixed(1)} chars)`);
        score -= 10;
      }

      const answerLengths = q.answers.map(a => a.length);
      const maxLen = Math.max(...answerLengths);
      const minLen = Math.min(...answerLengths);
      if (maxLen > minLen * 3) {
        warnings.push(`Q${i + 1}: Answer length variance too high`);
        score -= 3;
      }
    }

    return Math.max(0, score);
  }

  private evaluateAnswerDistribution(
    questions: ReadonlyArray<Question>,
    issues: string[],
    warnings: string[]
  ): number {
    let score = 100;

    const correctPositions: number[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (q.correctAnswers.length > 1) {
        continue;
      }

      correctPositions.push(q.correctAnswers[0]);

      const uniqueAnswers = new Set(q.answers.map(a => a.toLowerCase().trim()));
      if (uniqueAnswers.size < 4) {
        issues.push(`Q${i + 1}: Duplicate or near-duplicate answers detected`);
        score -= 20;
      }
    }

    if (correctPositions.length >= 3) {
      const positionCounts = [0, 0, 0, 0];
      correctPositions.forEach(pos => positionCounts[pos]++);

      const maxCount = Math.max(...positionCounts);
      const bias = maxCount / correctPositions.length;

      if (bias > 0.6) {
        warnings.push(`Correct answer position bias detected (${(bias * 100).toFixed(0)}% at position ${positionCounts.indexOf(maxCount)})`);
        score -= 15;
      }
    }

    const multipleChoiceCount = questions.filter(q => q.isMultipleChoice).length;
    const singleChoiceCount = questions.length - multipleChoiceCount;

    if (multipleChoiceCount === 0 && questions.length >= 5) {
      warnings.push('No multiple-choice questions found');
      score -= 10;
    }

    if (singleChoiceCount === 0 && questions.length >= 5) {
      warnings.push('No single-choice questions found');
      score -= 10;
    }

    return Math.max(0, score);
  }

  private evaluateDifficultyBalance(
    questions: ReadonlyArray<Question>,
    warnings: string[]
  ): number {
    let score = 100;

    const multipleChoiceCount = questions.filter(q => q.isMultipleChoice).length;
    const ratio = multipleChoiceCount / questions.length;

    if (ratio > 0.7) {
      warnings.push(`High ratio of multiple-choice questions (${(ratio * 100).toFixed(0)}%)`);
      score -= 15;
    }

    if (ratio < 0.2 && questions.length >= 5) {
      warnings.push(`Low ratio of multiple-choice questions (${(ratio * 100).toFixed(0)}%)`);
      score -= 10;
    }

    const withExplanation = questions.filter(q => q.explanation && q.explanation.length > 20).length;
    const explanationRatio = withExplanation / questions.length;

    if (explanationRatio < 0.5) {
      warnings.push(`Only ${(explanationRatio * 100).toFixed(0)}% of questions have explanations`);
      score -= 10;
    }

    return Math.max(0, score);
  }

  private evaluateContentRelevance(
    quiz: Quiz,
    sourceContent: string,
    issues: string[]
  ): number {
    let score = 100;

    const contentLower = sourceContent.toLowerCase();

    let relevantQuestions = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const questionWords = q.text.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4);

      let foundWords = 0;
      for (const word of questionWords.slice(0, 5)) {
        if (contentLower.includes(word)) {
          foundWords++;
        }
      }

      if (foundWords >= 2) {
        relevantQuestions++;
      }
    }

    const relevanceRatio = relevantQuestions / quiz.questions.length;

    if (relevanceRatio < 0.6) {
      issues.push(`Low content relevance: only ${(relevanceRatio * 100).toFixed(0)}% of questions appear related to source`);
      score -= 30;
    } else if (relevanceRatio < 0.8) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private logResults(metrics: EvaluationMetrics): void {
    if (metrics.passed) {
      this.logger.success(`Quiz evaluation PASSED (score: ${metrics.overallScore.toFixed(1)}%)`);
    } else {
      this.logger.warn(`Quiz evaluation FAILED (score: ${metrics.overallScore.toFixed(1)}%)`);
    }

    if (metrics.issues.length > 0) {
      this.logger.warn(`Issues (${metrics.issues.length}):`);
      metrics.issues.forEach(issue => this.logger.warn(`  - ${issue}`));
    }

    if (metrics.warnings.length > 0) {
      this.logger.info(`Warnings (${metrics.warnings.length}):`);
      metrics.warnings.forEach(warning => this.logger.info(`  - ${warning}`));
    }

    this.logger.info('Detailed scores:');
    this.logger.info(`  Question Quality:    ${metrics.questionQuality.toFixed(1)}%`);
    this.logger.info(`  Answer Distribution: ${metrics.answerDistribution.toFixed(1)}%`);
    this.logger.info(`  Difficulty Balance:  ${metrics.difficultyBalance.toFixed(1)}%`);
    this.logger.info(`  Content Relevance:   ${metrics.contentRelevance.toFixed(1)}%`);
  }
}
