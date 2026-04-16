import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createRouter } from './routes.js';
import { swaggerSpec } from './swagger.js';
import { QuizOrchestrator } from '../application/QuizOrchestrator.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { Logger } from '../utils/logger.js';

export interface ServerConfig {
  port: number;
  corsOrigin?: string;
}

export class Server {
  private app: Express;
  private logger: Logger;

  constructor(
    private config: ServerConfig,
    private orchestrator: QuizOrchestrator,
    private database: DatabaseService
  ) {
    this.app = express();
    this.logger = new Logger('Server');
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: this.config.corsOrigin || '*',
      credentials: true
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupSwagger(): void {
    this.app.use('/docs', swaggerUi.serve);
    this.app.get('/docs', swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Quiz Agent System API Documentation',
    }));

    this.app.get('/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    this.logger.info('Swagger documentation available at /docs');
  }

  private setupRoutes(): void {
    const router = createRouter(this.orchestrator, this.database);
    this.app.use(router);

    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled error', _err);

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : _err.message
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, '0.0.0.0', () => {
        this.logger.success(`Server running on http://0.0.0.0:${this.config.port}`);
        resolve();
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}
