import dotenv from 'dotenv';
import { Config } from '../types/index.js';

dotenv.config();

export const config: Config = {
  // LLM API Keys
  xaiApiKey: process.env.XAI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Database
  databasePath: process.env.DATABASE_PATH || './data/quiz.db',

  // RAG Configuration
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
  topKChunks: parseInt(process.env.TOP_K_CHUNKS || '5', 10),
  maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || '12000', 10),

  // Quiz Configuration
  minQuestions: parseInt(process.env.MIN_QUESTIONS || '5', 10),
  maxQuestions: parseInt(process.env.MAX_QUESTIONS || '8', 10),
  answersPerQuestion: parseInt(process.env.ANSWERS_PER_QUESTION || '4', 10),

  // Security
  allowedDomains: (process.env.ALLOWED_DOMAINS || 'github.com,raw.githubusercontent.com,gist.github.com')
    .split(',')
    .map(d => d.trim()),

  // Observability
  langchainTracing: process.env.LANGCHAIN_TRACING_V2 === 'true',
  langchainApiKey: process.env.LANGCHAIN_API_KEY,
  langchainProject: process.env.LANGCHAIN_PROJECT || 'quiz-agent',
};

// Validation
export function validateConfig(): void {
  if (!config.xaiApiKey && !config.groqApiKey && !config.openaiApiKey && !config.anthropicApiKey) {
    throw new Error(
      'At least one LLM API key must be configured (XAI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)'
    );
  }

  if (config.minQuestions > config.maxQuestions) {
    throw new Error('MIN_QUESTIONS cannot be greater than MAX_QUESTIONS');
  }

  if (config.answersPerQuestion !== 4) {
    throw new Error('ANSWERS_PER_QUESTION must be 4 (as per requirements)');
  }

  console.log('✓ Configuration validated successfully');
  console.log(`  - Database: ${config.databasePath}`);
  console.log(`  - LLM Providers: ${[
    config.xaiApiKey ? 'xAI' : null,
    config.groqApiKey ? 'Groq' : null,
    config.openaiApiKey ? 'OpenAI' : null,
    config.anthropicApiKey ? 'Anthropic' : null,
  ].filter(Boolean).join(', ')}`);
  console.log(`  - Quiz Size: ${config.minQuestions}-${config.maxQuestions} questions`);
  console.log(`  - RAG: Top ${config.topKChunks} chunks, ${config.chunkSize} tokens per chunk`);
}
