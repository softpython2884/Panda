
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token for Pod /me' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(token);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token for Pod /me' }, { status: 401 });
  }
  const userId = decodedUser.id;

  try {
    const user = db.prepare(
      'SELECT id, email, username, firstName, lastName, role FROM users WHERE id = ?'
    ).get(userId) as { id: string; email: string; username: string | null; firstName: string | null; lastName: string | null, role: AuthenticatedUser['role'] } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userProfile = {
        ...user,
        username: user.username || undefined, 
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: user.role || 'FREE', // Default to FREE if somehow null in DB
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Pod /me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
