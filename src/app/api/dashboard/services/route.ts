
import { NextResponse, type NextRequest } from 'next/server';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN } from '@/lib/schemas';
import { ZodError } from 'zod';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth'; 
import db from '@/lib/db';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';
const AUTH_COOKIE_NAME = 'panda_session_token';

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


// POST a new service (now FrpService)
export async function POST(request: NextRequest) {
  const token = getJwtFromCookie(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body); // ServiceSchema is now FrpServiceSchema

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    // Call PANDA Pod API to register the frp service
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data), // Send FrpServiceInput
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Service registration failed at Pod' }, { status: podResponse.status });
    }

    return NextResponse.json(podData, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) { 
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Service Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
