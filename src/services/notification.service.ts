import { prisma } from '@/lib/prisma';

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'NEED_INFO';
  link: string;
}

export class NotificationService {
  /**
   * Get all notifications for a specific user
   */
  static async getUserNotifications(userId: string) {
    try {
      if ((prisma as any).notification?.findMany) {
        const notifications = await (prisma as any).notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        const unreadCount = await (prisma as any).notification.count({
          where: { userId, isRead: false },
        });
        return { source: 'prisma_database', notifications, unreadCount };
      } else {
        const notifications: any[] = await prisma.$queryRaw`
          SELECT * FROM "Notification"
          WHERE "userId" = ${userId}
          ORDER BY "createdAt" DESC
          LIMIT 30
        `;
        const unreadRows: any[] = await prisma.$queryRaw`
          SELECT COUNT(*)::int as count FROM "Notification"
          WHERE "userId" = ${userId} AND "isRead" = false
        `;
        const unreadCount = unreadRows[0]?.count || 0;
        return { source: 'prisma_database', notifications, unreadCount };
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
      return { source: 'prisma_database', notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      if ((prisma as any).notification?.updateMany) {
        await (prisma as any).notification.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true },
        });
      } else {
        await prisma.$executeRaw`
          UPDATE "Notification"
          SET "isRead" = true
          WHERE "id" = ${notificationId} AND "userId" = ${userId}
        `;
      }
    } catch (e) {
      console.warn('Failed to mark notification as read:', e);
    }
    return { success: true };
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      if ((prisma as any).notification?.updateMany) {
        await (prisma as any).notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      } else {
        await prisma.$executeRaw`
          UPDATE "Notification"
          SET "isRead" = true
          WHERE "userId" = ${userId} AND "isRead" = false
        `;
      }
    } catch (e) {
      console.warn('Failed to mark all notifications as read:', e);
    }
    return { success: true };
  }

  /**
   * Create single notification
   */
  static async createNotification(dto: CreateNotificationDTO) {
    if (!dto.userId) return null;
    try {
      if ((prisma as any).notification?.create) {
        return await (prisma as any).notification.create({
          data: {
            userId: dto.userId,
            title: dto.title,
            message: dto.message,
            type: dto.type,
            link: dto.link,
          },
        });
      } else {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await prisma.$executeRaw`
          INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "isRead", "createdAt")
          VALUES (${id}, ${dto.userId}, ${dto.title}, ${dto.message}, ${dto.type}, ${dto.link}, false, NOW())
        `;
        return { id, ...dto, isRead: false };
      }
    } catch (e) {
      console.warn('Failed to insert notification record:', e);
      return null;
    }
  }

  /**
   * Helper to notify stakeholders when a ticket or suggestion changes
   */
  static async notifyStakeholders({
    recipientIds,
    excludeUserId,
    title,
    message,
    type,
    link,
  }: {
    recipientIds: (string | null | undefined)[];
    excludeUserId?: string;
    title: string;
    message: string;
    type: 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'NEED_INFO';
    link: string;
  }) {
    const uniqueUserIds = Array.from(new Set(recipientIds.filter(Boolean) as string[])).filter(
      (id) => id !== excludeUserId
    );

    for (const userId of uniqueUserIds) {
      try {
        await NotificationService.createNotification({
          userId,
          title,
          message,
          type,
          link,
        });
      } catch (e) {
        console.warn(`Failed to create notification for user ${userId}:`, e);
      }
    }
  }
}
