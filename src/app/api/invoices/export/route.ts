import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


type ExportFormat = 'pdf' | 'csv' | 'excel';

interface ExportRequest {
  format: ExportFormat;
  invoiceIds?: string[];
  filters?: {
    status?: string;
    clientEmail?: string;
    startDate?: string;
    endDate?: string;
  };
  includePayments?: boolean;
}

// POST /api/invoices/export - Export invoices in various formats
export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { format, invoiceIds, filters, includePayments = false } = body;

    if (!format || !['pdf', 'csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Valid format is required (pdf, csv, excel)' },
        { status: 400 }
      );
    }

    // Build query conditions
    let where: any = {};
    
    if (invoiceIds && invoiceIds.length > 0) {
      where.id = { in: invoiceIds };
    } else if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.clientEmail) {
        where.clientEmail = {
          contains: filters.clientEmail,
          mode: 'insensitive',
        };
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: includePayments ? {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
          },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No invoices found for export' },
        { status: 404 }
      );
    }

    // Generate export based on format
    let exportData: Buffer | string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        exportData = await generatePDFExport(invoices);
        contentType = 'application/pdf';
        filename = `invoices-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      case 'csv':
        exportData = generateCSVExport(invoices, includePayments);
        contentType = 'text/csv';
        filename = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'excel':
        exportData = generateExcelExport(invoices, includePayments);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `invoices-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      
      default:
        throw new Error('Unsupported export format');
    }

    // Log export activity
    await logExportActivity({
      format,
      invoiceCount: invoices.length,
      filters: filters || {},
      includePayments,
    });

    // Return file as response
    const response = new NextResponse(exportData);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Cache-Control', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Error exporting invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export invoices' },
      { status: 500 }
    );
  }
}

// Generate PDF export
async function generatePDFExport(invoices: any[]): Promise<Buffer> {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.height;
  let yPosition = 20;

  // Add title
  pdf.setFontSize(20);
  pdf.text('Invoice Export Report', 20, yPosition);
  yPosition += 15;

  // Add export date
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 10;

  pdf.text(`Total Invoices: ${invoices.length}`, 20, yPosition);
  yPosition += 20;

  // Add invoices
  for (const invoice of invoices) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    // Invoice header
    pdf.setFontSize(14);
    pdf.text(`Invoice: ${invoice.invoiceNumber}`, 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text(`Client: ${invoice.clientName}`, 20, yPosition);
    pdf.text(`Email: ${invoice.clientEmail}`, 120, yPosition);
    yPosition += 6;

    pdf.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPosition);
    pdf.text(`Amount: ${invoice.currency} ${invoice.totalAmount}`, 120, yPosition);
    yPosition += 6;

    pdf.text(`Created: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, yPosition);
    pdf.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 120, yPosition);
    yPosition += 6;

    if (invoice.notes) {
      pdf.text(`Notes: ${invoice.notes.substring(0, 100)}${invoice.notes.length > 100 ? '...' : ''}`, 20, yPosition);
      yPosition += 6;
    }

    // Add separator line
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 10;
  }

  // Add summary
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = 20;
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  pdf.setFontSize(12);
  pdf.text('Summary:', 20, yPosition);
  yPosition += 10;

  pdf.text(`Total Amount: ${invoices[0]?.currency || 'USD'} ${totalAmount.toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Paid Amount: ${invoices[0]?.currency || 'USD'} ${paidAmount.toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Outstanding: ${invoices[0]?.currency || 'USD'} ${(totalAmount - paidAmount).toFixed(2)}`, 20, yPosition);

  return Buffer.from(pdf.output('arraybuffer'));
}

// Generate CSV export
function generateCSVExport(invoices: any[], includePayments: boolean): string {
  const headers = [
    'Invoice Number',
    'Client Name',
    'Client Email',
    'Status',
    'Subtotal',
    'Tax Amount',
    'Total Amount',
    'Currency',
    'Created Date',
    'Due Date',
    'Paid Date',
    'Notes',
  ];

  if (includePayments) {
    headers.push('Payment Status', 'Payment Method', 'Payment Amount');
  }

  const csvRows = [headers.join(',')];

  for (const invoice of invoices) {
    const items = JSON.parse(invoice.items || '[]');
    const itemsDescription = items.map((item: any) => `${item.description} (${item.quantity}x${item.unitPrice})`).join('; ');
    
    const row = [
      `"${invoice.invoiceNumber}"`,
      `"${invoice.clientName}"`,
      `"${invoice.clientEmail}"`,
      `"${invoice.status}"`,
      invoice.subtotal,
      invoice.taxAmount,
      invoice.totalAmount,
      `"${invoice.currency}"`,
      `"${new Date(invoice.createdAt).toISOString().split('T')[0]}"`,
      `"${new Date(invoice.dueDate).toISOString().split('T')[0]}"`,
      invoice.paidAt ? `"${new Date(invoice.paidAt).toISOString().split('T')[0]}"` : '""',
      `"${(invoice.notes || '').replace(/"/g, '""')}"`,
    ];

    if (includePayments && invoice.payments) {
      if (invoice.payments.length > 0) {
        for (const payment of invoice.payments) {
          const paymentRow = [...row];
          paymentRow.push(
            `"${payment.status}"`,
            `"${payment.paymentMethod}"`,
            payment.amount
          );
          csvRows.push(paymentRow.join(','));
        }
      } else {
        row.push('""', '""', '""');
        csvRows.push(row.join(','));
      }
    } else {
      csvRows.push(row.join(','));
    }
  }

  return csvRows.join('\n');
}

