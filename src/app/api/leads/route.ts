import { NextRequest, NextResponse } from 'next/server';
import { leadOperations } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sanitizeInput, validateRequired, checkRateLimit } from '@/lib/db-wrapper';

// GET /api/leads - Get all leads or search leads
export async function GET(request: NextRequest) {
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
    if (!checkRateLimit(`leads-get-${clientIP}`, 60, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let leads;
    if (query) {
      // Sanitize search query to prevent XSS
      const sanitizedQuery = sanitizeInput(query);
      if (sanitizedQuery.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Search query too long' },
          { status: 400 }
        );
      }
      leads = await leadOperations.searchLeads(sanitizedQuery);
    } else {
      leads = await leadOperations.getAllLeads();
    }

    return NextResponse.json({ success: true, leads }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
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
    if (!checkRateLimit(`leads-post-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, value, status, owner, priority, notes } = body;

    // Validate required fields
    try {
      validateRequired(name, 'Name');
      validateRequired(email, 'Email');
    } catch (validationError: any) {
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const sanitizedData = {
      name: sanitizeInput(name).substring(0, 100),
      email: sanitizeInput(email).toLowerCase().substring(0, 255),
      phone: phone ? sanitizeInput(phone).substring(0, 20) : undefined,
      company: company ? sanitizeInput(company).substring(0, 100) : undefined,
      value: value ? sanitizeInput(value).substring(0, 50) : undefined,
      status: status ? sanitizeInput(status).substring(0, 50) : undefined,
      owner: owner ? sanitizeInput(owner).substring(0, 100) : undefined,
      priority: priority ? sanitizeInput(priority).substring(0, 20) : undefined,
      notes: notes ? sanitizeInput(notes).substring(0, 1000) : undefined,
    };

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const lead = await leadOperations.createLead(sanitizedData);

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A lead with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}