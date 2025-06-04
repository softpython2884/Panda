
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser || !decodedUser.id || decodedUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const users = db.prepare(
      'SELECT id, email, username, firstName, lastName, role, created_at FROM users ORDER BY created_at DESC'
    ).all();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Pod Admin List Users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
