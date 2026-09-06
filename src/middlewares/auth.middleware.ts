import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type UserRole = 'GUEST_USER' | 'IT_SOFTWARE' | 'MANAGER' | 'SUPER_ADMIN';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    teamId?: string | null;
  };
}

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function getTokenSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured in production.');
  }
  return 'development-only-ticket-manager-secret';
}

export function createAuthToken(user: { id: string; email: string; role: UserRole; name: string; teamId?: string | null }) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: user.role, name: user.name, teamId: user.teamId || null, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString('base64url');
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAuthToken(token: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return decoded.exp > Math.floor(Date.now() / 1000) ? decoded : null;
}

function getCookieToken(req: Request) {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('tm_token='));
  return cookie ? decodeURIComponent(cookie.slice('tm_token='.length)) : '';
}

/**
 * Require Authentication Security Middleware
 * Verifies presence of user identity headers before allowing access to protected API endpoints
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : getCookieToken(req);
    const claims = token ? verifyAuthToken(token) : null;
    if (!claims?.sub) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, role: true, name: true, teamId: true } });
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    req.user = user as AuthenticatedRequest['user'];
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }
}

/**
 * Role-Based Access Control (RBAC) Security Middleware
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient authority role level to perform this action.',
        requiredRoles: allowedRoles,
        providedRole: req.user?.role,
      });
    }
    next();
  };
}

