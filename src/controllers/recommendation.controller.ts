import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '@/services/recommendation.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class RecommendationController {
  /**
   * GET /api/v1/recommendations
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RecommendationService.getAll();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recommendations
   */
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, websiteName, moduleName, screenshotUrl } = req.body;
      if (!title || !description || !websiteName || !moduleName) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, websiteName, and moduleName are required fields.',
        });
      }

      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const result = await RecommendationService.create({
        title,
        description,
        websiteName,
        moduleName,
        screenshotUrl,
        authorId: req.user.id,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recommendations/:id/upvote
   */
  static async upvote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recId = String(req.params.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required to upvote suggestions.' });
      }
      const result = await RecommendationService.toggleUpvote(recId, req.user.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/recommendations/:id/status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const recId = String(req.params.id);
      const { status, teamId, assignedToId } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status field is required.' });
      }
      const result = await RecommendationService.updateStatus(recId, status, teamId, assignedToId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recommendations/:id/assign
   */
  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const recId = String(req.params.id);
      const { teamId, assignedToId, status } = req.body;
      const result = await RecommendationService.assign(recId, teamId, assignedToId, status);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/recommendations/:id/convert-to-ticket
   */
  static async convertToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const recId = String(req.params.id);
      const { teamId, assignedToId } = req.body;
      const result = await RecommendationService.convertToTicket(recId, teamId, assignedToId);
      res.json({ success: true, message: 'Suggestion successfully converted to operational ticket.', ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to convert suggestion to ticket.' });
    }
  }
}
