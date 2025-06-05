
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
  if (!sessionToken) {
      return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
  }
  
  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/admin/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`, // Pass admin's session token
      },
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to fetch services from Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData); // podData should be { services: [...] }

  } catch (error) {
    console.error('BFF Admin Get Services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
