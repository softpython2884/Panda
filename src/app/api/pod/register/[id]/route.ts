
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN, PANDA_TUNNEL_MAIN_HOST, FRP_SERVER_ADDR, type FrpServiceInput } from '@/lib/schemas';
import { AuthenticatedUser, verifyToken } from '@/lib/auth';
import { ZodError } from 'zod';

async function authorizeAndGetService(request: NextRequest, serviceId: string) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing or invalid token', status: 401, service: null, userId: null };
  }
  const token = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(token);

  if (!decodedUser || !decodedUser.id) {
    return { error: 'Unauthorized: Invalid or expired token', status: 401, service: null, userId: null };
  }
  const userId = decodedUser.id;

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;

  if (!service) {
    return { error: 'Service not found', status: 404, service: null, userId };
  }

  if (service.user_id !== userId) {
    return { error: 'Forbidden: You do not own this service', status: 403, service: null, userId };
  }
  return { service, userId, error: null, status: 200 };
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId: string = params.id;
  try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error || !authResult.service || !authResult.userId) { 
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
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
        generated_public_url = `${subdomain}.${effectiveBaseDomain} (via STCP/XTCP - voir config client)`;
    } else {
        generated_public_url = `Configuration Incomplete - ${subdomain}.${effectiveBaseDomain}`;
    }
        
    const legacy_local_url_info = `127.0.0.1:${localPort}`;

    if (subdomain !== authResult.service.domain && (frpType === 'http' || frpType === 'https' || frpType === 'stcp' || frpType === 'xtcp')) { 
        const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ? AND id != ?').get(subdomain, serviceId);
        if (existingDomain) {
            return NextResponse.json({ error: 'New subdomain already registered by another service' }, { status: 409 });
        }
    }
    const currentDbRemotePort = authResult.service.remote_port;
    if (remotePort !== currentDbRemotePort && (frpType === 'tcp' || frpType === 'udp') && remotePort) {
        const existingRemotePort = db.prepare('SELECT id FROM services WHERE remote_port = ? AND frp_type IN (?, ?) AND id != ?').get(remotePort, 'tcp', 'udp', serviceId);
        if (existingRemotePort) {
            return NextResponse.json({ error: `New remote port ${remotePort} is already in use for a TCP/UDP tunnel. Please choose another.` }, { status: 409 });
        }
    }

    const dbRemotePort = (frpType === 'tcp' || frpType === 'udp') && remotePort ? remotePort : null;
    const dbUseEncryption = useEncryption === true ? 1 : 0;
    const dbUseCompression = useCompression === true ? 1 : 0;

    db.prepare(
      `UPDATE services 
       SET name = ?, description = ?, local_url = ?, public_url = ?, domain = ?, type = ?, local_port = ?, frp_type = ?, remote_port = ?, use_encryption = ?, use_compression = ?
       WHERE id = ? AND user_id = ?`
    ).run(
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
        dbUseCompression,
        serviceId, 
        authResult.userId
    );
    
    const updatedService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    return NextResponse.json({ message: 'Service updated successfully', service: updatedService });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service update error:', error);
     if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed: services.domain')) {
            return NextResponse.json({ error: 'Subdomain already registered' }, { status: 409 });
        }
        if (error.message.includes('UNIQUE constraint failed: services.remote_port')) {
             return NextResponse.json({ error: 'Remote port already in use' }, { status: 409 });
        }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId: string = params.id;
  try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error || !authResult.userId) { 
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    db.prepare('DELETE FROM services WHERE id = ? AND user_id = ?').run(serviceId, authResult.userId);
    // FRP ne permet pas la suppression dynamique de proxies via une API simple par défaut.
    // Il faudrait un mécanisme de rechargement de la configuration de frps, ou une gestion via l'API admin de frps si activée.
    // Pour l'instant, PANDA supprime juste l'enregistrement.
    return NextResponse.json({ message: 'Service deleted successfully from PANDA. You may need to manually update/restart your Panda Tunnels Server (frps) if it was configured statically.' });

  } catch (error) {
    console.error('Service deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId: string = params.id;
   try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error || !authResult.service) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
     
     const serviceData = authResult.service;
     const responseData: FrpServiceInput = {
        name: serviceData.name,
        description: serviceData.description,
        localPort: Number(serviceData.local_port), 
        subdomain: serviceData.domain, 
        frpType: serviceData.type as FrpServiceInput['frpType'],
        remotePort: serviceData.remote_port === null ? undefined : Number(serviceData.remote_port),
        useEncryption: Boolean(serviceData.use_encryption), // Convert 0/1 from DB to boolean
        useCompression: Boolean(serviceData.use_compression), // Convert 0/1 from DB to boolean
     };
     return NextResponse.json(responseData);
   } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
