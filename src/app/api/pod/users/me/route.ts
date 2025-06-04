
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';

// This Pod route is called by the BFF (/api/auth/me) after it verifies the token.
// It expects the BFF to pass the authenticated user's ID or ensure the request is authenticated.
// For simplicity, we'll re-verify the token here if needed, or trust the BFF's prior verification
// if the BFF passes the user ID securely.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token for Pod /me' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(token);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token for Pod /me' }, { status: 401 });
  }
  const userId = decodedUser.id;

  try {
    const user = db.prepare(
      'SELECT id, email, username, firstName, lastName FROM users WHERE id = ?'
    ).get(userId) as { id: string; email: string; username: string | null; firstName: string | null; lastName: string | null } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Ensure username is not null, or provide a default if necessary for the User interface
    const userProfile = {
        ...user,
        username: user.username || undefined, // Convert null to undefined if User interface expects optional string
        firstName: user.firstName || null,
        lastName: user.lastName || null,
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Pod /me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
