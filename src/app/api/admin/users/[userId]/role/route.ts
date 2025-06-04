
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { UserRoleSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  const { userId: targetUserId } = params;
  if (!targetUserId) {
    return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = z.object({ role: UserRoleSchema }).safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    const { role } = validationResult.data;

    const sessionToken = (await request.cookies.get('panda_session_token'))?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
    }

    const podResponse = await fetch(`${POD_API_URL}/api/pod/admin/users/${targetUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`, // Pass admin's session token
      },
      body: JSON.stringify({ role }),
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to update user role at Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Admin Update User Role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
