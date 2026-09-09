import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { createAuthToken } from '@/middlewares/auth.middleware';

export interface SignupDTO {
  name: string;
  email: string;
  password: string;
  role?: Role;
  jobTitle?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expected] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

export class AuthService {
  /**
   * Register a new user account with hashed password
   */
  static async signup(dto: SignupDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    }); 

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    // Public self-registration is strictly restricted to GUEST_USER role for security
    const role = Role.GUEST_USER;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.name)}&background=c16d18&color=fff`;

    const user = await prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        password: hashPassword(dto.password),
        role: role,
        jobTitle: dto.jobTitle || 'Portal Guest User',
        avatar: avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        avatar: true,
        createdAt: true,
      },
    });

    return {
      user,
      token: createAuthToken({ id: user.id, email: user.email, role: user.role, name: user.name }),
    };
  }

  /**
   * Log into existing user account
   */
  static async login(dto: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email address or password.');
    }

    if (!user.password || !verifyPassword(dto.password, user.password)) {
      throw new Error('Invalid email address or password.');
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle || '',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=c16d18&color=fff`,
      teamId: user.teamId || null,
      createdAt: user.createdAt,
    };

    return {
      user: safeUser,
      token: createAuthToken({ id: user.id, email: user.email, role: user.role, name: user.name }),
    };
  }

  /**
   * Get current authenticated user details
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        avatar: true,
        teamId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User profile not found.');
    }
    return user;
  }

  /**
   * Update user profile details (Name, Job Title, Avatar)
   */
  static async updateProfile(userId: string, data: { name?: string; jobTitle?: string; avatar?: string }) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new Error('User account not found.');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.jobTitle !== undefined ? { jobTitle: data.jobTitle.trim() } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar.trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        avatar: true,
        teamId: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Change user account password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User account not found.');
    }

    // Verify current password if present
    if (user.password) {
      if (!currentPassword || !verifyPassword(currentPassword, user.password)) {
        throw new Error('Current password is incorrect.');
      }
    } else {
      throw new Error('Current password is required.');
    }

    const hashedNew = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    });

    return { message: 'Password updated successfully.' };
  }
}
