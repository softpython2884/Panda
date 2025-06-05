
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import { createUserNotification } from '@/lib/notificationsHelper';
import { z, ZodError } from 'zod';
import type { NotificationType } from '@/lib/schemas';
import { NotificationTypeSchema } from '@/lib/schemas';

const SendNotificationSchema = z.object({
  userId: z.string().uuid("Invalid User ID format."),
  message: z.string().min(1, "Message cannot be empty.").max(1000, "Message is too long."),
  type: NotificationTypeSchema.optional().default('admin_message'),
  link: z.string().url("Invalid URL format for link.").optional().nullable(),
});

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedAdminUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedAdminUser || !decodedAdminUser.id || decodedAdminUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validationResult = SendNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { userId, message, type, link } = validationResult.data;

    await createUserNotification({
      userId,
      message,
      type,
      link,
    });

    return NextResponse.json({ success: true, message: `Notification sent to user ${userId}.` });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Pod Admin Send Notification error:', error);
    return NextResponse.json({ error: 'Internal server error while sending notification' }, { status: 500 });
  }
}
