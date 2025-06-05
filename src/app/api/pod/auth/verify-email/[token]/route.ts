
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface VerifyEmailParams {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, { params }: VerifyEmailParams) {
  const { token } = params;

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid verification token format.' }, { status: 400 });
  }

  try {
    const user = db.prepare(
      'SELECT id, email_verified FROM users WHERE email_verification_token = ?'
    ).get(token) as { id: string; email_verified: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
    }

    if (user.email_verified) {
      return NextResponse.json({ message: 'Email already verified.' });
    }

    db.prepare(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?'
    ).run(user.id);

    return NextResponse.json({ message: 'Email verified successfully. You can now log in.' });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Internal server error during email verification.' }, { status: 500 });
  }
}
