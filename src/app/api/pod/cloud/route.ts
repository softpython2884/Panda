
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import { CloudSpaceCreateSchema, RolesConfig, DISCORD_GENERAL_WEBHOOK_URL } from '@/lib/schemas';
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
  let userPandaUsername: string | undefined = undefined;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decodedUser = await verifyToken<AuthenticatedUser & { username?: string }>(token); // Add username to type if present

    if (!decodedUser || !decodedUser.id || !decodedUser.role) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    userId = decodedUser.id;
    userRole = decodedUser.role;
    
    // Attempt to get username for Discord notification
    const fullUserFromDb = db.prepare('SELECT username, email FROM users WHERE id = ?').get(userId) as { username: string | null, email: string } | undefined;
    userPandaUsername = fullUserFromDb?.username || fullUserFromDb?.email;


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

    // Send notification to general Discord webhook if URL is configured
    if (DISCORD_GENERAL_WEBHOOK_URL) {
      try {
        const discordPayload = {
          content: `Nouvel espace cloud PANDA créé ! Préparez-vous à intervenir, cher Bot !`,
          embeds: [{
            title: "Requête de Création d'Espace Cloud PANDA",
            color: 0x38b26c, // PANDA Green
            fields: [
              { name: "Nom de l'espace", value: name, inline: true },
              { name: "Utilisateur PANDA", value: userPandaUsername || 'N/A', inline: true },
              { name: "ID Utilisateur PANDA", value: `\`${userId}\``, inline: false },
              { name: "ID Espace Cloud PANDA", value: `\`${spaceId}\``, inline: false },
            ],
            footer: { text: "PANDA Ecosystem - Initialisation d'Espace Cloud" },
            timestamp: new Date().toISOString(),
          }]
        };
        
        fetch(DISCORD_GENERAL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload),
        }).then(response => {
          if (!response.ok) {
            console.error(`Failed to send Discord notification for new cloud space ${spaceId}. Status: ${response.status}`);
            response.json().then(data => console.error("Discord error data:", data)).catch(() => {});
          } else {
            console.log(`Successfully sent Discord notification for new cloud space ${spaceId}.`);
          }
        }).catch(err => {
          console.error(`Error sending Discord notification for new cloud space ${spaceId}:`, err);
        });
      } catch (discordError) {
        console.error('Error preparing or sending Discord notification:', discordError);
      }
    } else {
        console.warn("DISCORD_GENERAL_WEBHOOK_URL is not set. Skipping Discord notification for new cloud space.");
    }


    return NextResponse.json({ message: 'Cloud space created successfully. Initialisation Discord en cours si configurée.', cloudSpace: newSpace }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Cloud Space creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
