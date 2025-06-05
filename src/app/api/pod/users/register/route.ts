
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken, type AuthenticatedUser } from '@/lib/auth';
import { UserRegistrationSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { username, email, password } = validationResult.data;

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const defaultRole: AuthenticatedUser['role'] = 'FREE';

    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, username, email, hashedPassword, defaultRole);

    const userPayload: AuthenticatedUser & { username?: string, firstName?: string | null, lastName?: string | null } = {
      id: userId,
      email: email,
      username: username,
      firstName: null, // Defaulting to null
      lastName: null,  // Defaulting to null
      role: defaultRole,
    };

    const token = await generateToken({ 
        id: userPayload.id, 
        email: userPayload.email, 
        role: userPayload.role 
    });

    return NextResponse.json({ 
        message: 'User registered successfully.', 
        userId, 
        user: userPayload, 
        token 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Pod Registration error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.username')) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
