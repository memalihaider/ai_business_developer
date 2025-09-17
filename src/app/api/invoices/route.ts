import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiService } from '@/lib/ai-service';

const prisma = new PrismaClient();

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

interface InvoiceRequest {
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  templateId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

// GET /api/invoices - Retrieve invoices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const clientEmail = searchParams.get('clientEmail');
    const clientName = searchParams.get('clientName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (clientEmail) {
      where.clientEmail = {
        contains: clientEmail,
        mode: 'insensitive',
      };
    }
    
    if (clientName) {
      where.clientName = {
        contains: clientName,
        mode: 'insensitive',
      };
    }
    
    if (search) {
      where.OR = [
        {
          clientName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          clientEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          invoiceNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          notes: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              currency: true,
              paymentMethod: true,
              transactionId: true,
              cardLast4: true,
              cardBrand: true,
              processedAt: true,
              createdAt: true,
              updatedAt: true
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate analytics
    const analytics = await calculateInvoiceAnalytics(where);

    return NextResponse.json({
      success: true,
      invoices,
      analytics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body: InvoiceRequest = await request.json();
    const {
      clientName,
      clientEmail,
      clientAddress,
      clientPhone,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      currency = 'USD',
      dueDate,
      notes,
      terms,
      templateId,
      isRecurring = false,
      recurringInterval,
    } = body;

    // Validate required fields
    if (!clientName || !clientEmail || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientName, clientEmail, items' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress,
        clientPhone,
        subtotal,
        taxAmount,
        totalAmount,
        currency: currency.toUpperCase(),
        dueDate,
        description: notes,
        terms,
        status: 'draft',
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            rate: item.rate || item.unitPrice || 0,
            amount: item.amount || ((item.quantity || 1) * (item.rate || item.unitPrice || 0)),
          }))
        }
      },
    });

    // If AI-powered, enhance invoice with smart suggestions
    if (templateId === 'ai-powered') {
      try {
        await enhanceInvoiceWithAI(invoice.id, {
          clientName,
          clientEmail,
          items,
          industry: extractIndustryFromItems(items),
        });
      } catch (error) {
        console.error('AI enhancement failed, continuing without it:', error);
      }
    }

    // Invoice activity logging temporarily disabled

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update an existing invoice
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Prevent updating paid invoices
    if (existingInvoice.status === 'paid' && updateData.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify paid invoices' },
        { status: 400 }
      );
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        items: updateData.items ? JSON.stringify(updateData.items) : undefined,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        updatedAt: new Date(),
      },
    });

    // Invoice activity logging temporarily disabled

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Prevent deleting invoices with payments
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete invoices with associated payments' },
        { status: 400 }
      );
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id },
    });

    // Invoice activity logging temporarily disabled

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the highest invoice number for this month to avoid duplicates
  const prefix = `INV-${year}${month}-`;
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    select: {
      invoiceNumber: true,
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    take: 1,
  });
  
  let sequence = 1;
  if (existingInvoices.length > 0) {
    const lastInvoiceNumber = existingInvoices[0].invoiceNumber;
    const lastSequence = parseInt(lastInvoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

async function calculateInvoiceAnalytics(where: any) {
  const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.count({ where: { ...where, status: 'paid' } }),
    prisma.invoice.count({ where: { ...where, status: 'sent' } }),
    prisma.invoice.count({
      where: {
        ...where,
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: new Date().toISOString().split('T')[0] },
      },
    }),
  ]);

  const totalRevenue = await prisma.invoice.aggregate({
    where: { ...where, status: 'paid' },
    _sum: { totalAmount: true },
  });

  const pendingRevenue = await prisma.invoice.aggregate({
    where: { ...where, status: { in: ['sent', 'draft'] } },
    _sum: { totalAmount: true },
  });

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    pendingRevenue: pendingRevenue._sum.totalAmount || 0,
    paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
  };
}

async function enhanceInvoiceWithAI(invoiceId: string, context: any) {
  try {
    const prompt = `
      Enhance this invoice with smart suggestions based on the context:
      Client: ${context.clientName} (${context.clientEmail})
      Industry: ${context.industry}
      Items: ${JSON.stringify(context.items)}
      
      Provide suggestions for:
      1. Payment terms optimization
      2. Additional services that might be relevant
      3. Professional notes or terms
      4. Discount opportunities
      
      Return as JSON with keys: paymentTerms, suggestedServices, notes, discountOpportunities
    `;

    const aiResponse = await aiService.generateContent(prompt);
    const suggestions = JSON.parse(aiResponse);

    // Update invoice with AI suggestions
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        aiSuggestions: JSON.stringify(suggestions),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error enhancing invoice with AI:', error);
  }
}

function extractIndustryFromItems(items: InvoiceItem[]): string {
  // Simple industry detection based on item descriptions
  const descriptions = items.map(item => item.description.toLowerCase()).join(' ');
  
  if (descriptions.includes('web') || descriptions.includes('website') || descriptions.includes('development')) {
    return 'Web Development';
  }
  if (descriptions.includes('design') || descriptions.includes('graphic') || descriptions.includes('logo')) {
    return 'Design';
  }
  if (descriptions.includes('marketing') || descriptions.includes('seo') || descriptions.includes('advertising')) {
    return 'Marketing';
  }
  if (descriptions.includes('consulting') || descriptions.includes('strategy') || descriptions.includes('advice')) {
    return 'Consulting';
  }
  
  return 'General Services';
}

// Invoice activity logging temporarily disabled - InvoiceActivity model not found in schema