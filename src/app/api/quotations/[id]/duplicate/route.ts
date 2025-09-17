import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Generate unique quotation number
function generateQuotationNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QUO-${year}${month}${day}-${random}`;
}

// POST /api/quotations/[id]/duplicate - Duplicate quotation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get original quotation with items
    const originalQuotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!originalQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
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
    
    // Create duplicate quotation
    const duplicatedQuotation = await prisma.quotation.create({
      data: {
        quotationNumber: quotationNumber!,
        title: `${originalQuotation.title} (Copy)`,
        clientId: originalQuotation.clientId,
        clientName: originalQuotation.clientName,
        clientEmail: originalQuotation.clientEmail,
        clientPhone: originalQuotation.clientPhone,
        clientAddress: originalQuotation.clientAddress,
        description: originalQuotation.description,
        status: 'draft', // Always start as draft
        validUntil: null, // Reset validity date
        subtotal: originalQuotation.subtotal,
        taxRate: originalQuotation.taxRate,
        taxAmount: originalQuotation.taxAmount,
        discount: originalQuotation.discount,
        total: originalQuotation.total,
        currency: originalQuotation.currency,
        notes: originalQuotation.notes,
        terms: originalQuotation.terms,
        paymentTerms: originalQuotation.paymentTerms,
        leadId: originalQuotation.leadId,
        templateId: originalQuotation.templateId,
        // Reset tracking fields
        sentAt: null,
        viewedAt: null,
        acceptedAt: null,
        rejectedAt: null,
        items: {
          create: originalQuotation.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            category: item.category,
            order: item.order
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
    
    // Track duplicate event on original quotation
    await prisma.quotationAnalytics.create({
      data: {
        quotationId: originalQuotation.id,
        event: 'duplicated',
        metadata: JSON.stringify({
          newQuotationId: duplicatedQuotation.id,
          newQuotationNumber: duplicatedQuotation.quotationNumber
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    }).catch(console.error);
    
    return NextResponse.json({
      message: 'Quotation duplicated successfully',
      quotation: duplicatedQuotation
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate quotation' },
      { status: 500 }
    );
  }
}