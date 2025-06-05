
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { notificationId: string } }) {
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
  const { notificationId } = params;

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
  }

  try {
    const result = db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id = ? AND user_id = ? AND is_read = 0"
    ).run(notificationId, userId);

    if (result.changes === 0) {
      // Could be already read, or not found, or not owned by user
      const existing = db.prepare("SELECT id, is_read FROM notifications WHERE id = ? AND user_id = ?").get(notificationId, userId);
      if (!existing) {
        return NextResponse.json({ error: 'Notification not found or not owned by user' }, { status: 404 });
      }
      if ((existing as any).is_read) {
         return NextResponse.json({ message: 'Notification was already marked as read.' });
      }
    }
    
    return NextResponse.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Pod Mark Notification Read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
    