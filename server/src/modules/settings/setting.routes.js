import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { uploadLimiter } from '../../middlewares/rateLimiters.js';
import { singleImage } from '../../middlewares/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { assetParamSchema, updateSettingsSchema } from './setting.validation.js';
import * as service from './setting.service.js';

const router = Router();

// Public: branding for the login screen, favicon and page titles.
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    // Always revalidate, so a stale copy never shows old branding after a save.
    res.set('Cache-Control', 'no-cache');
    sendSuccess(res, { data: await service.getSettings() });
  }),
);

router.use(authenticate, authorize('admin'));

router.put(
  '/',
  validate({ body: updateSettingsSchema }),
  asyncHandler(async (req, res) => {
    sendSuccess(res, { message: 'Settings saved successfully', data: await service.updateSettings(req.body) });
  }),
);

router.post(
  '/:asset',
  validate({ params: assetParamSchema }),
  uploadLimiter,
  singleImage('file'),
  asyncHandler(async (req, res) => {
    const data = await service.uploadAsset(req.params.asset, req.file);
    sendSuccess(res, { message: `${req.params.asset === 'logo' ? 'Logo' : 'Favicon'} updated successfully`, data });
  }),
);

router.delete(
  '/:asset',
  validate({ params: assetParamSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.removeAsset(req.params.asset);
    sendSuccess(res, { message: `${req.params.asset === 'logo' ? 'Logo' : 'Favicon'} removed`, data });
  }),
);

export default router;
