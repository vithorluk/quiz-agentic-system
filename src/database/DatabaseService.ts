import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { v4 as uuidv4 } from 'uuid';
import { quizSessions, quizAnswers } from './schema.js';
import { QuizSession } from '../domain/entities/QuizSession.js';
import { Quiz } from '../domain/entities/Quiz.js';
import { ScoreReport } from '../agents/ScorerAgent.js';
import { Logger } from '../utils/logger.js';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseService {
  private db: BetterSQLite3Database;
  private logger: Logger;

  constructor(databasePath: string) {
    this.logger = new Logger('Database');

    const dir = path.dirname(databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(databasePath);
    this.db = drizzle(sqlite);

    this.logger.info(`Database initialized: ${databasePath}`);
  }

  async initialize(): Promise<void> {
    this.logger.info('Running migrations...');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        topic TEXT NOT NULL,
        final_score REAL NOT NULL,
        percentage REAL NOT NULL,
        correct_count INTEGER NOT NULL,
        wrong_count INTEGER NOT NULL,
        partial_count INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
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

  async saveSession(
    quiz: Quiz,
    quizSession: QuizSession,
    scoreReport: ScoreReport
  ): Promise<string> {
    const sessionId = uuidv4();

    this.logger.info(`Saving quiz session: ${sessionId}`);

    this.db.insert(quizSessions).values({
      id: sessionId,
      url: quiz.sourceUrl.getValue(),
      topic: quiz.topic,
      finalScore: scoreReport.finalScore,
      percentage: scoreReport.percentage,
      correctCount: scoreReport.correctCount,
      wrongCount: scoreReport.wrongCount,
      partialCount: scoreReport.partialCount,
      totalQuestions: scoreReport.totalQuestions,
      createdAt: quizSession.createdAt,
    }).run();

    for (let i = 0; i < quizSession.answers.length; i++) {
      const answer = quizSession.answers[i];
      const question = quiz.getQuestion(i);

      this.db.insert(quizAnswers).values({
        id: uuidv4(),
        sessionId,
        questionIndex: answer.questionIndex,
        questionText: question.text,
        userAnswers: JSON.stringify(answer.userAnswers),
        correctAnswers: JSON.stringify(answer.correctAnswers),
        score: answer.score.getValue(),
        weight: answer.weight.getValue(),
        isCorrect: answer.isCorrect(),
        isPartial: answer.isPartial(),
      }).run();
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

  async getSessionsByTopic(topic: string): Promise<any[]> {
    return this.db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.topic, topic))
      .all();
  }
}
