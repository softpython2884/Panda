
'use server';

import { db } from '@/lib/db';
import type { NotificationType } from '@/lib/schemas';

interface CreateNotificationParams {
  userId: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

/**
 * Creates a notification for a specific user.
 * Logs errors to console but does not throw to prevent breaking calling flows.
 */
export async function createUserNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, message, type = 'info', link = null } = params;
  const notificationId = crypto.randomUUID();

  try {
    db.prepare(
      `INSERT INTO notifications (id, user_id, message, type, link, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`
    ).run(notificationId, userId, message, type, link);
    console.log(`Notification created for user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error);
    // Do not throw, as notification creation is a secondary effect.
  }
}
