import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// POST /api/payments/webhook - Handle Pakistani payment method webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, paymentMethod, transactionId } = body;

    // Validate required fields
    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle different payment status updates
    switch (status) {
      case 'completed':
      case 'succeeded':
        await handlePaymentSucceeded(paymentId, transactionId);
        break;

      case 'failed':
        await handlePaymentFailed(paymentId);
        break;

      case 'canceled':
      case 'cancelled':
        await handlePaymentCanceled(paymentId);
        break;

      case 'processing':
      case 'pending':
        await handlePaymentProcessing(paymentId);
        break;

      case 'requires_action':
        await handlePaymentRequiresAction(paymentId);
        break;

      default:
        console.log(`Unhandled payment status: ${status}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentId: string, transactionId?: string) {
  try {
    console.log('Payment succeeded:', paymentId);

    // Update payment status in database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'succeeded',
          paidAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...payment.metadata,
            transactionId: transactionId || 'completed',
          },
        },
      });

      // Update related invoice if exists
      if (payment.invoiceId) {
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(payment.id);
      }

      // Log activity
      await logPaymentActivity({
        paymentId: payment.id,
        action: 'payment_succeeded',
        details: `Payment of ${payment.currency} ${payment.amount} completed successfully`,
        metadata: {
            transactionId: transactionId || 'completed',
            paymentMethod: payment.paymentMethod,
          },
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentId: string) {
  try {
    console.log('Payment failed:', paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: 'Payment processing failed',
          updatedAt: new Date(),
        },
      });

      // Send payment failure notification
      await sendPaymentFailureEmail(payment.id);

      // Log activity
      await logPaymentActivity({
        paymentId: payment.id,
        action: 'payment_failed',
        details: 'Payment processing failed',
        metadata: {
          paymentMethod: payment.paymentMethod,
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentId: string) {
  try {
    console.log('Payment canceled:', paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'canceled',
          updatedAt: new Date(),
        },
      });

      // Log activity
      await logPaymentActivity({
        paymentId: payment.id,
        action: 'payment_canceled',
        details: 'Payment was canceled',
        metadata: {
          paymentMethod: payment.paymentMethod,
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}

// Handle payment processing
async function handlePaymentProcessing(paymentId: string) {
  try {
    console.log('Payment processing:', paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'processing',
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment processing:', error);
  }
}

// Handle payment requires action
async function handlePaymentRequiresAction(paymentId: string) {
  try {
    console.log('Payment requires action:', paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'requires_action',
          updatedAt: new Date(),
        },
      });

      // Send action required notification
      await sendActionRequiredEmail(payment.id);

      // Log activity
      await logPaymentActivity({
        paymentId: payment.id,
        action: 'payment_requires_action',
        details: 'Payment requires additional action from customer',
        metadata: {
          paymentMethod: payment.paymentMethod,
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment requires action:', error);
  }
}



// Helper functions
async function sendPaymentConfirmationEmail(paymentId: string) {
  // Implementation for sending payment confirmation email
  console.log('Sending payment confirmation email for payment:', paymentId);
}

async function sendPaymentFailureEmail(paymentId: string) {
  // Implementation for sending payment failure email
  console.log('Sending payment failure email for payment:', paymentId);
}

async function sendActionRequiredEmail(paymentId: string) {
  // Implementation for sending action required email
  console.log('Sending action required email for payment:', paymentId);
}



async function logPaymentActivity(activity: {
  paymentId: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.paymentActivity.create({
      data: {
        paymentId: activity.paymentId,
        action: activity.action,
        details: activity.details,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error logging payment activity:', error);
  }
}
