
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    // Return all services or some paginated default if no query?
    // For now, let's require a query term, or return empty.
    // Or, perhaps a featured list or recent. For simplicity, require 'q'.
    // const allServices = db.prepare('SELECT id, name, description, public_url, domain, type FROM services ORDER BY created_at DESC LIMIT 20').all();
    // return NextResponse.json(allServices);
    return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 });
  }

  try {
    const searchTerm = `%${query}%`;
    // Search in name, description, domain, type
    const services = db.prepare(
      `SELECT id, name, description, public_url, domain, type 
       FROM services 
       WHERE name LIKE ? OR description LIKE ? OR domain LIKE ? OR type LIKE ?
       ORDER BY created_at DESC`
    ).all(searchTerm, searchTerm, searchTerm, searchTerm);

    return NextResponse.json(services);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
