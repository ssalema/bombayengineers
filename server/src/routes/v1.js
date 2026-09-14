import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import authRoutes from '../modules/auth/auth.routes.js';
import challanRoutes from '../modules/challans/challan.routes.js';
import clientRoutes from '../modules/clients/client.routes.js';
import descriptionRoutes from '../modules/descriptions/description.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import settingRoutes from '../modules/settings/setting.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  // Public liveness probe: status only, no process details.
  res.set('Cache-Control', 'no-store');
  res.status(dbUp ? 200 : 503).json({ success: dbUp, message: dbUp ? 'OK' : 'Database unavailable' });
});

router.use('/auth', authRoutes);
router.use('/settings', settingRoutes);

const protectedRoutes = [authenticate, authorize('admin')];
router.use('/dashboard', protectedRoutes, dashboardRoutes);
router.use('/challans', protectedRoutes, challanRoutes);
router.use('/clients', protectedRoutes, clientRoutes);
router.use('/descriptions', protectedRoutes, descriptionRoutes);

export default router;
