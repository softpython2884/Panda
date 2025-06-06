
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import { CloudSpaceCreateSchema, RolesConfig } from '@/lib/schemas';
import { ZodError } from 'zod';
import { createUserNotification } from '@/lib/notificationsHelper';

// GET user's cloud spaces
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(token);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
  const userId = decodedUser.id;

  try {
    const cloudSpaces = db.prepare(
      'SELECT id, name, discord_webhook_url, discord_channel_id, created_at FROM cloud_spaces WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    return NextResponse.json({ cloudSpaces });
  } catch (error) {
    console.error('Pod List Cloud Spaces error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching cloud spaces' }, { status: 500 });
  }
}

// POST a new cloud space
export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let userRole: AuthenticatedUser['role'] | null = null;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decodedUser = await verifyToken<AuthenticatedUser>(token);

    if (!decodedUser || !decodedUser.id || !decodedUser.role) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    userId = decodedUser.id;
    userRole = decodedUser.role;

    // Check quota
    const userSpacesCountResult = db.prepare('SELECT COUNT(*) as count FROM cloud_spaces WHERE user_id = ?').get(userId) as { count: number } | undefined;
    const userSpacesCount = userSpacesCountResult ? userSpacesCountResult.count : 0;
    
    const quotaConfig = RolesConfig[userRole] || RolesConfig.FREE;
    if (quotaConfig.maxCloudServers !== Infinity && userSpacesCount >= quotaConfig.maxCloudServers) {
      return NextResponse.json({ error: 'Cloud space quota reached for your current grade.' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CloudSpaceCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name } = validationResult.data;
    
    // For now, discord_webhook_url and discord_channel_id will be null
    // as the bot integration is not yet implemented.
    const discordWebhookUrl = null; 
    const discordChannelId = null;

    const spaceId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO cloud_spaces (id, user_id, name, discord_webhook_url, discord_channel_id, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(spaceId, userId, name, discordWebhookUrl, discordChannelId);

    const newSpace = db.prepare('SELECT * FROM cloud_spaces WHERE id = ?').get(spaceId);

    if (userId) {
        await createUserNotification({
            userId,
            message: `Votre nouvel espace cloud "${name}" a été créé avec succès.`,
            type: 'success',
            link: `/dashboard/cloud` 
        });
    }

    return NextResponse.json({ message: 'Cloud space created successfully', cloudSpace: newSpace }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Cloud Space creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
