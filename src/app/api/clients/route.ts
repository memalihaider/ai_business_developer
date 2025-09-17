import { NextRequest, NextResponse } from 'next/server';
import { clientOperations } from '@/lib/db';
import { checkRateLimit } from '@/lib/db-wrapper';

export const dynamic = 'force-static';

// GET /api/clients - Get all clients or search clients
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 100, 60000)) { // 100 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let clients;
    if (query) {
      clients = await clientOperations.searchClients(query);
    } else {
      clients = await clientOperations.getAllClients();
    }

    // Parse JSON fields for frontend
    const parsedClients = clients.map(client => ({
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : [],
    }));

    return NextResponse.json({ clients: parsedClients }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for creation (stricter)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`create_${clientIP}`, 20, 60000)) { // 20 creates per minute
      return NextResponse.json(
        { error: 'Too many creation requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, address, industry, notes, tags, leadId } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const client = await clientOperations.createClient({
      name,
      email,
      phone,
      company,
      address,
      industry,
      notes,
      tags: tags || [],
      leadId,
    });

    // Parse JSON fields for frontend
    const parsedClient = {
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : [],
    };

    return NextResponse.json({ client: parsedClient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
