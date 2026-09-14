import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

export async function connectDatabase() {
  mongoose.connection.on('connected', () => console.log('✅ MongoDB Connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));

  await mongoose.connect(env.MONGODB_URI, {
    // Production indexes are built with `npm run db:indexes`, not on boot.
    autoIndex: !env.isProduction,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
}

/** Logs a warning for every schema index missing from the database (production safety net). */
export async function warnOnMissingIndexes() {
  for (const model of Object.values(mongoose.models)) {
    try {
      const { toCreate } = await model.diffIndexes();
      if (toCreate.length) {
        logger.warn(`Missing indexes on ${model.collection.name}. Run "npm run db:indexes".`, { toCreate });
      }
    } catch (err) {
      logger.warn(`Could not check indexes on ${model.collection.name}`, { error: err.message });
    }
  }
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
