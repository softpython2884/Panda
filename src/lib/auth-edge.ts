
import jwt from 'jsonwebtoken';

// Environment variables need to be prefixed with NEXT_PUBLIC_ for client-side browser access,
// but for Edge middleware, regular environment variables (accessed via process.env) should work 
// if configured correctly in the deployment environment.
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-fallback-secret-key-for-development') {
  // This console.warn will appear in build logs or Edge function logs, not the browser.
  console.warn('Warning: JWT_SECRET is not set in production environment (Edge). Using fallback secret.');
}

export interface DecodedToken {
  id: string;
  email: string;
  // Add other fields if they are part of your token payload
  [key: string]: any;
}

export function verifyToken<T extends object = DecodedToken>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    // console.error('Token verification failed in Edge:', error); // Optional: log for debugging
    return null;
  }
}
