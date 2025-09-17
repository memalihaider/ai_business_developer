import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// Payment method types - Updated for Pakistani payment methods
type PaymentMethod = 'google_pay' | 'bank_transfer' | 'jazzcash' | 'payoneer' | 'nayapay' | 'meezab_bank' | 'easypaisa' | string; // string for custom methods

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  invoiceId?: string;
  metadata?: Record<string, string>;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  error?: string;
  status?: string;
}

// GET /api/payments - Retrieve payment history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    if (status) where.status = status;
    if (customerEmail) where.customerEmail = customerEmail;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientName: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Process a new payment
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const {
      amount,
      currency = 'PKR', // Default to Pakistani Rupee
      paymentMethod,
      description,
      customerEmail,
      customerName,
      invoiceId,
      metadata = {},
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Generate a mock payment ID for Pakistani payment methods
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock payment processing based on payment method
    let paymentStatus = 'pending';
    let processingMessage = '';
    
    switch (paymentMethod) {
      case 'google_pay':
        processingMessage = 'Processing Google Pay payment...';
        paymentStatus = 'completed'; // Google Pay typically processes instantly
        break;
      case 'bank_transfer':
      case 'meezab_bank':
        processingMessage = 'Bank transfer initiated. Please complete the transfer using your banking app.';
        paymentStatus = 'pending';
        break;
      case 'jazzcash':
        processingMessage = 'JazzCash payment initiated. Please complete on your mobile.';
        paymentStatus = 'pending';
        break;
      case 'payoneer':
        processingMessage = 'Payoneer payment processing...';
        paymentStatus = 'completed';
        break;
      case 'nayapay':
        processingMessage = 'NayaPay payment initiated. Please complete in the NayaPay app.';
        paymentStatus = 'pending';
        break;
      case 'easypaisa':
        processingMessage = 'Easy Paisa payment initiated. Please complete on your mobile.';
        paymentStatus = 'pending';
        break;
      default:
        // Handle custom payment methods
        processingMessage = `${paymentMethod} payment initiated. Please follow the payment instructions.`;
        paymentStatus = 'pending';
    }

    // Save payment record to database
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency.toUpperCase(),
        status: paymentStatus,
        paymentMethod,
        description,
        customerEmail,
        customerName,
        invoiceId,
        metadata: JSON.stringify({
          ...metadata,
          processingMessage,
          mockPaymentId: paymentId
        }),
      },
    });

    const response: PaymentResponse = {
      success: true,
      paymentId: payment.id,
      status: paymentStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing payment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Update payment in database
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // If payment is successful, update related invoice
    if (status === 'succeeded' && payment.invoiceId) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - Cancel payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status to canceled
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'canceled',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error canceling payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel payment' },
      { status: 500 }
    );
  }
}
