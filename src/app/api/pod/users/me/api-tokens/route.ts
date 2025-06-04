
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, type AuthenticatedUser, generateApiTokenString, hashApiToken } from '@/lib/auth';
import { ApiTokenCreateSchema, type ApiTokenDisplay } from '@/lib/schemas'; // RolesConfig removed as not used here yet
import { ZodError } from 'zod';

// POST - Create a new API token for the authenticated user
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired session token' }, { status: 401 });
  }
  const userId = decodedUser.id;

  // TODO: Check user's role/grade here if API tokens are restricted (e.g., RolesConfig.PREMIUM.canCreateApiTokens)
  // For now, all authenticated users can create tokens.

  try {
    const body = await request.json();
    const validationResult = ApiTokenCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { name, expiresAt } = validationResult.data;
    const { rawToken, prefix } = generateApiTokenString();
    const hashedToken = await hashApiToken(rawToken);
    const tokenId = crypto.randomUUID();
    const scopes = JSON.stringify([]); // Empty scopes for now

    db.prepare(
      `INSERT INTO api_tokens (id, user_id, name, token_prefix, token_hash, scopes, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(tokenId, userId, name, prefix, hashedToken, scopes, expiresAt ? expiresAt.toISOString() : null);

    return NextResponse.json({
      message: 'API Token created successfully. Store it securely, you will not see it again.',
      rawToken: rawToken, // IMPORTANT: Only return the raw token ONCE upon creation
      tokenDetails: {
        id: tokenId,
        name,
        prefix,
        // scopes: [], 
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: api_tokens.token_hash')) {
        // Extremely unlikely with UUIDs + random tokens, but good to handle
        return NextResponse.json({ error: 'Token generation conflict, please try again.' }, { status: 500 });
    }
    console.error('Pod Create API Token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List API tokens for the authenticated user
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid session token' }, { status: 401 });
  }
  const sessionToken = authHeader.substring(7);
  const decodedUser = await verifyToken<AuthenticatedUser>(sessionToken);

  if (!decodedUser || !decodedUser.id) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired session token' }, { status: 401 });
  }
  const userId = decodedUser.id;

  try {
    const tokensFromDb = db.prepare(
      'SELECT id, name, token_prefix, scopes, last_used_at, expires_at, created_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as any[];

    const tokens: ApiTokenDisplay[] = tokensFromDb.map(t => ({
        id: t.id,
        name: t.name,
        tokenPrefix: t.token_prefix,
        // scopes: t.scopes ? JSON.parse(t.scopes) : [],
        lastUsedAt: t.last_used_at,
        expiresAt: t.expires_at,
        createdAt: t.created_at,
    }));

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Pod List API Tokens error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
