import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/quotations/[id]/send - Send quotation to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true
      }
    });
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Validate quotation has required data
    if (!quotation.clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required to send quotation' },
        { status: 400 }
      );
    }
    
    if (quotation.items.length === 0) {
      return NextResponse.json(
        { error: 'Quotation must have at least one item' },
        { status: 400 }
      );
    }
    
    // Update quotation status and sent timestamp
    const updatedQuotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        sentAt: new Date()
      },
      include: {
        client: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    // Track send event
    await prisma.quotationAnalytics.create({
      data: {
        quotationId: quotation.id,
        event: 'sent',
        metadata: JSON.stringify({
          clientEmail: quotation.clientEmail,
          sentAt: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    }).catch(console.error);
    
    // TODO: Implement actual email sending logic here
    // This could integrate with services like SendGrid, Mailgun, etc.
    
    return NextResponse.json({
      message: 'Quotation sent successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error sending quotation:', error);
    return NextResponse.json(
      { error: 'Failed to send quotation' },
      { status: 500 }
    );
  }
}