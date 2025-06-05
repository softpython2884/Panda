
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
    const result = db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0"
    ).run(userId);

    return NextResponse.json({ message: 'All notifications marked as read.', affectedRows: result.changes });
  } catch (error) {
    console.error('Pod Mark All Notifications Read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
    