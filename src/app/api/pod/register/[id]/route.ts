
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ServiceSchema } from '@/lib/schemas';
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
  const serviceId = params.id;
  try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error || !authResult.service || !authResult.userId) { // Ensure service and userId are present
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const body = await request.json();
    const validationResult = ServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, description, local_url, public_url, domain, type } = validationResult.data;

    if (domain !== authResult.service.domain) {
        const existingDomain = db.prepare('SELECT id FROM services WHERE domain = ? AND id != ?').get(domain, serviceId);
        if (existingDomain) {
            return NextResponse.json({ error: 'New domain already registered by another service' }, { status: 409 });
        }
    }

    db.prepare(
      'UPDATE services SET name = ?, description = ?, local_url = ?, public_url = ?, domain = ?, type = ? WHERE id = ? AND user_id = ?'
    ).run(name, description, local_url, public_url || null, domain, type, serviceId, authResult.userId);
    
    const updatedService = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    return NextResponse.json({ message: 'Service updated successfully', service: updatedService });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Service update error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: services.domain')) {
        return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const serviceId = params.id;
  try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error || !authResult.userId) { // Ensure userId is present
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
  const serviceId = params.id;
   try {
    const authResult = await authorizeAndGetService(request, serviceId);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
     return NextResponse.json(authResult.service);
   } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
