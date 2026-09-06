import { Router } from 'express';
import { TeamController } from '@/controllers/team.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Team Routes Definition
router.get('/', TeamController.getAll);
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), TeamController.create);
router.post('/:teamId/members', requireRole('SUPER_ADMIN', 'MANAGER'), TeamController.addMember);
router.delete('/:teamId/members/:userId', requireRole('SUPER_ADMIN', 'MANAGER'), TeamController.removeMember);
router.delete('/:teamId', requireRole('SUPER_ADMIN', 'MANAGER'), TeamController.deleteTeam);

export default router;
