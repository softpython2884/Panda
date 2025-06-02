
import { NextResponse, type NextRequest } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  // Clear HttpOnly cookie by setting maxAge to 0
  const cookie = serialize('panda_session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, 
  });

  const response = NextResponse.json({ message: 'Logout successful' });
  response.headers.set('Set-Cookie', cookie);
  return response;
}
