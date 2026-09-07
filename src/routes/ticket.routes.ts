import { Router } from 'express';
import { TicketController } from '@/controllers/ticket.controller';
import { requireRole } from '@/middlewares/auth.middleware';

const router = Router();

// Ticket Routes Definition
router.get('/', TicketController.getAll);
router.get('/:id', TicketController.getById);
router.post('/', TicketController.create);
router.post('/:id/approve', requireRole('MANAGER', 'SUPER_ADMIN'), TicketController.approve);
router.post('/:id/reject', requireRole('MANAGER', 'SUPER_ADMIN'), TicketController.reject);
router.post('/:id/assign', requireRole('MANAGER', 'SUPER_ADMIN'), TicketController.assign);
router.patch('/:id/status', requireRole('IT_SOFTWARE', 'MANAGER', 'SUPER_ADMIN'), TicketController.updateStatus);
router.patch('/:id/priority', requireRole('MANAGER', 'SUPER_ADMIN'), TicketController.updatePriority);
router.patch('/:id', TicketController.update);
router.post('/:id/comments', TicketController.addComment);

export default router;
