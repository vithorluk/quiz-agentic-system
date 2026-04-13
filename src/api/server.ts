import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createRouter } from './routes.js';
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

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
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
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error', err);

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        this.logger.success(`Server running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}
