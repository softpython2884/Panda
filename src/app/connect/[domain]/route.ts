
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface ConnectParams {
  params: {
    domain: string;
  };
}

export async function GET(request: NextRequest, { params }: ConnectParams) {
  const { domain } = params;

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is missing in the path.' }, { status: 400 });
  }

  try {
    const service = db.prepare(
      'SELECT public_url FROM services WHERE domain = ?'
    ).get(domain) as { public_url: string | null } | undefined;

    if (!service || !service.public_url) {
      // The schema now mandates public_url, so this case implies data inconsistency or service not found.
      return new NextResponse(
        `Service with domain "${domain}" not found or has no configured public URL.`, 
        { status: 404 }
      );
    }

    // Perform a temporary redirect (307) to the public_url
    return NextResponse.redirect(service.public_url, { status: 307 });

  } catch (error) {
    console.error(`Error handling /connect/${domain}:`, error);
    return new NextResponse(
      'An error occurred while trying to connect to the service.',
      { status: 500 }
    );
  }
}
