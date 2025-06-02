
import { NextResponse, type NextRequest } from 'next/server';
import { ServiceSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth'; // For decoding token from cookie

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';
const AUTH_COOKIE_NAME = 'panda_session_token';

// Helper to get JWT from cookie
function getJwtFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

// GET user's services
export async function GET(request: NextRequest) {
  const token = getJwtFromCookie(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  // Optionally verify token here for an early exit, or let Pod API do it.
  // For this BFF, it's good practice to ensure the token is at least present.
  // The Pod API will perform the actual validation.
  
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch services from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Get User Services error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching services' }, { status: 500 });
  }
}


// POST a new service
export async function POST(request: NextRequest) {
  const token = getJwtFromCookie(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  // You might want to verify the token here to get user ID if your BFF needs it,
  // but PANDA Pod /api/pod/register expects the token in Authorization header and verifies it itself.
  // const decodedUser = verifyToken<AuthenticatedUser>(token);
  // if (!decodedUser) {
  //   return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
  // }

  try {
    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    // Call PANDA Pod API to register the service
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Service registration failed at Pod' }, { status: podResponse.status });
    }

    return NextResponse.json(podData, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) { // Should be caught by safeParse, but as a fallback
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Service Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
