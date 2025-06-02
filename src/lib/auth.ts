
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-fallback-secret-key-for-development') {
  console.warn('Warning: JWT_SECRET is not set in production environment. Using fallback secret.');
}
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object, expiresIn: string = '1d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove "Bearer "
    const decoded = verifyToken<{ id: string }>(token);
    return decoded?.id || null;
  }
  return null;
}

export function getJwtFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Remove "Bearer "
    }
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
        }, {} as Record<string, string>);
        if (cookies.panda_session_token) {
            return cookies.panda_session_token;
        }
    }
    return null;
}
