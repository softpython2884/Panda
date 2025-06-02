
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain query parameter (domain) is required' }, { status: 400 });
  }

  try {
    const service = db.prepare(
      'SELECT name, local_url, public_url, type FROM services WHERE domain = ?'
    ).get(domain) as { name: string; local_url: string; public_url: string | null; type: string } | undefined;

    if (!service) {
      return NextResponse.json({ error: 'Service not found for the given domain' }, { status: 404 });
    }

    // public_url should always exist due to schema validation, but good to handle defensively
    if (!service.public_url) {
        console.warn(`Service with domain ${domain} is missing a public_url, though it's mandatory.`);
        // Depending on strictness, could return an error or proceed without it for the proxy's local_url usage
    }

    return NextResponse.json({
      name: service.name,
      local_url: service.local_url,
      public_url: service.public_url, 
      type: service.type,
    });

  } catch (error) {
    console.error('Proxy config API error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching service configuration' }, { status: 500 });
  }
}
