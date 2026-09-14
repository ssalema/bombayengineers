import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase, warnOnMissingIndexes } from './config/db.js';
import { createApp } from './app.js';
import { Setting } from './models/Setting.js';

async function bootstrap() {
  await connectDatabase();
  await Setting.getSingleton();

  const app = createApp();
  if (env.isProduction) warnOnMissingIndexes();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.stack : reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { stack: err.stack });
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.error('Failed to start server', { stack: err.stack });
  process.exit(1);
});
