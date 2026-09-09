import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Admin Routes Definition
router.get('/metrics', requireRole('SUPER_ADMIN', 'MANAGER'), AdminController.getMetrics);
router.get('/users', requireRole('SUPER_ADMIN', 'MANAGER', 'IT_SOFTWARE'), AdminController.getUsers);
router.patch('/users/:userId/role', requireRole('SUPER_ADMIN'), AdminController.updateUserRole);
router.patch('/users/:userId/team', requireRole('SUPER_ADMIN', 'MANAGER'), AdminController.updateUserTeam);

export default router;

