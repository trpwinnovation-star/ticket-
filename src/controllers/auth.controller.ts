import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

function setAuthCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `tm_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`);
}

export class AuthController {
  /**
   * POST /api/v1/auth/signup - Register new user
   */
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, jobTitle } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required fields.',
        });
      }

      const result = await AuthService.signup({ name, email, password, role, jobTitle });
      setAuthCookie(res, result.token);
      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Signup failed.',
      });
    }
  }

  /**
   * POST /api/v1/auth/login - Log into existing account
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required.',
        });
      }

      const result = await AuthService.login({ email, password });
      setAuthCookie(res, result.token);
      res.json({
        success: true,
        message: 'Login successful.',
        ...result,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Login failed.',
      });
    }
  }

  static async logout(_req: Request, res: Response) {
    res.setHeader('Set-Cookie', 'tm_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
    res.json({ success: true });
  }

  /**
   * GET /api/v1/auth/me - Retrieve current authenticated user profile
   */
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated.' });
      const user = await AuthService.getMe(req.user.id);
      res.json({
        success: true,
        user,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: err.message || 'User not found.',
      });
    }
  }
    
  /**
   * PUT /api/v1/auth/profile - Update user profile information
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated.' });

      const { name, jobTitle, avatar } = req.body;
      const user = await AuthService.updateProfile(req.user.id, { name, jobTitle, avatar });
      res.json({
        success: true,
        message: 'Profile updated successfully.',
        user,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update profile.',
      });
    }
  }

  /**
   * POST /api/v1/auth/change-password - Change account password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated.' });

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to change password.',
      });
    }
  }
}
