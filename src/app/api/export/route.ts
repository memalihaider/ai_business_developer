import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-static';

const prisma = new PrismaClient()


// Export single invoice
export async function POST(request: NextRequest) {
  try {
    const { invoiceId, format } = await request.json()

    if (!invoiceId || !format) {
      return NextResponse.json(
        { error: 'Invoice ID and format are required' },
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

    let exportData
    let contentType
    let filename

    switch (format.toLowerCase()) {
      case 'pdf':
        // Generate PDF (simplified - in real app, use a PDF library like jsPDF)
        exportData = generatePDFContent(invoice)
        contentType = 'application/pdf'
        filename = `invoice-${invoice.invoiceNumber}.pdf`
        break
      
      case 'csv':
        exportData = generateCSVContent([invoice])
        contentType = 'text/csv'
        filename = `invoice-${invoice.invoiceNumber}.csv`
        break
      
      case 'excel':
        // Generate Excel (simplified - in real app, use a library like xlsx)
        exportData = generateExcelContent([invoice])
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `invoice-${invoice.invoiceNumber}.xlsx`
        break
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        )
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

// Export multiple invoices
export async function PUT(request: NextRequest) {
  try {
    const { invoiceIds, format } = await request.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invoice IDs array is required' },
        { status: 400 }
      )
    }

    // Get invoices data
    const invoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      include: {
        items: true
      }
    })

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No invoices found' },
        { status: 404 }
      )
    }

    let exportData
    let contentType
    let filename

    switch (format.toLowerCase()) {
      case 'pdf':
        exportData = generateMultiplePDFContent(invoices)
        contentType = 'application/pdf'
        filename = `invoices-export-${new Date().toISOString().split('T')[0]}.pdf`
        break
      
      case 'csv':
        exportData = generateCSVContent(invoices)
        contentType = 'text/csv'
        filename = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`
        break
      
      case 'excel':
        exportData = generateExcelContent(invoices)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `invoices-export-${new Date().toISOString().split('T')[0]}.xlsx`
        break
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        )
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

// Helper functions for generating export content
function generatePDFContent(invoice: any): Buffer {
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

function generateMultiplePDFContent(invoices: any[]): Buffer {
  const content = invoices.map(invoice => generatePDFContent(invoice).toString()).join('\n\n---\n\n')
  return Buffer.from(content, 'utf-8')
}

function generateCSVContent(invoices: any[]): Buffer {
  const headers = [
    'Invoice Number', 'Client Name', 'Client Email', 'Client Address', 'Client Phone',
    'Due Date', 'Status', 'Subtotal', 'Tax Amount', 'Total Amount', 'Terms'
  ]
  
  const rows = invoices.map(invoice => [
    invoice.invoiceNumber,
    invoice.clientName,
    invoice.clientEmail,
    invoice.clientAddress || '',
    invoice.clientPhone || '',
    invoice.dueDate,
    invoice.status,
    invoice.subtotal,
    invoice.taxAmount,
    invoice.totalAmount,
    invoice.terms || ''
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  return Buffer.from(csvContent, 'utf-8')
}

function generateExcelContent(invoices: any[]): Buffer {
  // Simplified Excel generation - in real app, use xlsx library
  return generateCSVContent(invoices) // Fallback to CSV for now
}
