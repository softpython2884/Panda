
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { DiscordIntegrationUpdateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
// Note: This endpoint is called by the Discord bot, not a PANDA user directly.
// Authentication for this endpoint (e.g., a shared secret/API key from the bot)
// is not implemented in this iteration but should be considered for production.

interface RouteParams {
  params: {
    cloudSpaceId: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { cloudSpaceId } = params;

  if (!cloudSpaceId) {
    return NextResponse.json({ error: 'Cloud Space ID is required in path.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = DiscordIntegrationUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { private_webhook_url, private_channel_id } = validationResult.data;

    // Check if the cloud space exists
    const existingSpace = db.prepare('SELECT id FROM cloud_spaces WHERE id = ?').get(cloudSpaceId);
    if (!existingSpace) {
      return NextResponse.json({ error: 'Cloud Space not found.' }, { status: 404 });
    }

    const result = db.prepare(
      'UPDATE cloud_spaces SET discord_webhook_url = ?, discord_channel_id = ? WHERE id = ?'
    ).run(private_webhook_url, private_channel_id, cloudSpaceId);

    if (result.changes === 0) {
      // This might happen if the values are the same, or if the ID was wrong (though checked above)
      console.warn(`No changes made to cloud_space ${cloudSpaceId} during discord-integration update. This might be okay if data was identical.`);
    }

    return NextResponse.json({ message: 'Discord integration details updated successfully for Cloud Space.' });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input for Discord integration', details: error.flatten() }, { status: 400 });
    }
    console.error(`Error updating Discord integration for Cloud Space ${cloudSpaceId}:`, error);
    return NextResponse.json({ error: 'Internal server error while updating Discord integration.' }, { status: 500 });
  }
}
