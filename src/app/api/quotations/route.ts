import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for quotation creation
const createQuotationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  description: z.string().optional(),
  validUntil: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadId: z.string().optional(),
  templateId: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    category: z.string().optional(),
  })).default([])
});

// Generate unique quotation number
function generateQuotationNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QUO-${year}${month}${day}-${random}`;
}

// Calculate totals
function calculateTotals(items: any[], taxRate: number, discount: number) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * (taxRate / 100);
  const total = subtotalAfterDiscount + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// GET /api/quotations - List all quotations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { quotationNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          client: true,
          items: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quotation.count({ where })
    ]);
    
    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

// POST /api/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createQuotationSchema.parse(body);
    
    // Generate unique quotation number
    let quotationNumber;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      quotationNumber = generateQuotationNumber();
      const existing = await prisma.quotation.findUnique({
        where: { quotationNumber }
      });
      if (!existing) isUnique = true;
      attempts++;
    }
    
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique quotation number' },
        { status: 500 }
      );
    }
    
    // Calculate totals
    const { subtotal, taxAmount, total } = calculateTotals(
      validatedData.items,
      validatedData.taxRate,
      validatedData.discount
    );
    
    // Create quotation with items
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: quotationNumber!,
        title: validatedData.title,
        clientId: validatedData.clientId,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientPhone: validatedData.clientPhone,
        clientAddress: validatedData.clientAddress,
        description: validatedData.description,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        subtotal,
        taxRate: validatedData.taxRate,
        taxAmount,
        discount: validatedData.discount,
        total,
        currency: validatedData.currency,
        notes: validatedData.notes,
        terms: validatedData.terms,
        paymentTerms: validatedData.paymentTerms,
        leadId: validatedData.leadId,
        templateId: validatedData.templateId,
        items: {
          create: validatedData.items.map((item, index) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice * 100) / 100,
            category: item.category,
            order: index
          }))
        }
      },
      include: {
        client: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}