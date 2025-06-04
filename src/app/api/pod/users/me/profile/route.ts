
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import { UserProfileUpdateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const validationResult = UserProfileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { username, firstName, lastName } = validationResult.data;

    if (username) {
      const existingUsername = db.prepare(
        'SELECT id FROM users WHERE username = ? AND id != ?'
      ).get(username, userId);
      if (existingUsername) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const currentProfile = db.prepare('SELECT username, firstName, lastName FROM users WHERE id = ?').get(userId) as any;

    const newUsername = username !== undefined ? username : currentProfile.username;
    const newFirstName = firstName !== undefined ? firstName : currentProfile.firstName;
    const newLastName = lastName !== undefined ? lastName : currentProfile.lastName;


    db.prepare(
      'UPDATE users SET username = ?, firstName = ?, lastName = ? WHERE id = ?'
    ).run(newUsername, newFirstName, newLastName, userId);

    const updatedUser = db.prepare('SELECT id, email, username, firstName, lastName FROM users WHERE id = ?').get(userId);

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.username')) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
