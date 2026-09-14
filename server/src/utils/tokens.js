import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../constants/index.js';

const ISSUER = 'bombay-engineers-api';
const ALGORITHM = 'HS256';

/** `sid` ties the token to its session, so revoking the session also invalidates the token. */
export function signAccessToken(user, sessionId) {
  return jwt.sign({ username: user.username, sid: sessionId }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: ISSUER,
    audience: 'access',
    algorithm: ALGORITHM,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISSUER, audience: 'access', algorithms: [ALGORITHM] });
}

export function signRefreshToken(userId, family) {
  return jwt.sign({ fam: family }, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    expiresIn: `${env.REFRESH_TOKEN_DAYS}d`,
    issuer: ISSUER,
    audience: 'refresh',
    jwtid: crypto.randomUUID(),
    algorithm: ALGORITHM,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISSUER, audience: 'refresh', algorithms: [ALGORITHM] });
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function refreshCookieOptions() {
  const sameSite = env.COOKIE_SAMESITE;
  return {
    httpOnly: true,
    secure: env.isProduction || sameSite === 'none',
    sameSite,
    path: REFRESH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res) {
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}
