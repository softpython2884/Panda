
import { NextResponse, type NextRequest } from 'next/server';
import { UserLoginSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { serialize } from 'cookie';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002'; // Assuming default for scaffold. Adjust if Pod is on same instance.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserLoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { email, password } = validationResult.data;

    // Call PANDA Pod API
    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Login failed at Pod' }, { status: podResponse.status });
    }

    const { token, user } = podData;

    // Set HttpOnly cookie
    const cookie = serialize('panda_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const response = NextResponse.json({ message: 'Login successful', user });
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
