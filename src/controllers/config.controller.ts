import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@/services/config.service';

export class ConfigController {
  /**
   * GET /api/v1/config/options - Fetch predefined target websites and modules
   */
  static getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const options = ConfigService.getOptions();
      res.json({ success: true, ...options });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/config/websites - Add a new target website (Admin/Manager)
   */
  static addWebsite(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, url } = req.body;
      const website = ConfigService.addWebsite(name, url);
      res.status(201).json({ success: true, message: 'Target website added successfully.', website });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to add target website.' });
    }
  }

  /**
   * DELETE /api/v1/config/websites/:id - Delete a target website
   */
  static deleteWebsite(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      ConfigService.deleteWebsite(id);
      res.json({ success: true, message: 'Target website deleted.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/config/modules - Add a new target module (Admin/Manager)
   */
  static addModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, category } = req.body;
      const moduleItem = ConfigService.addModule(name, category);
      res.status(201).json({ success: true, message: 'Target module added successfully.', module: moduleItem });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to add target module.' });
    }
  }

  /**
   * DELETE /api/v1/config/modules/:id - Delete a target module
   */
  static deleteModule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      ConfigService.deleteModule(id);
      res.json({ success: true, message: 'Target module deleted.' });
    } catch (err) {
      next(err);
    }
  }
}
