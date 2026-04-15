import { Router } from 'express';
import { QuizOrchestrator } from '../application/QuizOrchestrator.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { Logger } from '../utils/logger.js';
import { slugify } from '../utils/slugify.js';

export function createRouter(
  orchestrator: QuizOrchestrator,
  database: DatabaseService
): Router {
  const router = Router();
  const logger = new Logger('API');

  router.post('/api/quiz/generate', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'URL is required',
          message: 'Please provide a URL in the request body'
        });
      }

      logger.info(`Generating quiz for URL: ${url}`);

      const result = await orchestrator.generateQuiz(url);

      return res.json({
        success: true,
        data: {
          quiz: {
            topic: result.quiz.topic,
            sourceUrl: result.quiz.sourceUrl.getValue(),
            questionCount: result.quiz.getQuestionCount(),
            questions: result.quiz.questions.map(q => ({
              question: q.text,
              answers: q.answers,
              isMultipleChoice: q.isMultipleChoice,
            }))
          }
        }
      });
    } catch (error) {
      logger.error('Quiz generation failed', error);

      return res.status(500).json({
        error: 'Quiz generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/sessions', async (_req, res) => {
    try {
      const sessions = await database.getAllSessions();

      return res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      logger.error('Failed to fetch sessions', error);

      return res.status(500).json({
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const session = await database.getSession(id);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: `No session found with ID: ${id}`
        });
      }

      return res.json({
        success: true,
        data: { session }
      });
    } catch (error) {
      logger.error('Failed to fetch session', error);

      return res.status(500).json({
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/sessions/topic/:topic', async (req, res) => {
    try {
      const { topic } = req.params;
      const topicSlug = slugify(topic);
      const sessions = await database.getSessionsByTopic(topicSlug);

      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      logger.error('Failed to fetch sessions by topic', error);

      res.status(500).json({
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/health', (_req, res) => {
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  return router;
}
