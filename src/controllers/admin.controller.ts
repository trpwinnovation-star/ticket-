import { Request, Response, NextFunction } from 'express';
import { AdminService } from '@/services/admin.service';

export class AdminController {
  /**
   * GET /api/v1/admin/metrics
   */
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getPlatformMetrics();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/users - Retrieve all platform users for role governance
   */
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllUsers();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:userId/role - Update user access role level
   */
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : String(req.params.userId);
      const { role } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ success: false, error: 'User ID and target role are required.' });
      }
      if (!['GUEST_USER', 'IT_SOFTWARE', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid target role.' });
      }

      const result = await AdminService.updateUserRole(userId, role);
      res.json({ success: true, message: 'User role updated successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }
  /**
   * PATCH /api/v1/admin/users/:userId/team - Update user team assignment
   */
  static async updateUserTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : String(req.params.userId);
      const { teamId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const result = await AdminService.updateUserTeam(userId, teamId || null);
      res.json({ success: true, message: 'User team assignment updated successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }
}

