
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
    // Select only necessary fields for listing, or just 'id' if only count is needed by frontend.
    // For now, returning more details in case the admin service management page needs them.
    const services = db.prepare(
      'SELECT id, name, user_id, domain, type, public_url, created_at FROM services ORDER BY created_at DESC'
    ).all();
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Pod Admin List Services error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching services' }, { status: 500 });
  }
}
