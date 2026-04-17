import { DatabaseService } from '../database/DatabaseService.js';
import { ScorerAgent, ScoreReport } from '../agents/ScorerAgent.js';
import { QuizAnswer } from '../domain/entities/QuizAnswer.js';
import { Weight } from '../domain/value-objects/Weight.js';
import { Score } from '../domain/value-objects/Score.js';
import { Logger } from '../utils/logger.js';

export interface AnswerResult {
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  correctAnswers: number[];
  explanation?: string;
}

export interface QuizData {
  sessionId: string;
  topic: string;
  sourceUrl: string;
  questionCount: number;
  questions: QuestionData[];
}

export interface QuestionData {
  questionIndex: number;
  questionText: string;
  answers: string[];
  isMultipleChoice: boolean;
}

export class QuizUIService {
  private logger: Logger;

  constructor(
    private database: DatabaseService,
    private scorer: ScorerAgent
  ) {
    this.logger = new Logger('QuizUIService');
  }

  async getQuiz(sessionId: string): Promise<QuizData | null> {
    this.logger.info(`Fetching quiz for session: ${sessionId}`);

    const session = await this.database.getSession(sessionId);

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return null;
    }

    const questions = await this.database.getQuizQuestions(sessionId);

    const questionData: QuestionData[] = questions.map((q: any) => ({
      questionIndex: q.questionIndex,
      questionText: q.questionText,
      answers: JSON.parse(q.answers),
      isMultipleChoice: Boolean(q.isMultipleChoice),
    }));

    return {
      sessionId,
      topic: session.topic,
      sourceUrl: session.url,
      questionCount: session.totalQuestions,
      questions: questionData,
    };
  }

  async submitAnswer(
    sessionId: string,
    questionIndex: number,
    userAnswers: number[]
  ): Promise<AnswerResult> {
    this.logger.info(`Submitting answer for session ${sessionId}, question ${questionIndex}`);

    // Fetch the question from database
    const questions = await this.database.getQuizQuestions(sessionId);
    const question = questions.find((q: any) => q.questionIndex === questionIndex);

    if (!question) {
      throw new Error(`Question ${questionIndex} not found for session ${sessionId}`);
    }

    const correctAnswers: number[] = JSON.parse(question.correctAnswers);
    const isMultipleChoice = Boolean(question.isMultipleChoice);

    // Calculate score using the same logic as QuizRunnerAgent
    const score = this.calculateScore(userAnswers, correctAnswers, isMultipleChoice);
    const weight = Weight.forQuestion(questionIndex);

    // Save the answer to database
    await this.database.saveAnswer(
      sessionId,
      questionIndex,
      question.questionText,
      userAnswers,
      correctAnswers,
      score.getValue(),
      weight.getValue(),
      score.getValue() === 4,
      score.getValue() > 0 && score.getValue() < 4
    );

    return {
      isCorrect: score.getValue() === 4,
      isPartial: score.getValue() > 0 && score.getValue() < 4,
      score: score.getValue(),
      correctAnswers,
      explanation: question.explanation || undefined,
    };
  }

  async finishQuiz(sessionId: string): Promise<ScoreReport> {
    this.logger.info(`Finishing quiz for session: ${sessionId}`);

    // Fetch all answers for this session
    const session = await this.database.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Build QuizAnswer objects from database records
    const quizAnswers: QuizAnswer[] = session.answers.map((a: any) => {
      return new QuizAnswer(
        a.questionIndex,
        JSON.parse(a.userAnswers),
        JSON.parse(a.correctAnswers),
        Score.create(a.score),
        Weight.fromValue(a.weight)
      );
    });

    // Calculate final score using ScorerAgent
    const scoreReport = this.scorer.calculate(quizAnswers);

    // Update session with final scores
    await this.database.updateSessionScore(
      sessionId,
      scoreReport.finalScore,
      scoreReport.percentage,
      scoreReport.correctCount,
      scoreReport.wrongCount,
      scoreReport.partialCount
    );

    this.logger.success(`Quiz finished for session ${sessionId}: ${scoreReport.finalScore.toFixed(2)}/4`);

    return scoreReport;
  }

  private calculateScore(
    userAnswers: number[],
    correctAnswers: number[],
    isMultipleChoice: boolean
  ): Score {
    // Single choice question
    if (!isMultipleChoice) {
      const isCorrect = userAnswers.length === 1 &&
                       correctAnswers.length === 1 &&
                       userAnswers[0] === correctAnswers[0];
      return isCorrect ? Score.perfect() : Score.zero();
    }

    // Multiple choice question
    const correctSet = new Set(correctAnswers);
    const userSet = new Set(userAnswers);

    const allCorrect = userAnswers.every(ans => correctSet.has(ans)) &&
                       correctAnswers.every(ans => userSet.has(ans));

    if (allCorrect) {
      return Score.perfect();
    }

    const correctSelections = userAnswers.filter(ans => correctSet.has(ans)).length;

    if (correctSelections === 0) {
      return Score.zero();
    }

    return Score.partial(correctSelections, correctAnswers.length);
  }
}
