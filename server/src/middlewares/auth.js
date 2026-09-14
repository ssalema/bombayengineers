import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Short-lived cache of user + session checks to save DB lookups per request.
 * Cleared on credential changes and revocation; the TTL covers other instances.
 */
const AUTH_CACHE_TTL_MS = 30 * 1000;
const authCache = new Map();

async function cachedLookup(key, load) {
  const hit = authCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await load();
  if (value) authCache.set(key, { value, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
  else authCache.delete(key);
  return value;
}

/** Call after revoking sessions or changing a user's username or password. */
export function invalidateAuthCache() {
  authCache.clear();
}

const loadAuthUser = (id) =>
  cachedLookup(`user:${id}`, () => User.findById(id).select('username passwordChangedAt').lean());

/** An access token is only valid while its session (refresh-token family) has an unrevoked token. */
const isSessionActive = (sessionId) =>
  cachedLookup(`session:${sessionId}`, async () =>
    Boolean(await RefreshToken.exists({ family: sessionId, revokedAt: null, expiresAt: { $gt: new Date() } })),
  );

/** Requires a valid Bearer token. Tokens issued before the last password change are rejected. */
export async function authenticate(req, _res, next) {
  try {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized();

    const payload = verifyAccessToken(token);
    if (!payload.sid) throw ApiError.unauthorized('Session is no longer valid. Please sign in again');

    const [user, sessionActive] = await Promise.all([loadAuthUser(payload.sub), isSessionActive(payload.sid)]);
    if (!user) throw ApiError.unauthorized('Account no longer exists');
    if (!sessionActive) throw ApiError.unauthorized('Session is no longer valid. Please sign in again');

    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
      throw ApiError.unauthorized('Password was changed. Please sign in again');
    }

    req.user = { id: String(user._id), username: user.username, role: 'admin', sessionId: payload.sid };
    next();
  } catch (err) {
    next(err);
  }
}

/** Role-based authorization guard. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (roles.length && !roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};
