import { Client } from 'langsmith';
import { Logger } from './logger.js';

let langSmithClient: Client | null = null;

export function initLangSmith(apiKey?: string) {
  if (!apiKey) {
    return;
  }

  langSmithClient = new Client({
    apiKey
  });
}

export async function traceOperation<T>(
  operationName: string,
  metadata: Record<string, any>,
  operation: () => Promise<T>
): Promise<T> {
  if (!langSmithClient) {
    return operation();
  }

  const startTime = Date.now();
  const logger = new Logger('LangSmithTracer');

  try {
    logger.debug(`Tracing: ${operationName}`);

    const result = await operation();

    try {
      await langSmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        inputs: metadata,
        outputs: { success: true },
        start_time: startTime,
        end_time: Date.now(),
      });
    } catch (traceError) {
      logger.warn(`Failed to record trace: ${traceError}`);
    }

    return result;
  } catch (error) {
    try {
      await langSmithClient.createRun({
        name: operationName,
        run_type: 'llm',
        inputs: metadata,
        error: error instanceof Error ? error.message : String(error),
        start_time: startTime,
        end_time: Date.now(),
      });
    } catch (traceError) {
      logger.warn(`Failed to record error trace: ${traceError}`);
    }

    throw error;
  }
}
