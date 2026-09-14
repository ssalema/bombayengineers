import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { currentYear } from '../../utils/timezone.js';
import * as service from './dashboard.service.js';

const router = Router();

const monthlyQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2200).optional(),
});

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'private, no-cache');
    sendSuccess(res, { data: await service.getOverview() });
  }),
);

router.get(
  '/monthly',
  validate({ query: monthlyQuery }),
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'private, no-cache');
    sendSuccess(res, { data: await service.getMonthly(req.validatedQuery.year ?? currentYear()) });
  }),
);

export default router;
