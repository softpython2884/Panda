
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth'; 
import { ApiTokenCreateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002'; 

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = ApiTokenCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    // Pass the original session token or a service account token if Pod requires specific auth
    const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
    }

    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/api-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`, // Use user's session token to authorize with Pod
      },
      body: JSON.stringify(validationResult.data),
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to create API token at Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Create API Token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
  if (!sessionToken) {
      return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/api-tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch API tokens from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Fetch API Tokens error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
