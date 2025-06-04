
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN, frpServiceTypes, PANDA_TUNNEL_MAIN_HOST } from '@/lib/schemas'; // ServiceSchema is FrpServiceSchema
import { AuthenticatedUser, verifyToken } from '@/lib/auth';
import { ZodError } from 'zod';

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
    const validationResult = ServiceSchema.safeParse(body); // ServiceSchema is FrpServiceSchema

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, description, localPort, subdomain, frpType } = validationResult.data;
    
    let generated_public_url: string;
    if (PANDA_TUNNEL_MAIN_HOST) { // PANDA_TUNNEL_MAIN_HOST is now correctly imported and can be undefined
      generated_public_url = `http://${subdomain}.${PANDA_TUNNEL_MAIN_HOST}`;
    } else {
      // Fallback if PANDA_TUNNEL_MAIN_HOST is not set in environment
      generated_public_url = `http://${subdomain}.${FRP_SERVER_BASE_DOMAIN}`; 
      console.warn(`PANDA_TUNNEL_MAIN_HOST environment variable is not set. Falling back to FRP_SERVER_BASE_DOMAIN for public URL generation: ${generated_public_url}`);
    }
    
    const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ?').get(subdomain);
    if (existingDomain) {
      return NextResponse.json({ error: 'Subdomain already registered. Please choose a unique subdomain.' }, { status: 409 });
    }
    
    const serviceId = crypto.randomUUID();
    const legacy_local_url_info = `127.0.0.1:${localPort}`;

    db.prepare(
      `INSERT INTO services (id, user_id, name, description, local_url, public_url, domain, type, local_port, frp_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        serviceId, 
        userId, 
        name, 
        description, 
        legacy_local_url_info, 
        generated_public_url, 
        subdomain, 
        frpType,   
        localPort,
        frpType    
    );

    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

    return NextResponse.json({ message: 'Service registered successfully', service: newService }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service registration error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: services.domain')) {
        return NextResponse.json({ error: 'Subdomain already registered. Please choose a unique subdomain.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
