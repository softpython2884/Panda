
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
    const services = db.prepare(
      `SELECT 
        s.id, s.name, s.description, s.public_url, s.domain, s.type, s.local_port, s.remote_port, s.created_at, s.user_id, u.email as user_email 
       FROM services s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    ).all();
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Pod Admin List Services error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching services' }, { status: 500 });
  }
}
