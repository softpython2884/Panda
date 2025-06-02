
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';
let JWT_SECRET_UINT8ARRAY: Uint8Array;

function getSecret(): Uint8Array {
  if (!JWT_SECRET_UINT8ARRAY) {
    JWT_SECRET_UINT8ARRAY = new TextEncoder().encode(JWT_SECRET_STRING);
  }
  return JWT_SECRET_UINT8ARRAY;
}

if (process.env.NODE_ENV === 'production' && JWT_SECRET_STRING === 'your-fallback-secret-key-for-development') {
  console.warn('Warning: JWT_SECRET is not set in production environment (Edge). Using fallback secret.');
}

export interface DecodedToken {
  id: string;
  email: string;
  [key: string]: any;
}

export async function verifyToken<T extends object = DecodedToken>(token: string): Promise<T | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch (error) {
    // console.error('Token verification failed in Edge:', error);
    return null;
  }
}
