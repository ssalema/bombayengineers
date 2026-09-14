import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env.js';
import { httpLogStream } from './config/logger.js';
import { API_PREFIX } from './constants/index.js';
import { apiLimiter } from './middlewares/rateLimiters.js';
import { xssSanitizer } from './middlewares/sanitize.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import v1Routes from './routes/v1.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Correct client IPs behind a proxy; set TRUST_PROXY to match (see .env.example).
  app.set('trust proxy', env.trustProxy);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    }),
  );

  app.use(
    cors({
      origin(origin, cb) {
        // Allow requests without an Origin header and whitelisted origins.
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      // Cache preflights for 2h (Chromium's max).
      maxAge: 7200,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '200kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize({ replaceWith: '_' }));
  app.use(hpp());
  app.use(xssSanitizer);

  app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: httpLogStream }));

  // Friendly landing response when the server URL is opened directly.
  app.get('/', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, message: 'Server is working' });
  });

  app.use(API_PREFIX, apiLimiter, v1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
