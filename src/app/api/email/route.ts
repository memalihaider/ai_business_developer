import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '@/lib/email'

const prisma = new PrismaClient()

// Send invoice email
export async function POST(request: NextRequest) {
  try {
    const { invoiceId, recipientEmail, subject, customMessage } = await request.json()

    if (!invoiceId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Invoice ID and recipient email are required' },
        { status: 400 }
      )
    }

    // Get invoice data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Generate email content
    const emailContent = generateInvoiceEmailContent(invoice, customMessage)
    
    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    
    // Send email
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: subject || `Invoice #${invoice.invoiceNumber} from Your Company`,
      html: emailContent,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: generateInvoicePDF(invoice)
        }
      ]
    })

    if (emailResult.success) {
      // Log email activity
      await prisma.emailLog.create({
        data: {
          invoiceId: invoice.id,
          recipientEmail,
          subject: subject || `Invoice #${invoice.invoiceNumber} from Your Company`,
          status: 'sent',
          sentAt: new Date()
        }
      }).catch(err => console.log('Email log creation failed:', err)) // Non-blocking

      return NextResponse.json({
        success: true,
        message: 'Invoice email sent successfully',
        emailId: emailResult.emailId
      })
    } else {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Email sending failed' },
      { status: 500 }
    )
  }
}

// Send general email (for email management)
export async function PUT(request: NextRequest) {
  try {
    const { 
      emailType, 
      templateId, 
      recipientEmail, 
      subject, 
      customContent,
      scheduleDate 
    } = await request.json()

    if (!recipientEmail || !subject) {
      return NextResponse.json(
        { error: 'Recipient email and subject are required' },
        { status: 400 }
      )
    }

    let emailContent = customContent || ''
    
    // If template is specified, load template content
    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      }).catch(() => null)
      
      if (template) {
        emailContent = template.content + '\n\n' + (customContent || '')
      }
    }

    // Handle scheduled emails
    if (scheduleDate) {
      const scheduledDate = new Date(scheduleDate)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled date must be in the future' },
          { status: 400 }
        )
      }

      // In a real app, you would use a job queue like Bull, Agenda, or similar
      // For now, we'll just store it as a scheduled email
      const scheduledEmail = await prisma.scheduledEmail.create({
        data: {
          emailType: emailType || 'general',
          recipientEmail,
          subject,
          content: emailContent,
          scheduledFor: scheduledDate,
          status: 'scheduled'
        }
      }).catch(err => {
        console.log('Scheduled email creation failed:', err)
        return null
      })

      return NextResponse.json({
        success: true,
        message: 'Email scheduled successfully',
        scheduledEmailId: scheduledEmail?.id
      })
    }

    // Send immediate email
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      html: emailContent
    })

    if (emailResult.success) {
      // Log email activity
      await prisma.emailLog.create({
        data: {
          recipientEmail,
          subject,
          status: 'sent',
          sentAt: new Date(),
          emailType: emailType || 'general'
        }
      }).catch(err => console.log('Email log creation failed:', err))

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: emailResult.messageId
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Email sending failed' },
      { status: 500 }
    )
  }
}

// Get email templates
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    }).catch(() => [])

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateInvoiceEmailContent(invoice: any, customMessage?: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Invoice #${invoice.invoiceNumber}</h2>
          
          <p>Dear ${invoice.clientName},</p>
          
          ${customMessage ? `<p>${customMessage}</p>` : ''}
          
          <p>Please find attached your invoice with the following details:</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
            <p><strong>Total Amount:</strong> $${invoice.totalAmount}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
          </div>
          
          <h3>Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #e5e7eb;">
                <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Description</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Quantity</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Rate</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #d1d5db;">${item.description}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">$${item.rate}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">$${item.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 20px 0;">
            <p><strong>Subtotal: $${invoice.subtotal}</strong></p>
            <p><strong>Tax: $${invoice.taxAmount}</strong></p>
            <p style="font-size: 18px; color: #2563eb;"><strong>Total: $${invoice.totalAmount}</strong></p>
          </div>
          
          ${invoice.terms ? `<p><strong>Terms:</strong> ${invoice.terms}</p>` : ''}
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br>Your Company Name</p>
        </div>
      </body>
    </html>
  `
}

function generateInvoicePDF(invoice: any): Buffer {
  // Simplified PDF generation - in real app, use jsPDF or similar
  const content = `
INVOICE #${invoice.invoiceNumber}

Client: ${invoice.clientName}
Email: ${invoice.clientEmail}
Address: ${invoice.clientAddress || 'N/A'}
Phone: ${invoice.clientPhone || 'N/A'}

Due Date: ${invoice.dueDate}
Status: ${invoice.status}

Items:
${invoice.items.map((item: any) => 
  `- ${item.description}: ${item.quantity} x $${item.rate} = $${item.amount}`
).join('\n')}

Subtotal: $${invoice.subtotal}
Tax: $${invoice.taxAmount}
Total: $${invoice.totalAmount}

Terms: ${invoice.terms || 'N/A'}
  `
  return Buffer.from(content, 'utf-8')
}

// This function is now handled by the imported sendEmail from @/lib/email