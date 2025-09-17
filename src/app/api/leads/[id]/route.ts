import { NextRequest, NextResponse } from 'next/server';
import { leadOperations } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sanitizeInput, validateRequired, checkRateLimit } from '@/lib/db-wrapper';

// GET /api/leads/[id] - Get a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`lead-get-${clientIP}`, 100, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID parameter
    if (!params.id || typeof params.id !== 'string' || params.id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    const lead = await leadOperations.getLeadById(params.id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`lead-put-${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID parameter
    if (!params.id || typeof params.id !== 'string' || params.id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, value, status, owner, priority, notes } = body;

    // Sanitize and validate inputs
    const sanitizedData: any = {};
    if (name !== undefined) {
      sanitizedData.name = sanitizeInput(name).substring(0, 100);
    }
    if (email !== undefined) {
      const sanitizedEmail = sanitizeInput(email).toLowerCase().substring(0, 255);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      sanitizedData.email = sanitizedEmail;
    }
    if (phone !== undefined) {
      sanitizedData.phone = phone ? sanitizeInput(phone).substring(0, 20) : null;
    }
    if (company !== undefined) {
      sanitizedData.company = company ? sanitizeInput(company).substring(0, 100) : null;
    }
    if (value !== undefined) {
      sanitizedData.value = value ? sanitizeInput(value).substring(0, 50) : null;
    }
    if (status !== undefined) {
      sanitizedData.status = status ? sanitizeInput(status).substring(0, 50) : null;
    }
    if (owner !== undefined) {
      sanitizedData.owner = owner ? sanitizeInput(owner).substring(0, 100) : null;
    }
    if (priority !== undefined) {
      sanitizedData.priority = priority ? sanitizeInput(priority).substring(0, 20) : null;
    }
    if (notes !== undefined) {
      sanitizedData.notes = notes ? sanitizeInput(notes).substring(0, 1000) : null;
    }

    const lead = await leadOperations.updateLead(params.id, sanitizedData);

    return NextResponse.json({ success: true, lead }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A lead with this email already exists' },
        { status: 409 }
      );
    }

    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`lead-delete-${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID parameter
    if (!params.id || typeof params.id !== 'string' || params.id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    await leadOperations.deleteLead(params.id);
    return NextResponse.json({ success: true, message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}