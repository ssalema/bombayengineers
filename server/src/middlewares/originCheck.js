import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * CSRF guard for cookie-authenticated endpoints (login / refresh / logout).
 * Needed when COOKIE_SAMESITE=none. Requests without an Origin header are allowed.
 */
export function requireTrustedOrigin(req, _res, next) {
  const origin = req.get('origin');
  if (!origin || env.clientOrigins.includes(origin)) return next();

  try {
    if (new URL(origin).host === req.get('host')) return next();
  } catch {
    // Malformed or opaque ("null") origin: reject below.
  }
  return next(ApiError.forbidden('Request origin is not allowed'));
}
