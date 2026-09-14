import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}: ${stack || message}${extra}`;
});

const transports = [
  new winston.transports.Console({
    format: env.isProduction
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat),
  }),
];

if (env.isProduction) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5_242_880, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5_242_880, maxFiles: 5 }),
  );
}

export const logger = winston.createLogger({
  level: env.isProduction ? 'http' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  silent: env.NODE_ENV === 'test',
});

/** Stream used by morgan so HTTP logs flow through winston. */
export const httpLogStream = {
  write: (message) => logger.http(message.trim()),
};
