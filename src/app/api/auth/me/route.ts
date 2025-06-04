
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('panda_session_token');

  if (!tokenCookie || !tokenCookie.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const sessionToken = tokenCookie.value;

  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser) {
    const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    response.cookies.set('panda_session_token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // Now fetch full user profile from the Pod using the session token
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`, // Pass the original session token to the Pod
        'Content-Type': 'application/json',
      },
    });

    if (!podResponse.ok) {
      const errorData = await podResponse.json().catch(() => ({}));
      // If Pod says token is invalid (e.g., user deleted but token still exists), log out client
      if (podResponse.status === 401 || podResponse.status === 404) {
          const response = NextResponse.json({ error: errorData.error || 'User session invalid at Pod' }, { status: 401 });
          response.cookies.set('panda_session_token', '', { maxAge: 0, path: '/' });
          return response;
      }
      return NextResponse.json({ error: errorData.error || 'Failed to fetch user profile from Pod' }, { status: podResponse.status });
    }

    const podData = await podResponse.json();
    return NextResponse.json({ user: podData.user });

  } catch (error) {
    console.error('BFF /me error fetching from Pod:', error);
    return NextResponse.json({ error: 'Internal server error while fetching user profile' }, { status: 500 });
  }
}
