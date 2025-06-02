
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { UserLoginSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserLoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { email, password } = validationResult.data;

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await generateToken({ id: user.id, email: user.email });

    return NextResponse.json({ message: 'Login successful', token, user: { id: user.id, email: user.email } });
  } catch (error) {
     if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
