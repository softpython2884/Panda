
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN, frpServiceTypes } from '@/lib/schemas'; // ServiceSchema is FrpServiceSchema
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
    
    // Construct public_url for frp service
    // For http/https, it's subdomain.BASE_DOMAIN
    // For tcp/udp, it might be BASE_DOMAIN:remote_port, but user requested subdomain for all.
    // We will assume frps is configured to handle subdomains for all types or specific ports per subdomain.
    const generated_public_url = `http://${subdomain}.${FRP_SERVER_BASE_DOMAIN}`;
    // Note: For TCP/UDP, this URL might not be directly browsable but serves as an identifier.
    // The actual connection would be {subdomain}.{FRP_SERVER_BASE_DOMAIN} which resolves to frps IP,
    // and frps then routes based on its config for that subdomain to the correct frpc.
    // If frps needs a specific remote_port for TCP/UDP for that subdomain, that's an frps config.

    const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ?').get(subdomain);
    if (existingDomain) {
      return NextResponse.json({ error: 'Subdomain already registered. Please choose a unique subdomain.' }, { status: 409 });
    }
    
    const serviceId = crypto.randomUUID();

    // Storing frp specific data
    // 'domain' column will store the frp 'subdomain'
    // 'type' column will store the 'frpType'
    // 'local_port' column stores 'localPort'
    // 'public_url' stores the generated one.
    // 'local_url' (legacy) can be null or store "127.0.0.1:{localPort}" for informational purposes.
    const legacy_local_url_info = `127.0.0.1:${localPort}`;

    db.prepare(
      `INSERT INTO services (id, user_id, name, description, local_url, public_url, domain, type, local_port, frp_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        serviceId, 
        userId, 
        name, 
        description, 
        legacy_local_url_info, // Store informational local URL
        generated_public_url, 
        subdomain, // Storing frp_subdomain in 'domain' column
        frpType,   // Storing frp_type in 'type' column
        localPort,
        frpType    // Storing frp_type also in 'frp_type' column for clarity if needed
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
