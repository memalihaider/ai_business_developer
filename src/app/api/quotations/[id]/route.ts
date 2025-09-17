import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for quotation updates
const updateQuotationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  clientId: z.string().min(1, 'Client ID is required').optional(),
  clientName: z.string().min(1, 'Client name is required').optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  validUntil: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadId: z.string().optional(),
  templateId: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(), // For existing items
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    category: z.string().optional(),
  })).optional()
});

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

// GET /api/quotations/[id] - Get single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lead: true,
        template: true,
        items: {
          orderBy: { order: 'asc' }
        },
        analytics: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Track view event
    await prisma.quotationAnalytics.create({
      data: {
        quotationId: quotation.id,
        event: 'viewed',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    }).catch(console.error); // Don't fail if analytics fails
    
    // Update viewedAt if not already set
    if (!quotation.viewedAt) {
      await prisma.quotation.update({
        where: { id: params.id },
        data: { viewedAt: new Date() }
      }).catch(console.error);
    }
    
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

// PUT /api/quotations/[id] - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateQuotationSchema.parse(body);
    
    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { items: true }
    });
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Handle validUntil date conversion
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil);
    }
    
    // Handle items update if provided
    if (validatedData.items) {
      const items = validatedData.items;
      const taxRate = validatedData.taxRate ?? existingQuotation.taxRate;
      const discount = validatedData.discount ?? existingQuotation.discount;
      
      // Calculate new totals
      const { subtotal, taxAmount, total } = calculateTotals(items, taxRate, discount);
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      
      // Delete existing items and create new ones
      await prisma.quotationItem.deleteMany({
        where: { quotationId: params.id }
      });
      
      updateData.items = {
        create: items.map((item, index) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(item.quantity * item.unitPrice * 100) / 100,
          category: item.category,
          order: index
        }))
      };
    } else if (validatedData.taxRate !== undefined || validatedData.discount !== undefined) {
      // Recalculate totals if tax rate or discount changed
      const items = existingQuotation.items;
      const taxRate = validatedData.taxRate ?? existingQuotation.taxRate;
      const discount = validatedData.discount ?? existingQuotation.discount;
      
      const { subtotal, taxAmount, total } = calculateTotals(items, taxRate, discount);
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }
    
    // Remove items from updateData if not updating them
    if (!validatedData.items) {
      delete updateData.items;
    }
    
    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        lead: true,
        template: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update quotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id] - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id }
    });
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Delete quotation (items and analytics will be deleted due to cascade)
    await prisma.quotation.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Quotation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}