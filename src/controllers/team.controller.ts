import { Request, Response, NextFunction } from 'express';
import { TeamService } from '@/services/team.service';

export class TeamController {
  /**
   * GET /api/v1/teams
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TeamService.getAllTeams();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teams
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, leadId } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Team name is required.' });
      }

      const result = await TeamService.createTeam({ name, description, leadId });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teams/:teamId/members
   */
  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = String(req.params.teamId);
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
      }

      const result = await TeamService.addMemberToTeam(teamId, userId);
      res.json({ success: true, message: 'User added to team successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teams/:teamId/members/:userId
   */
  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = String(req.params.teamId);
      const userId = String(req.params.userId);
      const result = await TeamService.removeMemberFromTeam(teamId, userId);
      res.json({ success: true, message: 'User removed from team.', ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teams/:teamId
   */
  static async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = String(req.params.teamId);
      const result = await TeamService.deleteTeam(teamId);
      res.json({ message: 'Team deleted successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }
}
