
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('panda_session_token');

  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decodedUser = await verifyToken<AuthenticatedUser>(tokenCookie.value);

  if (!decodedUser) {
    // Clear invalid cookie
    const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    response.cookies.set('panda_session_token', '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.json({ user: decodedUser });
}
