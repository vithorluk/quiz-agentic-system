import { Client } from 'langsmith';
import { Logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface TraceContext {
  runId: string;
  parentRunId?: string;
  sessionId?: string;
}

export interface TraceMetadata {
  component: string;
  operation: string;
  metadata?: Record<string, any>;
}

export class LangSmithTracer {
  private client: Client | null = null;
  private logger: Logger;
  private enabled: boolean;

  constructor(
    private apiKey?: string,
    private projectName: string = 'quiz-agent'
  ) {
    this.logger = new Logger('LangSmithTracer');
    this.enabled = !!apiKey;

    if (this.enabled && this.apiKey) {
      this.client = new Client({
        apiKey: this.apiKey,
      });
      this.logger.info(`LangSmith tracing enabled for project: ${this.projectName}`);
    } else {
      this.logger.warn('LangSmith tracing disabled (no API key provided)');
    }
  }

  async traceOperation<T>(
    metadata: TraceMetadata,
    operation: () => Promise<T>,
    context?: TraceContext
  ): Promise<T> {
    if (!this.enabled || !this.client) {
      return operation();
    }

    const runId = context?.runId || uuidv4();
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting trace: ${metadata.component}.${metadata.operation}`);

      const result = await operation();

      const endTime = Date.now();

      await this.client.createRun({
        id: runId,
        name: `${metadata.component}.${metadata.operation}`,
        run_type: 'chain',
        inputs: metadata.metadata || {},
        outputs: { success: true },
        start_time: startTime,
        end_time: endTime,
        parent_run_id: context?.parentRunId,
        session_name: context?.sessionId,
        project_name: this.projectName,
      });

      return result;
    } catch (error) {
      const endTime = Date.now();

      await this.client.createRun({
        id: runId,
        name: `${metadata.component}.${metadata.operation}`,
        run_type: 'chain',
        inputs: metadata.metadata || {},
        error: error instanceof Error ? error.message : String(error),
        start_time: startTime,
        end_time: endTime,
        parent_run_id: context?.parentRunId,
        session_name: context?.sessionId,
        project_name: this.projectName,
      });

      throw error;
    }
  }

  createContext(sessionId?: string, parentRunId?: string): TraceContext {
    return {
      runId: uuidv4(),
      sessionId,
      parentRunId,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
