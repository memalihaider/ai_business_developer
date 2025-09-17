import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import jsPDF from 'jspdf'

export const dynamic = 'force-static';

const prisma = new PrismaClient()


// Configure email transporter (using Gmail as example)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  })
}

// POST /api/invoices/email - Send invoice via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, recipientEmail, subject, message, includeAttachment = true } = body

    if (!invoiceId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID and recipient email are required' },
        { status: 400 }
      )
    }

    // Fetch invoice with items
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Create email transporter
    const transporter = createTransporter()

    // Prepare email content
    const defaultSubject = `Invoice ${invoice.invoiceNumber} from AI Business Developer`
    const defaultMessage = `
Dear ${invoice.clientName},

Please find attached your invoice ${invoice.invoiceNumber}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ${invoice.currency} ${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}
- Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
- Status: ${invoice.status.toUpperCase()}

Thank you for your business!

Best regards,
AI Business Developer Team
    `

    const emailOptions: any = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: recipientEmail,
      subject: subject || defaultSubject,
      text: message || defaultMessage,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
          <p>Dear ${invoice.clientName},</p>
          <p>Please find your invoice details below:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Invoice Information</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
            <p><strong>Amount:</strong> ${invoice.currency} ${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Invoice Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #e9ecef;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Description</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Rate</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${item.description}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${item.quantity}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${invoice.currency} ${item.rate.toFixed(2)}</td>
                    <td style="padding: 10px; border: 1px solid #dee2e6;">${invoice.currency} ${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; text-align: right;">
              <p><strong>Subtotal: ${invoice.currency} ${(invoice.subtotal || 0).toFixed(2)}</strong></p>
              <p><strong>Tax (${invoice.taxRate || 0}%): ${invoice.currency} ${(invoice.taxAmount || 0).toFixed(2)}</strong></p>
              <p style="font-size: 18px; color: #007bff;"><strong>Total: ${invoice.currency} ${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}</strong></p>
            </div>
          </div>

          ${invoice.terms ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Terms & Conditions</h3>
              <p>${invoice.terms}</p>
            </div>
          ` : ''}

          <p>Thank you for your business!</p>
          <p>Best regards,<br>AI Business Developer Team</p>
        </div>
      `
    }

    // Add PDF attachment if requested
    if (includeAttachment) {
      try {
        // Generate PDF using the export endpoint logic
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(20)
        doc.text('INVOICE', 20, 30)
        
        doc.setFontSize(12)
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 50)
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 60)
        doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 20, 70)
        
        // Status
        doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 50)
        
        // Client Information
        doc.setFontSize(14)
        doc.text('Bill To:', 20, 90)
        doc.setFontSize(12)
        doc.text(invoice.clientName, 20, 105)
        doc.text(invoice.clientEmail, 20, 115)
        
        if (invoice.clientAddress) {
          doc.text(invoice.clientAddress, 20, 125)
        }
        if (invoice.clientPhone) {
          doc.text(`Phone: ${invoice.clientPhone}`, 20, 135)
        }

        // Invoice Items Table
        let yPos = 160
        doc.setFontSize(12)
        
        // Table headers
        doc.text('Description', 20, yPos)
        doc.text('Qty', 120, yPos)
        doc.text('Rate', 140, yPos)
        doc.text('Amount', 170, yPos)
        
        // Draw line under headers
        doc.line(20, yPos + 5, 190, yPos + 5)
        yPos += 15
        
        // Invoice items
        invoice.items.forEach((item) => {
          doc.text(item.description.substring(0, 30), 20, yPos)
          doc.text(item.quantity.toString(), 120, yPos)
          doc.text(`${invoice.currency} ${item.rate.toFixed(2)}`, 140, yPos)
          doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 170, yPos)
          yPos += 10
        })

        // Totals
        yPos += 10
        doc.line(140, yPos, 190, yPos)
        yPos += 10
        
        doc.text('Subtotal:', 140, yPos)
        doc.text(`${invoice.currency} ${(invoice.subtotal || 0).toFixed(2)}`, 170, yPos)
        yPos += 10
        
        doc.text(`Tax (${invoice.taxRate || 0}%):`, 140, yPos)
        doc.text(`${invoice.currency} ${(invoice.taxAmount || 0).toFixed(2)}`, 170, yPos)
        yPos += 10
        
        doc.setFontSize(14)
        doc.text('Total:', 140, yPos)
        doc.text(`${invoice.currency} ${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}`, 170, yPos)

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        
        emailOptions.attachments = [{
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError)
        // Continue without attachment if PDF generation fails
      }
    }

    // Send email
    await transporter.sendMail(emailOptions)

    // Log email activity
    try {
      await prisma.emailLog.create({
        data: {
          invoiceId: invoice.id,
          recipientEmail,
          subject: emailOptions.subject,
          status: 'sent',
          emailType: 'invoice',
        },
      })
    } catch (logError) {
      console.error('Error logging email activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      invoiceNumber: invoice.invoiceNumber,
      recipientEmail,
    })
  } catch (error) {
    console.error('Email sending error:', error)
    
    // Log failed email attempt
    try {
      const body = await request.json()
      await prisma.emailLog.create({
        data: {
          invoiceId: body.invoiceId,
          recipientEmail: body.recipientEmail,
          subject: body.subject || 'Invoice Email',
          status: 'failed',
          emailType: 'invoice',
        },
      })
    } catch (logError) {
      console.error('Error logging failed email:', logError)
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
