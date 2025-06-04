
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
let JWT_SECRET_UINT8ARRAY: Uint8Array;

function getSecret(): Uint8Array {
  if (!JWT_SECRET_UINT8ARRAY) {
    JWT_SECRET_UINT8ARRAY = new TextEncoder().encode(JWT_SECRET_STRING);
  }
  return JWT_SECRET_UINT8ARRAY;
}

if (process.env.NODE_ENV === 'production' && JWT_SECRET_STRING === 'your-fallback-secret-key-for-development') {
  console.warn('Warning: JWT_SECRET is not set in production environment. Using fallback secret.');
}
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(payload: object, expiresIn: string = '1d'): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT(payload as any) 
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
  return token;
}

export async function verifyToken<T extends object>(token: string): Promise<T | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch (error) {
    return null;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = await getJwtFromRequest(request);
  if (token) {
    const decoded = await verifyToken<{ id: string }>(token);
    return decoded?.id || null;
  }
  return null;
}

export async function getJwtFromRequest(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); 
    }
    
    const cookieToken = request.cookies.get('panda_session_token');
    if (cookieToken?.value) {
        return cookieToken.value;
    }
    
    return null;
}
