import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '@/services/notification.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async getUserNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const result = await NotificationService.getUserNotifications(req.user.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notificationId = String(req.params.id);
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const result = await NotificationService.markAsRead(notificationId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const result = await NotificationService.markAllAsRead(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
