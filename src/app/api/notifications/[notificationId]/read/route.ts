
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function POST(request: NextRequest, { params }: { params: { notificationId: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { notificationId } = params;
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
  }

  const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
  if (!sessionToken) {
      return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
  }

  try {
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/me/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to mark notification as read at Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    console.error('BFF Mark Notification Read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
    