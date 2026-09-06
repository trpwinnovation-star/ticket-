import { Request, Response, NextFunction } from 'express';
import { TicketService } from '@/services/ticket.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class TicketController {
  /**
   * GET /api/v1/tickets
   */
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.getAllTickets(req.user!);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tickets/:id
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const result = await TicketService.getTicketById(ticketId, req.user!);
      if (!result.ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets
   */
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, websiteName, module, category, priority, attachments } = req.body;
      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Title and description are required fields.' });
      }

      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

      const result = await TicketService.createTicket({
        title,
        description,
        websiteName,
        module,
        category,
        priority,
        createdById: req.user.id,
        attachments,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets/:id/approve
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const { assignedToId, teamId, priority, targetClosureDate } = req.body;
      const result = await TicketService.approveTicket({
        ticketId,
        assignedToId,
        teamId,
        priority,
        targetClosureDate,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets/:id/reject
   */
  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
      }
      const result = await TicketService.rejectTicket({
        ticketId,
        rejectionReason,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/tickets/:id/status
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status field is required.' });
      }
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const result = await TicketService.updateStatus(ticketId, status, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets/:id/assign
   */
  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const { assignedToId, teamId, targetClosureDate } = req.body;
      const result = await TicketService.assignTicket(ticketId, assignedToId, teamId, targetClosureDate);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tickets/:id/comments
   */
  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticketId = String(req.params.id);
      const { content, isInternal } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
      }
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      const result = await TicketService.addComment(ticketId, req.user.id, content, Boolean(isInternal), req.user);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
