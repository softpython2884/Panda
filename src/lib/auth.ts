
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import crypto from 'crypto'; // For generating API token string
import type { UserRole } from './schemas';

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
  role: UserRole;
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = await getJwtFromRequest(request);
  if (token) {
    const decoded = await verifyToken<AuthenticatedUser>(token);
    return decoded?.id || null;
  }
  return null;
}
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = await getJwtFromRequest(request);
  if (token) {
    const decoded = await verifyToken<AuthenticatedUser>(token);
    return decoded || null;
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

export const API_TOKEN_PREFIX = "panda_pat_";
const API_TOKEN_LENGTH = 32; // Length of the random part after the prefix

export function generateApiTokenString(): { rawToken: string, prefix: string } {
  const randomBytes = crypto.randomBytes(API_TOKEN_LENGTH);
  const tokenPart = randomBytes.toString('hex').slice(0, API_TOKEN_LENGTH * 2); // Ensure enough hex chars
  const rawToken = `${API_TOKEN_PREFIX}${tokenPart}`;
  const prefix = `${API_TOKEN_PREFIX}${tokenPart.slice(0, 8)}`; // e.g., panda_pat_abcdef12
  return { rawToken, prefix };
}

export async function hashApiToken(token: string): Promise<string> {
  // Using bcrypt for API tokens as well, for consistency. SHA256 is also an option.
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function compareApiToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
