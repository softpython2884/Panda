
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import type { NotificationDisplay } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired session token' }, { status: 401 });
  }
  const userId = decodedUser.id;

  try {
    // Fetch notifications, unread first, then by creation date descending
    const notificationsFromDb = db.prepare(
      'SELECT id, user_id as userId, message, type, link, is_read as isRead, created_at as createdAt, read_at as readAt FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT 50'
    ).all(userId) as any[];

    const notifications: NotificationDisplay[] = notificationsFromDb.map(n => ({
        ...n,
        isRead: Boolean(n.isRead), // Ensure isRead is boolean
    }));

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as { count: number };
    
    return NextResponse.json({ notifications, unreadCount: unreadCount.count });
  } catch (error) {
    console.error('Pod List Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching notifications' }, { status: 500 });
  }
}
    