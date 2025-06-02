
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { UserRegistrationSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { email, password } = validationResult.data;

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
      .run(userId, email, hashedPassword);

    return NextResponse.json({ message: 'User registered successfully', userId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) { // Should be caught by safeParse, but as a fallback
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
