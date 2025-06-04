
import { NextResponse, type NextRequest } from 'next/server';
import { UserRegistrationSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { username, email, password } = validationResult.data;

    const podResponse = await fetch(`${POD_API_URL}/api/pod/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      return NextResponse.json({ error: podData.error || 'Registration failed at Pod' }, { status: podResponse.status });
    }

    return NextResponse.json({ message: podData.message, userId: podData.userId }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('BFF Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
