import { z } from 'zod';

// ============================================
// Quiz Schema
// ============================================

export const QuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answers: z.array(z.string()).length(4, 'Must have exactly 4 answers'),
  correctAnswers: z.array(z.number().min(0).max(3))
    .min(1, 'Must have at least 1 correct answer')
    .refine((arr) => arr.length === new Set(arr).size, 'Correct answers must be unique'),
  isMultipleChoice: z.boolean(),
  explanation: z.string().optional(),
});

export const QuizSchema = z.object({
  questions: z.array(QuestionSchema)
    .min(5, 'Quiz must have at least 5 questions')
    .max(8, 'Quiz must have at most 8 questions'),
  topic: z.string(),
  sourceUrl: z.string().url(),
});

export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

// ============================================
// Answer & Scoring Types
// ============================================

export interface UserAnswer {
  questionIdx: number;
  userAnswers: number[]; // indices of selected answers
  correctAnswers: number[];
  points: number;
  weight: number;
}

export interface QuizSession {
  id?: number;
  url: string;
  topic: string;
  createdAt: Date;
  finalScore: number;
  answers: UserAnswer[];
}

// ============================================
// RAG Types
// ============================================

export interface Chunk {
  content: string;
  embedding?: number[];
  metadata: {
    heading?: string;
    index: number;
  };
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
}

// ============================================
// Configuration Types
// ============================================

export interface Config {
  // LLM
  xaiApiKey?: string;
  groqApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;

  // Database
  databasePath: string;

  // RAG
  chunkSize: number;
  chunkOverlap: number;
  topKChunks: number;
  maxContentLength: number;

  // Quiz
  minQuestions: number;
  maxQuestions: number;
  answersPerQuestion: number;

  // Security
  allowedDomains: string[];

  // Observability
  langchainTracing?: boolean;
  langchainApiKey?: string;
  langchainProject?: string;
}
