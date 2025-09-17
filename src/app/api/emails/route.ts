import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailRequest {
  type: 'invoice' | 'payment_confirmation' | 'payment_reminder' | 'custom';
  to: string | string[];
  subject?: string;
  templateId?: string;
  data: {
    invoiceId?: string;
    paymentId?: string;
    clientName?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    customContent?: string;
    [key: string]: any;
  };
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
  trackReads?: boolean;
  scheduleAt?: string;
}

// POST /api/emails - Send email
export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { type, to, subject, templateId, data, attachments, trackReads = true, scheduleAt } = body;

    if (!type || !to) {
      return NextResponse.json(
        { success: false, error: 'Email type and recipient are required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const recipients = Array.isArray(to) ? to : [to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate email content based on type
    let emailContent: { html: string; text: string; subject: string };
    
    switch (type) {
      case 'invoice':
        emailContent = await generateInvoiceEmail(data);
        break;
      case 'payment_confirmation':
        emailContent = await generatePaymentConfirmationEmail(data);
        break;
      case 'payment_reminder':
        emailContent = await generatePaymentReminderEmail(data);
        break;
      case 'custom':
        emailContent = await generateCustomEmail(data, templateId);
        break;
      default:
        throw new Error('Unsupported email type');
    }

    // Override subject if provided
    if (subject) {
      emailContent.subject = subject;
    }

    // For demo purposes, simulate email sending
    const emailResults = recipients.map(recipient => ({
      recipient,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
    }));

    // Log email activity
    for (const result of emailResults) {
      await logEmailActivity({
        type,
        recipient: result.recipient,
        subject: emailContent.subject,
        status: 'sent',
        messageId: result.messageId,
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${emailResults.length} recipients`,
      results: {
        successful: emailResults,
        failed: [],
        total: recipients.length,
      },
      emailContent: {
        subject: emailContent.subject,
        preview: emailContent.text.substring(0, 200) + '...',
      },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET /api/emails - Get email history and templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const recipient = searchParams.get('recipient');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Simulate email history for demo
    const mockEmails = [
      {
        id: '1',
        type: 'invoice',
        recipient: 'client@example.com',
        subject: 'Invoice INV-001 from Business Developer',
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        opened: true,
        openedAt: new Date(Date.now() - 82800000).toISOString(),
      },
      {
        id: '2',
        type: 'payment_confirmation',
        recipient: 'customer@example.com',
        subject: 'Payment Confirmation - USD 1,250.00',
        status: 'sent',
        sentAt: new Date(Date.now() - 172800000).toISOString(),
        opened: true,
        openedAt: new Date(Date.now() - 172000000).toISOString(),
      },
      {
        id: '3',
        type: 'payment_reminder',
        recipient: 'overdue@example.com',
        subject: 'Payment Reminder - Invoice INV-002',
        status: 'sent',
        sentAt: new Date(Date.now() - 259200000).toISOString(),
        opened: false,
        openedAt: null,
      },
    ];

    // Filter emails based on query parameters
    let filteredEmails = mockEmails;
    if (type) filteredEmails = filteredEmails.filter(email => email.type === type);
    if (recipient) filteredEmails = filteredEmails.filter(email => email.recipient.includes(recipient));
    if (status) filteredEmails = filteredEmails.filter(email => email.status === status);

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedEmails = filteredEmails.slice(startIndex, startIndex + limit);

    // Mock email templates
    const templates = [
      {
        id: 'template_1',
        name: 'Professional Invoice',
        type: 'invoice',
        subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
        description: 'Clean, professional invoice template',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template_2',
        name: 'Payment Thank You',
        type: 'payment_confirmation',
        subject: 'Thank you for your payment - {{amount}}',
        description: 'Friendly payment confirmation template',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template_3',
        name: 'Gentle Reminder',
        type: 'payment_reminder',
        subject: 'Friendly Payment Reminder - {{invoiceNumber}}',
        description: 'Polite payment reminder template',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        emails: paginatedEmails,
        templates,
        pagination: {
          page,
          limit,
          total: filteredEmails.length,
          pages: Math.ceil(filteredEmails.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// Generate invoice email content
async function generateInvoiceEmail(data: any): Promise<{ html: string; text: string; subject: string }> {
  const clientName = data.clientName || 'Valued Client';
  const invoiceNumber = data.invoiceNumber || 'INV-' + Date.now();
  const amount = data.amount || 0;
  const currency = data.currency || 'USD';
  const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const companyName = process.env.COMPANY_NAME || 'Business Developer';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${companyName}</h1>
        <p style="color: #6b7280; margin: 5px 0;">Professional Invoice</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin: 0 0 15px 0;">Invoice ${invoiceNumber}</h2>
        <p style="margin: 5px 0;"><strong>To:</strong> ${clientName}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <p>Dear ${clientName},</p>
        <p>We hope this email finds you well. Please find your invoice attached for the services provided.</p>
        <p>Payment is due by ${new Date(dueDate).toLocaleDateString()}. You can pay online using the link below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Invoice</a>
        </div>
        
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        <p>Thank you for your business!</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Best regards,<br>${companyName}</p>
      </div>
    </div>
  `;

  const text = `
Dear ${clientName},

We hope this email finds you well. Please find your invoice ${invoiceNumber} for ${currency} ${amount.toLocaleString()}.

Due Date: ${new Date(dueDate).toLocaleDateString()}

Payment is due by the date specified above. You can pay online or contact us for alternative payment methods.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
${companyName}
  `;

  return {
    html,
    text,
    subject: `Invoice ${invoiceNumber} from ${companyName}`,
  };
}

// Generate payment confirmation email content
async function generatePaymentConfirmationEmail(data: any): Promise<{ html: string; text: string; subject: string }> {
  const clientName = data.clientName || 'Valued Client';
  const amount = data.amount || 0;
  const currency = data.currency || 'USD';
  const paymentMethod = data.paymentMethod || 'Credit Card';
  const transactionId = data.transactionId || 'TXN-' + Date.now();
  const companyName = process.env.COMPANY_NAME || 'Business Developer';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">✓</div>
        <h1 style="color: #1f2937; margin: 0;">Payment Confirmed!</h1>
        <p style="color: #6b7280; margin: 5px 0;">Thank you for your payment</p>
      </div>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #166534; margin: 0 0 15px 0;">Payment Details</h2>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <p>Dear ${clientName},</p>
        <p>Thank you for your payment! We have successfully received your payment of ${currency} ${amount.toLocaleString()}.</p>
        <p>Your payment has been processed and your account has been updated accordingly. You should see the transaction reflected in your account within 1-2 business days.</p>
        <p>If you have any questions about this payment, please don't hesitate to contact us.</p>
        <p>We appreciate your business!</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Best regards,<br>${companyName}</p>
      </div>
    </div>
  `;

  const text = `
Dear ${clientName},

Thank you for your payment! We have successfully received your payment of ${currency} ${amount.toLocaleString()}.

Payment Details:
- Amount: ${currency} ${amount.toLocaleString()}
- Payment Method: ${paymentMethod}
- Transaction ID: ${transactionId}
- Date: ${new Date().toLocaleDateString()}

Your payment has been processed and your account has been updated accordingly.

Thank you for your business!

Best regards,
${companyName}
  `;

  return {
    html,
    text,
    subject: `Payment Confirmation - ${currency} ${amount.toLocaleString()}`,
  };
}

// Generate payment reminder email content
async function generatePaymentReminderEmail(data: any): Promise<{ html: string; text: string; subject: string }> {
  const clientName = data.clientName || 'Valued Client';
  const invoiceNumber = data.invoiceNumber || 'INV-' + Date.now();
  const amount = data.amount || 0;
  const currency = data.currency || 'USD';
  const dueDate = data.dueDate || new Date();
  const daysPastDue = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  const companyName = process.env.COMPANY_NAME || 'Business Developer';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #f59e0b; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">!</div>
        <h1 style="color: #1f2937; margin: 0;">Payment Reminder</h1>
        <p style="color: #6b7280; margin: 5px 0;">Invoice ${invoiceNumber}</p>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin: 0 0 15px 0;">Payment Details</h2>
        <p style="margin: 5px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${currency} ${amount.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${daysPastDue > 0 ? `${daysPastDue} days overdue` : 'Due soon'}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <p>Dear ${clientName},</p>
        <p>This is a friendly reminder that your invoice ${invoiceNumber} for ${currency} ${amount.toLocaleString()} is ${daysPastDue > 0 ? `${daysPastDue} days overdue` : 'due soon'}.</p>
        <p>To avoid any late fees or service interruptions, please make your payment as soon as possible.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
        </div>
        
        <p>If you have already made this payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us.</p>
        <p>Thank you for your prompt attention to this matter.</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Best regards,<br>${companyName}</p>
      </div>
    </div>
  `;

  const text = `
Dear ${clientName},

This is a friendly reminder that your invoice ${invoiceNumber} for ${currency} ${amount.toLocaleString()} is ${daysPastDue > 0 ? `${daysPastDue} days overdue` : 'due soon'}.

Original Due Date: ${new Date(dueDate).toLocaleDateString()}

To avoid any late fees or service interruptions, please make your payment as soon as possible.

If you have already made this payment, please disregard this notice.

Thank you for your prompt attention to this matter.

Best regards,
${companyName}
  `;

  return {
    html,
    text,
    subject: `Payment Reminder - Invoice ${invoiceNumber}`,
  };
}

// Generate custom email content
async function generateCustomEmail(data: any, templateId?: string): Promise<{ html: string; text: string; subject: string }> {
  const clientName = data.clientName || 'Valued Client';
  const companyName = process.env.COMPANY_NAME || 'Business Developer';
  const customContent = data.customContent || 'Thank you for your business!';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${companyName}</h1>
      </div>
      
      <div style="margin: 30px 0;">
        <p>Dear ${clientName},</p>
        <div style="margin: 20px 0; line-height: 1.6;">
          ${customContent}
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Best regards,<br>${companyName}</p>
      </div>
    </div>
  `;

  const text = `
Dear ${clientName},

${customContent}

If you have any questions, please don't hesitate to contact us.

Best regards,
${companyName}
  `;

  return {
    html,
    text,
    subject: data.subject || `Message from ${companyName}`,
  };
}

// Log email activity
async function logEmailActivity(data: {
  type: string;
  recipient: string;
  subject: string;
  status: string;
  messageId?: string;
  error?: string;
  invoiceId?: string;
  paymentId?: string;
}) {
  try {
    // For demo purposes, just log to console
    console.log('Email Activity:', {
      type: data.type,
      recipient: data.recipient,
      subject: data.subject,
      status: data.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging email activity:', error);
  }
}