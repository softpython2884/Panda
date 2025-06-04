
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { UserLoginSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import type { AuthenticatedUser } from '@/lib/auth'; // Import AuthenticatedUser type

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = UserLoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { email, password } = validationResult.data;

    const userFromDb = db.prepare(
      'SELECT id, email, password_hash, username, firstName, lastName, role FROM users WHERE email = ?'
    ).get(email) as { 
        id: string; 
        email: string; 
        password_hash: string; 
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        role: AuthenticatedUser['role']; // Use the role type from AuthenticatedUser
    } | undefined;

    if (!userFromDb) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, userFromDb.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Construct the user object to be returned and included in the token
    const userPayload: AuthenticatedUser & { username?: string, firstName?: string | null, lastName?: string | null } = {
      id: userFromDb.id,
      email: userFromDb.email,
      username: userFromDb.username || undefined, // Ensure undefined if null
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      role: userFromDb.role || 'FREE', // Default to FREE if somehow null
    };
    
    const token = await generateToken({ 
        id: userPayload.id, 
        email: userPayload.email, 
        role: userPayload.role 
        // Note: username, firstName, lastName are not typically part of the JWT payload for size/security,
        // they are fetched by /api/auth/me. The login response body will contain them.
    });

    // The response body contains the full user profile for immediate use by the client
    return NextResponse.json({ 
        message: 'Login successful', 
        token, 
        user: userPayload // Send the full user object in the response body
    });

  } catch (error) {
     if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Pod Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
