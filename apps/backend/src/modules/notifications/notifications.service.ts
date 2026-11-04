import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async getUserNotifications(userId: string, limit = 30) {
    const list = await this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);

    const unreadCount = list.filter((n: any) => !n.isRead).length;

    return {
      notifications: list,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId)
        )
      );

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, userId));

    return { success: true };
  }
}
