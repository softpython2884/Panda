
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

// DELETE - Revoke an API token
export async function DELETE(request: NextRequest, { params }: { params: { tokenId: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired session token' }, { status: 401 });
  }
  const userId = decodedUser.id;
  const { tokenId } = params;

  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
  }

  try {
    const result = db.prepare(
      'DELETE FROM api_tokens WHERE id = ? AND user_id = ?'
    ).run(tokenId, userId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Token not found or you do not own this token' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // Successfully deleted, no content to return
  } catch (error) {
    console.error('Pod Revoke API Token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
