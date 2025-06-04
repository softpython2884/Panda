
import { NextResponse, type NextRequest } from 'next/server';
import { ServiceSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { getJwtFromRequest } from '@/lib/auth'; // Updated import

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

// Function to get JWT from cookie or Authorization header
// This function is now simplified as getJwtFromRequest handles both
async function getToken(request: NextRequest): Promise<string | null> {
  return getJwtFromRequest(request);
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId: string = params.id;
  const token = await getToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token or authorization' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body); 

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
  const serviceId: string = params.id;
  const token = await getToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token or authorization' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!podResponse.ok) {
      const podData = await podResponse.json().catch(() => ({})); 
      return NextResponse.json({ error: podData.error || 'Failed to delete service at Pod' }, { status: podResponse.status });
    }
    
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
  const serviceId: string = params.id;
  const token = await getToken(request); // Use the unified getToken

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token or authorization' }, { status: 401 });
  }
  
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/register/${serviceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Send token to Pod
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
