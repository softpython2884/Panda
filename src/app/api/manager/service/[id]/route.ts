
import { NextResponse, type NextRequest } from 'next/server';
import { ServiceSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';
const AUTH_COOKIE_NAME = 'panda_session_token';

function getJwtFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId = params.id;
  const token = getJwtFromCookie(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body); // Or a partial schema for updates

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationResult.data),
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to update service at Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Manager Update Service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId = params.id;
  const token = getJwtFromCookie(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!podResponse.ok) {
      const podData = await podResponse.json().catch(() => ({})); // Catch if no JSON body on error
      return NextResponse.json({ error: podData.error || 'Failed to delete service at Pod' }, { status: podResponse.status });
    }
    // For DELETE, Pod might return 204 No Content or 200 with message
    if (podResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    const podData = await podResponse.json();
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Manager Delete Service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId = params.id;
  const token = getJwtFromCookie(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
  }
  
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register/${serviceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch service from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Get Service error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching service' }, { status: 500 });
  }
}
