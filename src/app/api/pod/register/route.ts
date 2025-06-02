
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema } from '@/lib/schemas';
import { AuthenticatedUser, verifyToken } from '@/lib/auth';
import { ZodError } from 'zod';

const PANDA_TUNNEL_MAIN_HOST = process.env.PANDA_TUNNEL_MAIN_HOST;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decodedUser = await verifyToken<AuthenticatedUser>(token);

    if (!decodedUser || !decodedUser.id) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedUser.id;

    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, description, local_url, domain, type } = validationResult.data;
    let public_url_to_store = validationResult.data.public_url; // User input

    if (PANDA_TUNNEL_MAIN_HOST && domain) {
      const derived_public_url = `http://${domain}.${PANDA_TUNNEL_MAIN_HOST}`;
      try {
        new URL(derived_public_url); // Validate structure
        public_url_to_store = derived_public_url;
      } catch (e) {
        console.error(`Invalid constructed tunnel URL: ${derived_public_url}`, e);
        // If construction fails, and user didn't provide a fallback, it might be an issue.
        // For now, if PANDA_TUNNEL_MAIN_HOST is set, we expect derivation to succeed.
        // If it fails, it's a config error on PANDA_TUNNEL_MAIN_HOST or domain structure.
        // The ServiceSchema still requires a public_url if PANDA_TUNNEL_MAIN_HOST is not set.
        if (!public_url_to_store) { // Should not happen if schema requires it and derivation fails
            return NextResponse.json({ error: 'Failed to determine public URL for the service.' }, { status: 500 });
        }
      }
    }
    
    if (!public_url_to_store) {
        // This case should ideally be caught by Zod schema if PANDA_TUNNEL_MAIN_HOST is not set,
        // as public_url is mandatory.
        return NextResponse.json({ error: 'Public URL is required and could not be determined.' }, { status: 400 });
    }


    const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ?').get(domain);
    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    
    const serviceId = crypto.randomUUID();

    db.prepare(
      'INSERT INTO services (id, user_id, name, description, local_url, public_url, domain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(serviceId, userId, name, description, local_url, public_url_to_store, domain, type);

    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

    return NextResponse.json({ message: 'Service registered successfully', service: newService }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service registration error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: services.domain')) {
        return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
