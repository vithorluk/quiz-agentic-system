import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { quizSessions, quizAnswers } from './schema.js';
import { QuizSession } from '../domain/entities/QuizSession.js';
import { Quiz } from '../domain/entities/Quiz.js';
import { ScoreReport } from '../agents/ScorerAgent.js';
import { Logger } from '../utils/logger.js';
import { slugify } from '../utils/slugify.js';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseService {
  private db: BetterSQLite3Database;
  private sqlite: Database.Database;
  private logger: Logger;

  constructor(databasePath: string) {
    this.logger = new Logger('Database');

    const dir = path.dirname(databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.sqlite = new Database(databasePath);
    this.db = drizzle(this.sqlite);

    this.logger.info(`Database initialized: ${databasePath}`);
  }

  async initialize(): Promise<void> {
    this.logger.info('Running migrations...');

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        topic TEXT NOT NULL,
        topic_slug TEXT NOT NULL,
        final_score REAL NOT NULL,
        percentage REAL NOT NULL,
        correct_count INTEGER NOT NULL,
        wrong_count INTEGER NOT NULL,
        partial_count INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        question_index INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        user_answers TEXT NOT NULL,
        correct_answers TEXT NOT NULL,
        score REAL NOT NULL,
        weight REAL NOT NULL,
        is_correct INTEGER NOT NULL,
        is_partial INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE
      )
    `);

    this.logger.success('Database tables created');
  }

  async saveGeneratedQuiz(quiz: Quiz): Promise<string> {
    const sessionId = uuidv4();

    this.logger.info(`Saving generated quiz: ${sessionId}`);

    // Insert session with default scores (0 - quiz not yet answered)
    const sessionStmt = this.sqlite.prepare(`
      INSERT INTO quiz_sessions (
        id, url, topic, topic_slug, final_score, percentage, 
        correct_count, wrong_count, partial_count, 
        total_questions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sessionStmt.run(
      sessionId,
      quiz.sourceUrl.getValue(),
      quiz.topic,
      slugify(quiz.topic),
      0, // final_score
      0, // percentage
      0, // correct_count
      0, // wrong_count
      0, // partial_count
      quiz.getQuestionCount(),
      Date.now()
    );

    this.logger.success(`Generated quiz saved: ${sessionId}`);

    return sessionId;
  }

  async saveSession(
    quiz: Quiz,
    quizSession: QuizSession,
    scoreReport: ScoreReport
  ): Promise<string> {
    const sessionId = uuidv4();

    this.logger.info(`Saving quiz session: ${sessionId}`);

    // Insert session using prepared statement
    const sessionStmt = this.sqlite.prepare(`
      INSERT INTO quiz_sessions (
        id, url, topic, topic_slug, final_score, percentage, 
        correct_count, wrong_count, partial_count, 
        total_questions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sessionStmt.run(
      sessionId,
      quiz.sourceUrl.getValue(),
      quiz.topic,
      slugify(quiz.topic),
      scoreReport.finalScore,
      scoreReport.percentage,
      scoreReport.correctCount,
      scoreReport.wrongCount,
      scoreReport.partialCount,
      scoreReport.totalQuestions,
      quizSession.createdAt
    );

    // Insert answers
    const answerStmt = this.sqlite.prepare(`
      INSERT INTO quiz_answers (
        id, session_id, question_index, question_text, 
        user_answers, correct_answers, score, weight, 
        is_correct, is_partial
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < quizSession.answers.length; i++) {
      const answer = quizSession.answers[i];
      const question = quiz.getQuestion(i);

      answerStmt.run(
        uuidv4(),
        sessionId,
        answer.questionIndex,
        question.text,
        JSON.stringify(answer.userAnswers),
        JSON.stringify(answer.correctAnswers),
        answer.score.getValue(),
        answer.weight.getValue(),
        answer.isCorrect() ? 1 : 0,
        answer.isPartial() ? 1 : 0
      );
    }

    this.logger.success(`Session saved: ${sessionId}`);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<any> {
    const session = this.db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .get();

    if (!session) {
      return null;
    }

    const answers = this.db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.sessionId, sessionId))
      .all();

    return {
      ...session,
      answers,
    };
  }

  async getAllSessions(): Promise<any[]> {
    return this.db.select().from(quizSessions).all();
  }

  async getSessionsByTopic(topicSlug: string): Promise<any[]> {
    return this.db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.topicSlug, topicSlug))
      .all();
  }
}
