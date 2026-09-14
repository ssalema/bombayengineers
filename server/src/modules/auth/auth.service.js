import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { assertStorageEnabled, destroyImage, uploadImage } from '../../utils/cloudinaryAssets.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens.js';
import { invalidateAuthCache } from '../../middlewares/auth.js';

/** A refresh token used again within this window (parallel tabs) is not treated as theft. */
const ROTATION_GRACE_MS = 30 * 1000;

// Pre-computed hash to keep login timing constant when the user does not exist.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), env.BCRYPT_SALT_ROUNDS);

function saveSession(user, meta, family, refreshToken) {
  return RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
    userAgent: meta.userAgent?.slice(0, 300),
    ip: meta.ip?.slice(0, 60),
  });
}

async function createSession(user, meta, family = crypto.randomUUID()) {
  const refreshToken = signRefreshToken(user._id, family);
  await saveSession(user, meta, family, refreshToken);
  return { refreshToken, family };
}

export async function login({ username, password }, meta) {
  const user = await User.findOne({ username }).select('+password');
  const valid = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !valid) {
    // Never log the submitted username: users often type their password into that field.
    logger.warn('Failed login attempt', { knownAccount: Boolean(user), ip: meta.ip });
    throw ApiError.unauthorized('Invalid username or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });

  const { refreshToken, family } = await createSession(user, meta);
  return { user: user.toJSON(), accessToken: signAccessToken(user, family), refreshToken };
}

const sameClient = (stored, meta) => (stored.userAgent ?? '') === (meta.userAgent?.slice(0, 300) ?? '');

export async function refresh(rawToken, meta) {
  if (!rawToken) throw ApiError.unauthorized('No active session');

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized('Session expired. Please sign in again');
  }

  const [stored, user] = await Promise.all([
    RefreshToken.findOne({ tokenHash: hashToken(rawToken) }),
    User.findById(payload.sub),
  ]);
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Session expired. Please sign in again');
  }
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  if (stored.revokedAt) {
    // Parallel tabs share one browser, so a replay from a different client is never "concurrent".
    const withinGrace =
      stored.replacedBy && Date.now() - stored.revokedAt.getTime() < ROTATION_GRACE_MS && sameClient(stored, meta);
    const familyActive = withinGrace && (await RefreshToken.exists({ family: stored.family, revokedAt: null }));
    if (familyActive) {
      // Another tab refreshed first, or the new cookie never reached the browser.
      // Issue a fresh token in the same family instead of treating it as theft.
      const refreshToken = signRefreshToken(user._id, stored.family);
      await saveSession(user, meta, stored.family, refreshToken);
      return { user: user.toJSON(), accessToken: signAccessToken(user, stored.family), refreshToken };
    }
    // Reuse of a rotated token => likely stolen. Kill the whole session family.
    await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
    invalidateAuthCache();
    logger.warn('Refresh token reuse detected', { userId: String(user._id), ip: meta.ip });
    throw ApiError.unauthorized('Session is no longer valid. Please sign in again');
  }

  // Sign first so both writes (new session, revoke old) can run together.
  const family = stored.family;
  const refreshToken = signRefreshToken(user._id, family);
  stored.revokedAt = new Date();
  stored.replacedBy = hashToken(refreshToken);
  await Promise.all([saveSession(user, meta, family, refreshToken), stored.save()]);

  return { user: user.toJSON(), accessToken: signAccessToken(user, stored.family), refreshToken };
}

/** Ends the whole session family, which also invalidates access tokens issued to it. */
export async function logout(rawToken) {
  if (!rawToken) return;
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) }).select('family').lean();
  if (!stored) return;
  await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
  invalidateAuthCache();
}

export async function updateProfile(userId, sessionId, { username }) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const taken = await User.exists({ username, _id: { $ne: user._id } });
  if (taken) throw ApiError.conflict('Username is already taken', [{ field: 'username', message: 'Username is already taken' }]);

  user.username = username;
  await user.save();
  invalidateAuthCache();
  return { user: user.toJSON(), accessToken: signAccessToken(user, sessionId) };
}

export async function uploadAvatar(userId, file) {
  assertStorageEnabled();

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const previousId = user.avatar?.publicId;

  const result = await uploadImage(file.buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/avatars`,
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'webp' }],
  });

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();
  await destroyImage(previousId);
  return { user: user.toJSON() };
}

export async function removeAvatar(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const previousId = user.avatar?.publicId;

  user.avatar = { url: '', publicId: '' };
  await user.save();
  await destroyImage(previousId);
  return { user: user.toJSON() };
}

export async function changePassword(userId, { currentPassword, newPassword }, meta) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw ApiError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.password = newPassword;
  await user.save();

  // Sign out every session, then open a fresh one for this device.
  await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  invalidateAuthCache();
  const { refreshToken, family } = await createSession(user, meta);

  return { user: user.toJSON(), accessToken: signAccessToken(user, family), refreshToken };
}

/** Creates the single admin account when no user exists. Returns true if one was created. */
export async function ensureAdminUser({ username, password }) {
  const count = await User.estimatedDocumentCount();
  if (count > 0) return false;
  await User.create({ username: username.toLowerCase(), password });
  return true;
}
