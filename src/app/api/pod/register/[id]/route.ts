
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema, FRP_SERVER_BASE_DOMAIN, frpServiceTypes, PANDA_TUNNEL_MAIN_HOST } from '@/lib/schemas';
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
    
    const { name, description, localPort, subdomain, frpType } = validationResult.data;
    
    let generated_public_url: string;
    if (PANDA_TUNNEL_MAIN_HOST) { // PANDA_TUNNEL_MAIN_HOST is now correctly imported and can be undefined
      generated_public_url = `http://${subdomain}.${PANDA_TUNNEL_MAIN_HOST}`;
    } else {
      // Fallback if PANDA_TUNNEL_MAIN_HOST is not set in environment
      generated_public_url = `http://${subdomain}.${FRP_SERVER_BASE_DOMAIN}`; 
      console.warn(`PANDA_TUNNEL_MAIN_HOST environment variable is not set. Falling back to FRP_SERVER_BASE_DOMAIN for public URL generation: ${generated_public_url}`);
    }
        
    const legacy_local_url_info = `127.0.0.1:${localPort}`;

    if (subdomain !== authResult.service.domain) { 
        const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ? AND id != ?').get(subdomain, serviceId);
        if (existingDomain) {
            return NextResponse.json({ error: 'New subdomain already registered by another service' }, { status: 409 });
        }
    }

    db.prepare(
      `UPDATE services 
       SET name = ?, description = ?, local_url = ?, public_url = ?, domain = ?, type = ?, local_port = ?, frp_type = ?
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
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: services.domain')) {
        return NextResponse.json({ error: 'Subdomain already registered' }, { status: 409 });
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
    return NextResponse.json({ message: 'Service deleted successfully' });

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
     // Ensure the response matches FrpServiceInput for consistency in EditForm
     const responseData: FrpServiceInput = {
        name: serviceData.name,
        description: serviceData.description,
        localPort: serviceData.local_port, // This should be a number
        subdomain: serviceData.domain, 
        frpType: serviceData.type as FrpServiceType, // Cast if 'type' could be broader      
     };
     return NextResponse.json(responseData);
   } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
