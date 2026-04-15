import { validateConfig, config } from './config/index.js';
import { Logger } from './utils/logger.js';
import { initLangSmith } from './utils/langsmith-tracing.js';
import { ServiceFactory } from './application/ServiceFactory.js';
import { Server } from './api/server.js';

const logger = new Logger('Main');

async function startCLIMode(url: string) {
  const orchestrator = ServiceFactory.createOrchestrator();
  const database = ServiceFactory.createDatabase();

  await database.initialize();

  await orchestrator.runFullPipeline(url);
}

async function startServerMode() {
  const orchestrator = ServiceFactory.createOrchestrator();
  const database = ServiceFactory.createDatabase();

  await database.initialize();

  const server = new Server(
    { port: 3000 },
    orchestrator,
    database
  );

  await server.start();

  logger.info('API Endpoints:');
  logger.info('  POST /api/quiz/generate - Generate quiz from URL');
  logger.info('  GET  /api/sessions - Get all quiz sessions');
  logger.info('  GET  /api/sessions/:id - Get specific session');
  logger.info('  GET  /api/sessions/topic/:topic - Get sessions by topic');
  logger.info('  GET  /health - Health check');
  logger.info('');
  logger.info('Documentation:');
  logger.info('  Swagger UI: http://localhost:3000/docs');
  logger.info('  OpenAPI JSON: http://localhost:3000/docs.json');
}

async function main() {
  try {
    logger.info('Starting Quiz Agent System...');

    validateConfig();

    // Initialize LangSmith tracing if configured
    if (config.langchainTracing && config.langchainApiKey) {
      initLangSmith(config.langchainApiKey);
      logger.info('✓ LangSmith tracing enabled');
    }

    const args = process.argv.slice(2);
    const urlArg = args.find(arg => arg.startsWith('--url='));
    const serverArg = args.includes('--server');

    if (serverArg) {
      logger.info('Starting in SERVER mode...');
      await startServerMode();
      return;
    }

    if (!urlArg) {
      logger.info('📋 Usage:');
      logger.info('  CLI Mode:    npm start -- --url="<markdown-url>"');
      logger.info('  Server Mode: npm start -- --server');
      logger.info('');
      logger.info('Example: npm start -- --url="https://raw.githubusercontent.com/pipecat-ai/pipecat/main/README.md"');
      process.exit(0);
    }

    const url = urlArg.split('=')[1]?.replace(/['"]/g, '');

    if (!url) {
      logger.error('Invalid URL format. Use --url="<valid-url>"');
      process.exit(1);
    }

    logger.info('Starting in CLI mode...');
    await startCLIMode(url);

  } catch (error) {
    logger.error('Fatal error in main process', error);
    process.exit(1);
  }
}

main();
