import { Router } from 'express';
import { ConfigController } from '@/controllers/config.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Config Routes Definition
router.get('/options', ConfigController.getOptions);
router.post('/websites', requireRole('SUPER_ADMIN', 'MANAGER'), ConfigController.addWebsite);
router.delete('/websites/:id', requireRole('SUPER_ADMIN', 'MANAGER'), ConfigController.deleteWebsite);
router.post('/modules', requireRole('SUPER_ADMIN', 'MANAGER'), ConfigController.addModule);
router.delete('/modules/:id', requireRole('SUPER_ADMIN', 'MANAGER'), ConfigController.deleteModule);

export default router;
