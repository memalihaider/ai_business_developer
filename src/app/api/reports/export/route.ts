import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// POST /api/reports/export - Export reports in various formats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, reportType, data, parameters } = body;
    
    if (!format || !reportType) {
      return NextResponse.json(
        { success: false, error: 'Format and report type are required' },
        { status: 400 }
      );
    }
    
    switch (format.toLowerCase()) {
      case 'csv':
        return await exportCSV(reportType, data, parameters);
      case 'pdf':
        return await exportPDF(reportType, data, parameters);
      case 'json':
        return await exportJSON(reportType, data, parameters);
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported export format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

// Export as CSV
async function exportCSV(reportType: string, data: any, parameters: any) {
  try {
    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}-report-${timestamp}.csv`;
    
    switch (reportType) {
      case 'overview':
        csvContent = generateOverviewCSV(data);
        break;
      case 'sales':
        csvContent = generateSalesCSV(data);
        break;
      case 'marketing':
        csvContent = generateMarketingCSV(data);
        break;
      case 'financial':
        csvContent = generateFinancialCSV(data);
        break;
      case 'engagement':
        csvContent = generateEngagementCSV(data);
        break;
      case 'pipeline':
        csvContent = generatePipelineCSV(data);
        break;
      default:
        csvContent = generateGenericCSV(data);
    }
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
}

// Export as PDF
async function exportPDF(reportType: string, data: any, parameters: any) {
  try {
    const doc = new jsPDF();
    
    // Generate PDF content
    generatePDF(doc, reportType, data, parameters);
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}-report-${timestamp}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Export as JSON
async function exportJSON(reportType: string, data: any, parameters: any) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}-report-${timestamp}.json`;
    
    const exportData = {
      reportType,
      generatedAt: new Date().toISOString(),
      parameters,
      data
    };
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating JSON:', error);
    throw error;
  }
}

// CSV Generation Functions
function generateOverviewCSV(data: any): string {
  const headers = [
    'Metric',
    'Value',
    'Type'
  ];
  
  let csv = headers.join(',') + '\n';
  
  if (data.summary) {
    Object.entries(data.summary).forEach(([key, value]) => {
      csv += `"${formatMetricName(key)}","${value}","Summary"\n`;
    });
  }
  
  if (data.metrics) {
    Object.entries(data.metrics).forEach(([key, value]) => {
      csv += `"${formatMetricName(key)}","${value}","Metric"\n`;
    });
  }
  
  return csv;
}

function generateSalesCSV(data: any): string {
  let csv = '';
  
  // Deals by stage
  if (data.dealsByStage) {
    csv += 'Deals by Stage\n';
    csv += 'Stage,Count,Total Value\n';
    data.dealsByStage.forEach((stage: any) => {
      csv += `"${stage.stage}","${stage._count.id}","${stage._sum.value || 0}"\n`;
    });
    csv += '\n';
  }
  
  // Top deals
  if (data.topDeals) {
    csv += 'Top Deals\n';
    csv += 'Title,Value,Stage,Probability,Contact,Company\n';
    data.topDeals.forEach((deal: any) => {
      const contactName = deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '';
      csv += `"${deal.title}","${deal.value}","${deal.stage}","${deal.probability}%","${contactName}","${deal.contact?.company || ''}"\n`;
    });
  }
  
  return csv;
}

function generateMarketingCSV(data: any): string {
  let csv = '';
  
  // Campaign statistics
  if (data.campaignStats) {
    csv += 'Campaign Statistics\n';
    csv += 'Name,Type,Status,Total Contacts,Sent,Opened,Clicked,Unsubscribed,Open Rate,Click Rate\n';
    data.campaignStats.forEach((campaign: any) => {
      const openRate = campaign.sentCount ? (campaign.openedCount / campaign.sentCount * 100).toFixed(2) : '0';
      const clickRate = campaign.sentCount ? (campaign.clickedCount / campaign.sentCount * 100).toFixed(2) : '0';
      csv += `"${campaign.name}","${campaign.type}","${campaign.status}","${campaign.totalContacts}","${campaign.sentCount}","${campaign.openedCount}","${campaign.clickedCount}","${campaign.unsubscribedCount}","${openRate}%","${clickRate}%"\n`;
    });
  }
  
  return csv;
}

