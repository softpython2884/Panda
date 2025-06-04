
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function DELETE(request: NextRequest, { params }: { params: { tokenId: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tokenId } = params;
  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
  }

  const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
  if (!sessionToken) {
      return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/api-tokens/${tokenId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!podResponse.ok) {
      const podData = await podResponse.json().catch(() => ({}));
      return NextResponse.json({ error: podData.error || 'Failed to revoke API token at Pod' }, { status: podResponse.status });
    }
    
    // frps does not return content on successful DELETE (204)
    if (podResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    const podData = await podResponse.json();
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Revoke API Token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
