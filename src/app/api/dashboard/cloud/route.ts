
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge'; // Using auth-edge for middleware-like token verification
import { CloudSpaceCreateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';
const AUTH_COOKIE_NAME = 'panda_session_token';

export const dynamic = 'force-dynamic'; // Ensure fresh data

async function getSessionToken(request: NextRequest): Promise<string | null> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

// GET user's cloud spaces
export async function GET(request: NextRequest) {
  const sessionToken = await getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  const decodedUser = await verifyToken<{id: string}>(sessionToken);
   if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
  }
  
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/cloud`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      // Add cache-busting for the fetch call itself if necessary, though force-dynamic on pod route should help
      cache: 'no-store', 
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch cloud spaces from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData); // podData should be { cloudSpaces: [...] }

  } catch (error) {
    console.error('BFF Get Cloud Spaces error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching cloud spaces' }, { status: 500 });
  }
}

// POST a new cloud space
export async function POST(request: NextRequest) {
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
    const validationResult = CloudSpaceCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const podResponse = await fetch(`${POD_API_URL}/api/pod/cloud`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data), 
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Cloud space creation failed at Pod' }, { status: podResponse.status });
    }

    return NextResponse.json(podData, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) { 
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Cloud Space Creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
