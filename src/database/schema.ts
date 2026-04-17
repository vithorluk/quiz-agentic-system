import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const quizSessions = sqliteTable('quiz_sessions', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  topic: text('topic').notNull(),
  topicSlug: text('topic_slug').notNull(),
  finalScore: real('final_score').notNull(),
  percentage: real('percentage').notNull(),
  correctCount: integer('correct_count').notNull(),
  wrongCount: integer('wrong_count').notNull(),
  partialCount: integer('partial_count').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  cost: real('cost'),
  latency: integer('latency'),
  model: text('model'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  qualityScore: real('quality_score'),
  promptVersion: text('prompt_version'),
});

export const quizAnswers = sqliteTable('quiz_answers', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => quizSessions.id, { onDelete: 'cascade' }),
  questionIndex: integer('question_index').notNull(),
  questionText: text('question_text').notNull(),
  userAnswers: text('user_answers').notNull(),
  correctAnswers: text('correct_answers').notNull(),
  score: real('score').notNull(),
  weight: real('weight').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  isPartial: integer('is_partial', { mode: 'boolean' }).notNull(),
});

export const quizQuestions = sqliteTable('quiz_questions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => quizSessions.id, { onDelete: 'cascade' }),
  questionIndex: integer('question_index').notNull(),
  questionText: text('question_text').notNull(),
  answers: text('answers').notNull(), // JSON array
  correctAnswers: text('correct_answers').notNull(), // JSON array
  isMultipleChoice: integer('is_multiple_choice', { mode: 'boolean' }).notNull(),
  explanation: text('explanation'),
});
