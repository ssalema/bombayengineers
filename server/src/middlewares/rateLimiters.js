import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

const baseOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res, _next, options) =>
    res.status(options.statusCode).json({ success: false, message: options.message, errors: [] }),
};

export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: 'Too many requests, please slow down.',
});

export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/**
 * Per-account login throttle that holds even when IPs rotate.
 * Keyed by a hash so raw usernames are never stored.
 */
export const accountLoginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `account:${crypto.createHash('sha256').update(String(req.body?.username ?? '').trim().toLowerCase()).digest('hex')}`,
  message: 'Too many failed sign-in attempts for this account. Please try again later.',
});

export const sensitiveLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many attempts. Please try again later.',
});

/** Cookie-based session endpoints (refresh / logout). */
export const sessionLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests, please slow down.',
});

/** Image uploads are proxied to Cloudinary, so cap them per signed-in user to protect the quota. */
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `upload:${req.user.id}`,
  message: 'Too many uploads. Please try again later.',
});
