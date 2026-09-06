import { Router } from 'express';
import { NotificationController } from '@/controllers/notification.controller';

const router = Router();

router.get('/', NotificationController.getUserNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
