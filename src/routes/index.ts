import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import ticketRoutes from './ticket.routes';
import recommendationRoutes from './recommendation.routes';
import workLogRoutes from './workLog.routes';
import teamRoutes from './team.routes';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import configRoutes from './config.routes';

import notificationRoutes from './notification.routes';

const router = Router();

// Public Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Enterprise Ticket & Recommendation Backend API v1',
  });
});

// Public Authentication Module (Signup & Login)
router.use('/auth', authRoutes);

// Protected Modules (Requires Authenticated User Session)
router.use('/tickets', requireAuth, ticketRoutes);
router.use('/recommendations', requireAuth, recommendationRoutes);
router.use('/work-logs', requireAuth, workLogRoutes);
router.use('/teams', requireAuth, teamRoutes);
router.use('/admin', requireAuth, adminRoutes);
router.use('/config', requireAuth, configRoutes);
router.use('/notifications', requireAuth, notificationRoutes);

export default router;

