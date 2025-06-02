
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema } from '@/lib/schemas';
import { getUserIdFromRequest, AuthenticatedUser, verifyToken } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decodedUser = verifyToken<AuthenticatedUser>(token);

    if (!decodedUser || !decodedUser.id) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedUser.id;

    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, description, local_url, public_url, domain, type } = validationResult.data;

    const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ?').get(domain);
    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    
    const serviceId = crypto.randomUUID();

    db.prepare(
      'INSERT INTO services (id, user_id, name, description, local_url, public_url, domain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(serviceId, userId, name, description, local_url, public_url || null, domain, type);

    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

    return NextResponse.json({ message: 'Service registered successfully', service: newService }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service registration error:', error);
    // Check for SQLite unique constraint error (e.g., for domain)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: services.domain')) {
        return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
