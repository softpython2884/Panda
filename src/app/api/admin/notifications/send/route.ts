
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { z, ZodError } from 'zod';
import { NotificationTypeSchema } from '@/lib/schemas';


const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

const BffSendNotificationSchema = z.object({
  userId: z.string().uuid("Invalid User ID format."),
  message: z.string().min(1, "Message cannot be empty.").max(1000, "Message is too long."),
  type: NotificationTypeSchema.optional().default('admin_message'),
  link: z.string().url("Invalid URL format for link.").optional().nullable(),
});

export async function POST(request: NextRequest) {
  const adminUser = await getUserFromRequest(request);
  if (!adminUser || adminUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validationResult = BffSendNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const sessionToken = request.cookies.get('panda_session_token')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'Session token missing for Pod request' }, { status: 401 });
    }

    const podResponse = await fetch(`${POD_API_URL}/api/pod/admin/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`, 
      },
      body: JSON.stringify(validationResult.data),
    });

    const podData = await podResponse.json();
    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Failed to send notification via Pod' }, { status: podResponse.status });
    }
    return NextResponse.json(podData);

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Admin Send Notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
