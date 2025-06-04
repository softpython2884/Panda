
import { NextResponse, type NextRequest } from 'next/server';
import { UserProfileUpdateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { verifyToken } from '@/lib/auth-edge'; // Using auth-edge for middleware-like token verification

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';
const AUTH_COOKIE_NAME = 'panda_session_token';

async function getSessionToken(request: NextRequest): Promise<string | null> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

// GET current user's profile
export async function GET(request: NextRequest) {
  const sessionToken = await getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  // The /api/auth/me route already fetches full profile from Pod, so we can call it.
  // Alternatively, we could call /api/pod/users/me directly if we handle token verification here.
  // For consistency with how the app loads user data, let's proxy through /api/auth/me logic.
  // However, /api/auth/me is also a BFF route. Calling BFF from BFF can be complex.
  // It's better to call the Pod directly if this route is protected and knows how to pass the token.

  const decodedUser = await verifyToken<{id: string}>(sessionToken);
   if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch profile from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData.user); // Return just the user object

  } catch (error) {
    console.error('BFF Get Profile error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching profile' }, { status: 500 });
  }
}


// PUT update user's profile
export async function PUT(request: NextRequest) {
  const sessionToken = await getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }
  
  const decodedUser = await verifyToken<{id: string}>(sessionToken);
   if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = UserProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to update profile at Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Update Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
