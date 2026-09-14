import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  accountLoginLimiter,
  loginLimiter,
  sensitiveLimiter,
  sessionLimiter,
  uploadLimiter,
} from '../../middlewares/rateLimiters.js';
import { requireTrustedOrigin } from '../../middlewares/originCheck.js';
import { singleImage } from '../../middlewares/upload.js';
import { changePasswordSchema, loginSchema, updateProfileSchema } from './auth.validation.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post(
  '/login',
  requireTrustedOrigin,
  loginLimiter,
  accountLoginLimiter,
  validate({ body: loginSchema }),
  controller.login,
);
router.post('/refresh', requireTrustedOrigin, sessionLimiter, controller.refresh);
router.post('/logout', requireTrustedOrigin, sessionLimiter, controller.logout);

router.patch('/profile', authenticate, validate({ body: updateProfileSchema }), controller.updateProfile);
router.post('/avatar', authenticate, uploadLimiter, singleImage('file'), controller.uploadAvatar);
router.delete('/avatar', authenticate, controller.removeAvatar);
router.patch(
  '/change-password',
  authenticate,
  sensitiveLimiter,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);

export default router;