function generateFinancialCSV(data: any): string {
  let csv = '';
  
  // Invoice statistics
  if (data.invoiceStats) {
    csv += 'Invoice Statistics\n';
    csv += 'Status,Count,Total Amount\n';
    data.invoiceStats.forEach((stat: any) => {
      csv += `"${stat.status}","${stat._count.id}","${stat._sum.totalAmount || 0}"\n`;
    });
    csv += '\n';
  }
  
  // Outstanding invoices
  if (data.outstandingInvoices) {
    csv += 'Outstanding Invoices\n';
    csv += 'Invoice Number,Client,Amount,Due Date,Status,Days Overdue\n';
    data.outstandingInvoices.forEach((invoice: any) => {
      const daysOverdue = invoice.status === 'overdue' ? 
        Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      csv += `"${invoice.invoiceNumber}","${invoice.clientName}","${invoice.totalAmount}","${new Date(invoice.dueDate).toLocaleDateString()}","${invoice.status}","${daysOverdue}"\n`;
    });
  }
  
  return csv;
}

function generateEngagementCSV(data: any): string {
  let csv = '';
  
  // Email engagement by day
  if (data.emailOpens && Array.isArray(data.emailOpens)) {
    csv += 'Email Engagement by Day\n';
    csv += 'Date,Opens,Unique Opens,Clicks,Unique Clicks\n';
    
    // Merge opens and clicks data by date
    const engagementMap = new Map();
    
    data.emailOpens.forEach((day: any) => {
      engagementMap.set(day.date, {
        date: day.date,
        opens: day.opens,
        uniqueOpens: day.unique_opens,
        clicks: 0,
        uniqueClicks: 0
      });
    });
    
    if (data.emailClicks && Array.isArray(data.emailClicks)) {
      data.emailClicks.forEach((day: any) => {
        const existing = engagementMap.get(day.date) || {
          date: day.date,
          opens: 0,
          uniqueOpens: 0,
          clicks: 0,
          uniqueClicks: 0
        };
        existing.clicks = day.clicks;
        existing.uniqueClicks = day.unique_clicks;
        engagementMap.set(day.date, existing);
      });
    }
    
    Array.from(engagementMap.values()).forEach((day: any) => {
      csv += `"${day.date}","${day.opens}","${day.uniqueOpens}","${day.clicks}","${day.uniqueClicks}"\n`;
    });
  }
  
  return csv;
}

function generatePipelineCSV(data: any): string {
  let csv = '';
  
  // Pipeline by stage
  if (data.pipelineByStage) {
    csv += 'Pipeline by Stage\n';
    csv += 'Stage,Deal Count,Total Value,Average Probability\n';
    data.pipelineByStage.forEach((stage: any) => {
      csv += `"${stage.stage}","${stage._count.id}","${stage._sum.value || 0}","${(stage._avg.probability || 0).toFixed(1)}%"\n`;
    });
  }
  
  return csv;
}

function generateGenericCSV(data: any): string {
  // Fallback for unknown report types
  return JSON.stringify(data, null, 2);
}

// PDF Generation Function
function generatePDF(doc: any, reportType: string, data: any, parameters: any) {
  // Header
  doc.setFontSize(20);
  doc.text(`${formatReportTitle(reportType)} Report`, 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 45, { align: 'center' });
  
  let yPosition = 70;
  
  // Report content based on type
  switch (reportType) {
    case 'overview':
      generateOverviewPDF(doc, data);
      break;
    case 'sales':
      generateSalesPDF(doc, data);
      break;
    case 'marketing':
      generateMarketingPDF(doc, data);
      break;
    case 'financial':
      generateFinancialPDF(doc, data);
      break;
    case 'engagement':
      generateEngagementPDF(doc, data);
      break;
    case 'pipeline':
      generatePipelinePDF(doc, data);
      break;
    default:
      doc.setFontSize(12);
      doc.text('Report data not available for PDF export.', 20, yPosition);
  }
  
  // Footer
  doc.setFontSize(10);
  doc.text('Generated by AI Business Developer', 105, 280, { align: 'center' });
}

function generateOverviewPDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Summary Metrics', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    Object.entries(data.summary).forEach(([key, value]) => {
      doc.text(`${formatMetricName(key)}: ${value}`, 25, yPos);
      yPos += 10;
    });
  }
  
  yPos += 10;
  doc.setFontSize(16);
  doc.text('Key Performance Indicators', 20, yPos);
  yPos += 15;
  
  if (data.metrics) {
    doc.setFontSize(12);
    Object.entries(data.metrics).forEach(([key, value]) => {
      doc.text(`${formatMetricName(key)}: ${value}`, 25, yPos);
      yPos += 10;
    });
  }
}

function generateSalesPDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Sales Performance', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    doc.text(`Total Deals: ${data.summary.totalDeals}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Value: $${data.summary.totalValue?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Won Deals: ${data.summary.wonDeals}`, 25, yPos);
    yPos += 10;
    doc.text(`Lost Deals: ${data.summary.lostDeals}`, 25, yPos);
    yPos += 10;
  }
  
  yPos += 10;
  doc.setFontSize(14);
  doc.text('Deals by Stage', 20, yPos);
  yPos += 15;
  
  if (data.dealsByStage) {
    doc.setFontSize(12);
    data.dealsByStage.forEach((stage: any) => {
      doc.text(`${stage.stage}: ${stage._count.id} deals ($${(stage._sum.value || 0).toLocaleString()})`, 25, yPos);
      yPos += 10;
    });
  }
}

function generateMarketingPDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Marketing Performance', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    doc.text(`Total Campaigns: ${data.summary.totalCampaigns}`, 25, yPos);
    yPos += 10;
    doc.text(`Emails Sent: ${data.summary.totalEmailsSent?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Opens: ${data.summary.totalOpens?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Clicks: ${data.summary.totalClicks?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Average Open Rate: ${data.summary.avgOpenRate?.toFixed(2) || 0}%`, 25, yPos);
    yPos += 10;
    doc.text(`Average Click Rate: ${data.summary.avgClickRate?.toFixed(2) || 0}%`, 25, yPos);
  }
}

function generateFinancialPDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Financial Overview', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    doc.text(`Total Invoices: ${data.summary.totalInvoices}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Invoice Amount: $${data.summary.totalInvoiceAmount?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Payments: ${data.summary.totalPayments}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Payment Amount: $${data.summary.totalPaymentAmount?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Outstanding Amount: $${data.summary.outstandingAmount?.toLocaleString() || 0}`, 25, yPos);
  }
}

function generateEngagementPDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Engagement Metrics', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    doc.text(`Total Email Opens: ${data.summary.totalEmailOpens?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Email Clicks: ${data.summary.totalEmailClicks?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Social Shares: ${data.summary.totalSocialShares?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Link Clicks: ${data.summary.totalLinkClicks?.toLocaleString() || 0}`, 25, yPos);
  }
}

function generatePipelinePDF(doc: any, data: any) {
  let yPos = 80;
  
  doc.setFontSize(16);
  doc.text('Sales Pipeline', 20, yPos);
  yPos += 15;
  
  if (data.summary) {
    doc.setFontSize(12);
    doc.text(`Total Pipeline Value: $${data.summary.totalPipelineValue?.toLocaleString() || 0}`, 25, yPos);
    yPos += 10;
    doc.text(`Total Deals in Pipeline: ${data.summary.totalDealsInPipeline}`, 25, yPos);
    yPos += 10;
    doc.text(`Average Deal Probability: ${data.summary.avgDealProbability?.toFixed(1) || 0}%`, 25, yPos);
    yPos += 10;
    doc.text(`Recent Activities: ${data.summary.recentActivities}`, 25, yPos);
  }
}

// Utility Functions
function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatReportTitle(reportType: string): string {
  return reportType.charAt(0).toUpperCase() + reportType.slice(1);
}
