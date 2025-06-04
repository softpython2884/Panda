
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser } from '@/lib/auth';
import { UserRoleSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedAdminUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedAdminUser || !decodedAdminUser.id || decodedAdminUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { userId: targetUserId } = params;
  if (!targetUserId) {
    return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = z.object({ role: UserRoleSchema }).safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    const { role: newRole } = validationResult.data;
    
    // Prevent admin from accidentally removing their own admin role via this specific endpoint
    // Or prevent changing role of the primary admin email if defined
    // This logic can be enhanced
    if (targetUserId === decodedAdminUser.id && newRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Admins cannot demote themselves via this endpoint.' }, { status: 403 });
    }


    const result = db.prepare(
      'UPDATE users SET role = ? WHERE id = ?'
    ).run(newRole, targetUserId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'User not found or role unchanged' }, { status: 404 });
    }
    
    const updatedUser = db.prepare('SELECT id, email, username, role FROM users WHERE id = ?').get(targetUserId);
    return NextResponse.json({ message: 'User role updated successfully', user: updatedUser });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    console.error('Pod Admin Update User Role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
