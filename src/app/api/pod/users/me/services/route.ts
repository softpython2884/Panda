
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthenticatedUser, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decodedUser = await verifyToken<AuthenticatedUser>(token);

    if (!decodedUser || !decodedUser.id) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedUser.id;

    const services = db.prepare('SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return NextResponse.json(services);
    
  } catch (error) {
    console.error('Error fetching user services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
