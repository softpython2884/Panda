
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { UserRegistrationSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

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
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // For new users, firstName and lastName can be NULL by default
    // email_verified defaults to 0 (false) due to schema
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, email_verification_token) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, username, email, hashedPassword, emailVerificationToken);

    // Send verification email (fire and forget, but log errors)
    sendVerificationEmail(email, emailVerificationToken, username)
      .catch(err => console.error('Failed to send verification email to ' + email + ':', err));

    return NextResponse.json({ message: 'User registered successfully. Please check your email to verify your account.', userId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) { 
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Registration error:', error);
    // Check for SQLite constraint errors specifically for username if needed
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.username')) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
