import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { clearRefreshCookie, setRefreshCookie } from '../../utils/tokens.js';
import { REFRESH_COOKIE_NAME } from '../../constants/index.js';
import * as authService from './auth.service.js';

const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: 'Signed in successfully', data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.[REFRESH_COOKIE_NAME],
      requestMeta(req),
    );
    if (refreshToken) setRefreshCookie(res, refreshToken);
    res.set('Cache-Control', 'no-store');
    sendSuccess(res, { message: 'Session refreshed', data: { user, accessToken } });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Signed out successfully' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user.id, req.user.sessionId, req.body);
  sendSuccess(res, { message: 'Profile updated successfully', data });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const data = await authService.uploadAvatar(req.user.id, req.file);
  sendSuccess(res, { message: 'Profile photo updated', data });
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const data = await authService.removeAvatar(req.user.id);
  sendSuccess(res, { message: 'Profile photo removed', data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.changePassword(
    req.user.id,
    req.body,
    requestMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: 'Password changed successfully', data: { user, accessToken } });
});
