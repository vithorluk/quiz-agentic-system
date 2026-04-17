import { Router } from 'express';
import { QuizOrchestrator } from '../application/QuizOrchestrator.js';
import { QuizUIService } from '../application/QuizUIService.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { Logger } from '../utils/logger.js';
import { slugify } from '../utils/slugify.js';
import { mean, sum, groupBy } from '../utils/metrics.js';

export function createRouter(
  orchestrator: QuizOrchestrator,
  database: DatabaseService,
  quizUIService: QuizUIService
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
          sessionId: result.sessionId,
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

  router.get('/api/quiz/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      logger.info(`Fetching quiz for session: ${sessionId}`);

      const quiz = await quizUIService.getQuiz(sessionId);

      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz not found',
          message: `No quiz found for session: ${sessionId}`
        });
      }

      return res.json({
        success: true,
        data: quiz
      });
    } catch (error) {
      logger.error('Failed to fetch quiz', error);

      return res.status(500).json({
        error: 'Failed to fetch quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/api/quiz/:sessionId/answer', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questionIndex, userAnswers } = req.body;

      if (questionIndex === undefined || !Array.isArray(userAnswers)) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'questionIndex and userAnswers are required'
        });
      }

      logger.info(`Submitting answer for session ${sessionId}, question ${questionIndex}`);

      const result = await quizUIService.submitAnswer(sessionId, questionIndex, userAnswers);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to submit answer', error);

      return res.status(500).json({
        error: 'Failed to submit answer',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/api/quiz/:sessionId/finish', async (req, res) => {
    try {
      const { sessionId } = req.params;

      logger.info(`Finishing quiz for session: ${sessionId}`);

      const report = await quizUIService.finishQuiz(sessionId);

      return res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Failed to finish quiz', error);

      return res.status(500).json({
        error: 'Failed to finish quiz',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/metrics', async (_req, res) => {
    try {
      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const sessions = await database.getSessionsSince(last24h);

      if (sessions.length === 0) {
        return res.json({
          success: true,
          metrics: {
            total_quizzes: 0,
            avg_quality_score: 0,
            pass_rate: 0,
            avg_latency: 0,
            total_cost: 0,
            cost_per_quiz: 0,
            by_model: []
          },
          timeRange: '24h'
        });
      }

      const qualityScores = sessions.filter((s: any) => s.qualityScore !== null).map((s: any) => s.qualityScore);
      const latencies = sessions.filter((s: any) => s.latency !== null).map((s: any) => s.latency);
      const costs = sessions.filter((s: any) => s.cost !== null).map((s: any) => s.cost);
      const passedSessions = sessions.filter((s: any) => s.qualityScore !== null && s.qualityScore >= 70);

      const byModelGroups = groupBy(sessions.filter((s: any) => s.model !== null), 'model');

      const metrics = {
        total_quizzes: sessions.length,
        avg_quality_score: qualityScores.length > 0 ? mean(qualityScores) : 0,
        pass_rate: qualityScores.length > 0 ? passedSessions.length / qualityScores.length : 0,
        avg_latency: latencies.length > 0 ? mean(latencies) : 0,
        total_cost: costs.length > 0 ? sum(costs) : 0,
        cost_per_quiz: costs.length > 0 ? mean(costs) : 0,
        by_model: byModelGroups.map(g => {
          const modelScores = g.values.filter((v: any) => v.qualityScore !== null).map((v: any) => v.qualityScore);
          return {
            model: g.key,
            count: g.values.length,
            avg_quality: modelScores.length > 0 ? mean(modelScores) : 0
          };
        })
      };

      return res.json({
        success: true,
        metrics,
        timeRange: '24h'
      });
    } catch (error) {
      logger.error('Failed to fetch metrics', error);

      return res.status(500).json({
        error: 'Failed to fetch metrics',
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