// Generate Excel export
function generateExcelExport(invoices: any[], includePayments: boolean): Buffer {
  const workbook = XLSX.utils.book_new();

  // Main invoices sheet
  const invoiceData = invoices.map(invoice => {
    const items = JSON.parse(invoice.items || '[]');
    return {
      'Invoice Number': invoice.invoiceNumber,
      'Client Name': invoice.clientName,
      'Client Email': invoice.clientEmail,
      'Client Address': invoice.clientAddress || '',
      'Client Phone': invoice.clientPhone || '',
      'Status': invoice.status,
      'Subtotal': invoice.subtotal,
      'Tax Amount': invoice.taxAmount,
      'Total Amount': invoice.totalAmount,
      'Currency': invoice.currency,
      'Created Date': new Date(invoice.createdAt).toISOString().split('T')[0],
      'Due Date': new Date(invoice.dueDate).toISOString().split('T')[0],
      'Paid Date': invoice.paidAt ? new Date(invoice.paidAt).toISOString().split('T')[0] : '',
      'Items Count': items.length,
      'Notes': invoice.notes || '',
      'Terms': invoice.terms || '',
    };
  });

  const invoiceSheet = XLSX.utils.json_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');

  // Invoice items sheet
  const itemsData: any[] = [];
  invoices.forEach(invoice => {
    const items = JSON.parse(invoice.items || '[]');
    items.forEach((item: any) => {
      itemsData.push({
        'Invoice Number': invoice.invoiceNumber,
        'Client Name': invoice.clientName,
        'Item Description': item.description,
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Amount': item.amount,
        'Tax Rate': item.taxRate || 0,
      });
    });
  });

  if (itemsData.length > 0) {
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Invoice Items');
  }

  // Payments sheet (if requested)
  if (includePayments) {
    const paymentsData: any[] = [];
    invoices.forEach(invoice => {
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach((payment: any) => {
          paymentsData.push({
            'Invoice Number': invoice.invoiceNumber,
            'Client Name': invoice.clientName,
            'Payment ID': payment.id,
            'Payment Amount': payment.amount,
            'Payment Status': payment.status,
            'Payment Method': payment.paymentMethod,
            'Paid Date': payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : '',
          });
        });
      }
    });

    if (paymentsData.length > 0) {
      const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
    }
  }

  // Summary sheet
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = totalAmount - paidAmount;

  const summaryData = [
    { Metric: 'Total Invoices', Value: invoices.length },
    { Metric: 'Paid Invoices', Value: paidInvoices.length },
    { Metric: 'Pending Invoices', Value: invoices.length - paidInvoices.length },
    { Metric: 'Total Amount', Value: totalAmount },
    { Metric: 'Paid Amount', Value: paidAmount },
    { Metric: 'Outstanding Amount', Value: pendingAmount },
    { Metric: 'Payment Rate', Value: `${invoices.length > 0 ? ((paidInvoices.length / invoices.length) * 100).toFixed(2) : 0}%` },
    { Metric: 'Export Date', Value: new Date().toISOString().split('T')[0] },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Log export activity
async function logExportActivity(activity: {
  format: string;
  invoiceCount: number;
  filters: any;
  includePayments: boolean;
}) {
  try {
    await prisma.exportLog.create({
      data: {
        type: 'invoice_export',
        format: activity.format,
        recordCount: activity.invoiceCount,
        filters: JSON.stringify(activity.filters),
        includePayments: activity.includePayments,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error logging export activity:', error);
  }
}

// GET /api/invoices/export - Export single invoice from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format') || 'pdf';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Fetch invoice with items from database
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found in database. Use POST method to export unsaved invoices.' },
        { status: 404 }
      );
    }

    return generatePDF(invoice, format);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}
