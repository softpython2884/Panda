
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN, PANDA_TUNNEL_MAIN_HOST, FRP_SERVER_ADDR } from '@/lib/schemas';
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
    const validationResult = ServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, description, localPort, subdomain, frpType, remotePort, useEncryption, useCompression } = validationResult.data;
    
    let generated_public_url: string;
    const effectiveBaseDomain = PANDA_TUNNEL_MAIN_HOST || FRP_SERVER_BASE_DOMAIN;

    if (frpType === 'http' || frpType === 'https') {
        generated_public_url = `http${frpType === 'https' ? 's' : ''}://${subdomain}.${effectiveBaseDomain}`;
    } else if ((frpType === 'tcp' || frpType === 'udp') && remotePort) {
        generated_public_url = `${FRP_SERVER_ADDR}:${remotePort}`;
    } else if (frpType === 'stcp' || frpType === 'xtcp') {
        // For STCP/XTCP, the public URL might be more informational if a specific port isn't exposed directly by frps for these types via subdomain alone.
        // The client typically binds to a local port to access the STCP/XTCP service.
        // We can still construct a domain-based URL for informational purposes.
        generated_public_url = `${subdomain}.${effectiveBaseDomain} (via STCP/XTCP - voir config client)`;
    }
     else {
        generated_public_url = `Configuration Incomplete - ${subdomain}.${effectiveBaseDomain}`;
    }
    
    if (frpType === 'http' || frpType === 'https' || frpType === 'stcp' || frpType === 'xtcp') {
        const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ?').get(subdomain);
        if (existingDomain) {
          return NextResponse.json({ error: 'Subdomain already registered. Please choose a unique subdomain.' }, { status: 409 });
        }
    } else if ((frpType === 'tcp' || frpType === 'udp') && remotePort) {
        const existingRemotePort = db.prepare('SELECT id FROM services WHERE remote_port = ? AND frp_type IN (?, ?)').get(remotePort, 'tcp', 'udp');
        if (existingRemotePort) {
            return NextResponse.json({ error: `Remote port ${remotePort} is already in use for a TCP/UDP tunnel. Please choose another.` }, { status: 409 });
        }
    }
    
    const serviceId = crypto.randomUUID();
    const legacy_local_url_info = `127.0.0.1:${localPort}`; 
    const dbRemotePort = (frpType === 'tcp' || frpType === 'udp') && remotePort ? remotePort : null;
    const dbUseEncryption = useEncryption === true ? 1 : 0;
    const dbUseCompression = useCompression === true ? 1 : 0;

    db.prepare(
      `INSERT INTO services (id, user_id, name, description, local_url, public_url, domain, type, local_port, frp_type, remote_port, use_encryption, use_compression) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        frpType,   
        dbRemotePort,
        dbUseEncryption,
        dbUseCompression
    );

    const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

    return NextResponse.json({ message: 'Service registered successfully', service: newService }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service registration error:', error);
    if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed: services.domain')) {
            return NextResponse.json({ error: 'Subdomain already registered. Please choose a unique subdomain.' }, { status: 409 });
        }
        if (error.message.includes('UNIQUE constraint failed: services.remote_port')) {
            return NextResponse.json({ error: 'Remote port already in use. Please choose a unique remote port for TCP/UDP tunnels.' }, { status: 409 });
        }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
