import { NextRequest, NextResponse } from 'next/server';
import { clientOperations } from '@/lib/db';
import { checkRateLimit } from '@/lib/db-wrapper';

// GET /api/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 200, 60000)) { // 200 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const client = await clientOperations.getClientById(params.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields for frontend
    const parsedClient = {
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : [],
    };

    return NextResponse.json({ client: parsedClient }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 100, 60000)) { // 100 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, address, industry, notes, tags } = body;

    const client = await clientOperations.updateClient(params.id, {
      name,
      email,
      phone,
      company,
      address,
      industry,
      notes,
      tags,
    });

    // Parse JSON fields for frontend
    const parsedClient = {
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : [],
    };

    return NextResponse.json({ client: parsedClient }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating client:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP, 50, 60000)) { // 50 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await clientOperations.deleteClient(params.id);
    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}