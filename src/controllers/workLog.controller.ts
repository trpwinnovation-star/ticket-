import { Request, Response, NextFunction } from 'express';
import { WorkLogService } from '@/services/workLog.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class WorkLogController {
  /**
   * GET /api/v1/work-logs
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WorkLogService.getAllWorkLogs();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/work-logs
   */
  static async logHours(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { ticketId, hoursSpent, description, workDate, environment, branchName } = req.body;
      if (!ticketId || hoursSpent === undefined || !description) {
        return res.status(400).json({
          success: false,
          message: 'ticketId, hoursSpent, and description are required fields.',
        });
      }

      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const result = await WorkLogService.logHours({
        ticketId,
        userId: req.user.id,
        hoursSpent: Number(hoursSpent),
        description,
        workDate,
        environment,
        branchName,
      });

      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
