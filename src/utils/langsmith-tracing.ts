import { Client } from 'langsmith';
import { Logger } from './logger.js';

let langSmithClient: Client | null = null;

/**
 * Initialize LangSmith client for tracing.
 *
 * LangSmith automatically reads from environment variables:
 * - LANGCHAIN_API_KEY (or LANGSMITH_API_KEY)
 * - LANGCHAIN_TRACING_V2
 * - LANGCHAIN_PROJECT (or LANGSMITH_PROJECT)
 * - LANGCHAIN_ENDPOINT (optional, defaults to https://api.smith.langchain.com)
 *
 * @param apiKey - Optional API key to override environment variable
 */
export function initLangSmith(apiKey?: string, projectName?: string) {
  const logger = new Logger('LangSmith');

  try {
    const config: any = {};

    if (apiKey) {
      config.apiKey = apiKey;
    }

    // Set project name from parameter or environment variable
    const project = projectName || process.env.LANGCHAIN_PROJECT || process.env.LANGSMITH_PROJECT;
    if (project) {
      config.projectName = project;
      logger.info(`LangSmith project: ${project}`);
    }

    langSmithClient = new Client(config);
    logger.info('LangSmith client initialized successfully');
    logger.debug(`API Key provided: ${apiKey ? 'Yes (via config)' : 'No (will use env vars)'}`);
  } catch (error) {
    logger.warn(`Failed to initialize LangSmith client: ${error}`);
  }
}

export async function traceOperation<T>(
  operationName: string,
  metadata: Record<string, any>,
  operation: () => Promise<T>,
  extractOutput?: (result: T) => any
): Promise<T> {
  const logger = new Logger('LangSmithTracer');

  if (!langSmithClient) {
    logger.debug(`Tracing skipped for ${operationName}: LangSmith client not initialized`);
    return operation();
  }

  const startTime = Date.now();
  const projectName = process.env.LANGCHAIN_PROJECT || process.env.LANGSMITH_PROJECT || 'default';

  try {
    logger.info(`📊 Tracing: ${operationName}`);

    const result = await operation();
    const duration = Date.now() - startTime;

    try {
      const outputs = extractOutput ? extractOutput(result) : { success: true, result };

      await langSmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        project_name: projectName,
        inputs: metadata,
        outputs,
        start_time: startTime,
        end_time: Date.now(),
      });
      logger.success(`✓ Trace recorded: ${operationName} (${duration}ms) [Project: ${projectName}]`);
    } catch (traceError) {
      logger.error(`Failed to record trace for ${operationName}:`, traceError);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    try {
      await langSmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        project_name: projectName,
        inputs: metadata,
        error: error instanceof Error ? error.message : String(error),
        start_time: startTime,
        end_time: Date.now(),
      });
      logger.warn(`Trace recorded with error: ${operationName} (${duration}ms) [Project: ${projectName}]`);
    } catch (traceError) {
      logger.error(`Failed to record error trace for ${operationName}:`, traceError);
    }

    throw error;
  }
}
