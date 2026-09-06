import { Router } from 'express';
import { RecommendationController } from '@/controllers/recommendation.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Recommendation Routes Definition
router.get('/', RecommendationController.getAll);
router.post('/', RecommendationController.create);
router.post('/:id/upvote', RecommendationController.upvote);
router.patch('/:id/status', requireRole('MANAGER', 'SUPER_ADMIN'), RecommendationController.updateStatus);
router.post('/:id/assign', requireRole('MANAGER', 'SUPER_ADMIN'), RecommendationController.assign);
router.post('/:id/convert-to-ticket', requireRole('MANAGER', 'SUPER_ADMIN'), RecommendationController.convertToTicket);

export default router;
