import { Router } from 'express';
import { WorkLogController } from '@/controllers/workLog.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Work Log Routes Definition
router.get('/', requireRole('MANAGER', 'SUPER_ADMIN', 'IT_SOFTWARE'), WorkLogController.getAll);
router.post('/', requireRole('IT_SOFTWARE', 'SUPER_ADMIN', 'MANAGER'), WorkLogController.logHours);

export default router;
