import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// GET /api/reports - Fetch comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const currency = searchParams.get('currency') || 'USD';

    // Calculate date range
    const now = new Date();
    let fromDate = new Date();
    
    if (startDate && endDate) {
      fromDate = new Date(startDate);
    } else {
      switch (period) {
        case '7d':
          fromDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          fromDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          fromDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          fromDate.setDate(now.getDate() - 30);
      }
    }

    const toDate = endDate ? new Date(endDate) : now;

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        reportData = await getOverviewReport(fromDate, toDate, currency);
        break;
      case 'sales':
        reportData = await getSalesReport(fromDate, toDate, currency);
        break;
      case 'marketing':
        reportData = await getMarketingReport(fromDate, toDate);
        break;
      case 'financial':
        reportData = await getFinancialReport(fromDate, toDate, currency);
        break;
      case 'engagement':
        reportData = await getEngagementReport(fromDate, toDate);
        break;
      case 'pipeline':
        reportData = await getPipelineReport(fromDate, toDate, currency);
        break;
      default:
        reportData = await getOverviewReport(fromDate, toDate, currency);
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      period: { from: fromDate, to: toDate },
      reportType,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Overview Report - Key metrics across all areas
async function getOverviewReport(fromDate: Date, toDate: Date, currency: string) {
  const [leads, deals, invoices, campaigns, contacts, payments] = await Promise.all([
    // Leads metrics
    prisma.lead.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      _count: { id: true }
    }),
    
    // Deals metrics
    prisma.deal.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      _count: { id: true },
      _sum: { value: true },
      _avg: { value: true }
    }),
    
    // Invoice metrics
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    }),
    
    // Campaign metrics
    prisma.campaign.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      _count: { id: true },
      _sum: {
        totalContacts: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true
      }
    }),
    
    // Contact metrics
    prisma.contact.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      _count: { id: true }
    }),
    
    // Payment metrics
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency,
        status: 'completed'
      },
      _count: { id: true },
      _sum: { amount: true }
    })
  ]);

  // Calculate rates
  const openRate = campaigns._sum.sentCount ? 
    (campaigns._sum.openedCount || 0) / campaigns._sum.sentCount * 100 : 0;
  const clickRate = campaigns._sum.sentCount ? 
    (campaigns._sum.clickedCount || 0) / campaigns._sum.sentCount * 100 : 0;

  return {
    summary: {
      totalLeads: leads._count.id || 0,
      totalDeals: deals._count.id || 0,
      totalRevenue: deals._sum.value || 0,
      totalInvoices: invoices._count.id || 0,
      totalInvoiceAmount: invoices._sum.totalAmount || 0,
      totalCampaigns: campaigns._count.id || 0,
      totalContacts: contacts._count.id || 0,
      totalPayments: payments._count.id || 0,
      totalPaymentAmount: payments._sum.amount || 0
    },
    metrics: {
      averageDealValue: deals._avg.value || 0,
      averageInvoiceAmount: invoices._avg.totalAmount || 0,
      emailOpenRate: Math.round(openRate * 100) / 100,
      emailClickRate: Math.round(clickRate * 100) / 100,
      conversionRate: leads._count.id ? 
        (deals._count.id || 0) / leads._count.id * 100 : 0
    }
  };
}

// Sales Report - Focus on deals and revenue
async function getSalesReport(fromDate: Date, toDate: Date, currency: string) {
  const [dealsByStage, dealsByMonth, topDeals, revenueByMonth] = await Promise.all([
    // Deals by stage
    prisma.deal.groupBy({
      by: ['stage'],
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      _count: { id: true },
      _sum: { value: true }
    }),
    
    // Deals by month
    prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count,
        SUM(value) as total_value,
        AVG(value) as avg_value
      FROM deals 
      WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} AND currency = ${currency}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    `,
    
    // Top deals
    prisma.deal.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      orderBy: { value: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
            company: true
          }
        }
      }
    }),
    
    // Revenue by month (closed-won deals)
    prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', actualCloseDate) as month,
        COUNT(*) as deals_won,
        SUM(value) as revenue
      FROM deals 
      WHERE actualCloseDate >= ${fromDate} AND actualCloseDate <= ${toDate} 
        AND currency = ${currency} AND stage = 'closed-won'
      GROUP BY strftime('%Y-%m', actualCloseDate)
      ORDER BY month
    `
  ]);

  return {
    dealsByStage,
    dealsByMonth,
    topDeals,
    revenueByMonth,
    summary: {
      totalDeals: dealsByStage.reduce((sum, stage) => sum + stage._count.id, 0),
      totalValue: dealsByStage.reduce((sum, stage) => sum + (stage._sum.value || 0), 0),
      wonDeals: dealsByStage.find(s => s.stage === 'closed-won')?._count.id || 0,
      lostDeals: dealsByStage.find(s => s.stage === 'closed-lost')?._count.id || 0
    }
  };
}

// Marketing Report - Focus on campaigns and engagement
async function getMarketingReport(fromDate: Date, toDate: Date) {
  const [campaignStats, emailEvents, socialAnalytics, contentIdeas] = await Promise.all([
    // Campaign statistics
    prisma.campaign.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        totalContacts: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        unsubscribedCount: true,
        createdAt: true
      }
    }),
    
    // Email events
    prisma.emailEvent.groupBy({
      by: ['type'],
      where: {
        timestamp: { gte: fromDate, lte: toDate }
      },
      _count: { id: true }
    }),
    
    // Social analytics
    prisma.socialAnalytics.aggregate({
      where: {
        date: { gte: fromDate, lte: toDate }
      },
      _sum: {
        shares: true,
        clicks: true,
        likes: true,
        comments: true,
        reach: true,
        impressions: true
      },
      _avg: {
        engagement: true
      }
    }),
    
    // Content ideas
    prisma.contentIdea.groupBy({
      by: ['status', 'category'],
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      _count: { id: true }
    })
  ]);

  return {
    campaignStats,
    emailEvents,
    socialAnalytics,
    contentIdeas,
    summary: {
      totalCampaigns: campaignStats.length,
      totalEmailsSent: campaignStats.reduce((sum, c) => sum + c.sentCount, 0),
      totalOpens: campaignStats.reduce((sum, c) => sum + c.openedCount, 0),
      totalClicks: campaignStats.reduce((sum, c) => sum + c.clickedCount, 0),
      avgOpenRate: campaignStats.length ? 
        campaignStats.reduce((sum, c) => sum + (c.sentCount ? c.openedCount / c.sentCount : 0), 0) / campaignStats.length * 100 : 0,
      avgClickRate: campaignStats.length ? 
        campaignStats.reduce((sum, c) => sum + (c.sentCount ? c.clickedCount / c.sentCount : 0), 0) / campaignStats.length * 100 : 0
    }
  };
}

// Financial Report - Focus on invoices and payments
async function getFinancialReport(fromDate: Date, toDate: Date, currency: string) {
  const [invoiceStats, paymentStats, revenueByMonth, outstandingInvoices] = await Promise.all([
    // Invoice statistics
    prisma.invoice.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    }),
    
    // Payment statistics
    prisma.payment.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency
      },
      _count: { id: true },
      _sum: { amount: true }
    }),
    
    // Revenue by month
    prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as invoice_count,
        SUM(totalAmount) as total_amount,
        AVG(totalAmount) as avg_amount
      FROM invoices 
      WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} AND currency = ${currency}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    `,
    
    // Outstanding invoices
    prisma.invoice.findMany({
      where: {
        status: { in: ['sent', 'overdue'] },
        currency
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        totalAmount: true,
        dueDate: true,
        status: true,
        createdAt: true
      },
      orderBy: { dueDate: 'asc' }
    })
  ]);

  return {
    invoiceStats,
    paymentStats,
    revenueByMonth,
    outstandingInvoices,
    summary: {
      totalInvoices: invoiceStats.reduce((sum, status) => sum + status._count.id, 0),
      totalInvoiceAmount: invoiceStats.reduce((sum, status) => sum + (status._sum.totalAmount || 0), 0),
      totalPayments: paymentStats.reduce((sum, status) => sum + status._count.id, 0),
      totalPaymentAmount: paymentStats.reduce((sum, status) => sum + (status._sum.amount || 0), 0),
      outstandingAmount: outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    }
  };
}

// Engagement Report - Focus on email and social engagement
async function getEngagementReport(fromDate: Date, toDate: Date) {
  const [emailOpens, emailClicks, socialShares, linkClicks] = await Promise.all([
    // Email opens by day
    prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as opens,
        COUNT(DISTINCT contactId) as unique_opens
      FROM email_opens 
      WHERE timestamp >= ${fromDate} AND timestamp <= ${toDate}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `,
    
    // Email clicks by day
    prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as clicks,
        COUNT(DISTINCT contactId) as unique_clicks
      FROM email_clicks 
      WHERE timestamp >= ${fromDate} AND timestamp <= ${toDate}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `,
    
    // Social shares
    prisma.socialShare.findMany({
      where: {
        timestamp: { gte: fromDate, lte: toDate }
      },
      include: {
        platform: {
          select: {
            name: true,
            displayName: true
          }
        },
        clicks: true
      }
    }),
    
    // Link clicks
    prisma.linkClick.groupBy({
      by: ['linkId'],
      where: {
        timestamp: { gte: fromDate, lte: toDate }
      },
      _count: { id: true },
      _count: { contactId: true }
    })
  ]);

  return {
    emailOpens,
    emailClicks,
    socialShares,
    linkClicks,
    summary: {
      totalEmailOpens: Array.isArray(emailOpens) ? emailOpens.reduce((sum: number, day: any) => sum + day.opens, 0) : 0,
      totalEmailClicks: Array.isArray(emailClicks) ? emailClicks.reduce((sum: number, day: any) => sum + day.clicks, 0) : 0,
      totalSocialShares: socialShares.length,
      totalLinkClicks: linkClicks.reduce((sum, link) => sum + link._count.id, 0)
    }
  };
}

// Pipeline Report - Focus on deal pipeline and conversion
async function getPipelineReport(fromDate: Date, toDate: Date, currency: string) {
  const [pipelineByStage, conversionRates, dealActivities, leadSources] = await Promise.all([
    // Pipeline by stage
    prisma.deal.groupBy({
      by: ['stage'],
      where: {
        currency
      },
      _count: { id: true },
      _sum: { value: true },
      _avg: { probability: true }
    }),
    
    // Conversion rates by stage
    prisma.$queryRaw`
      SELECT 
        stage,
        COUNT(*) as total,
        SUM(CASE WHEN stage = 'closed-won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN stage = 'closed-lost' THEN 1 ELSE 0 END) as lost
      FROM deals 
      WHERE currency = ${currency}
      GROUP BY stage
    `,
    
    // Recent deal activities
    prisma.dealActivity.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      include: {
        deal: {
          select: {
            title: true,
            value: true,
            stage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    
    // Lead sources
    prisma.lead.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      _count: { id: true }
    })
  ]);

  return {
    pipelineByStage,
    conversionRates,
    dealActivities,
    leadSources,
    summary: {
      totalPipelineValue: pipelineByStage.reduce((sum, stage) => sum + (stage._sum.value || 0), 0),
      totalDealsInPipeline: pipelineByStage.reduce((sum, stage) => sum + stage._count.id, 0),
      avgDealProbability: pipelineByStage.reduce((sum, stage) => sum + (stage._avg.probability || 0), 0) / pipelineByStage.length,
      recentActivities: dealActivities.length
    }
  };
}

// POST /api/reports - Generate custom reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, parameters, format = 'json' } = body;

    // Validate required fields
    if (!reportType) {
      return NextResponse.json(
        { success: false, error: 'Report type is required' },
        { status: 400 }
      );
    }

    // Generate report based on type and parameters
    let reportData: any = {};
    const fromDate = parameters?.startDate ? new Date(parameters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = parameters?.endDate ? new Date(parameters.endDate) : new Date();
    const currency = parameters?.currency || 'USD';

    switch (reportType) {
      case 'custom':
        reportData = await generateCustomReport(parameters);
        break;
      case 'export':
        reportData = await generateExportReport(parameters);
        break;
      default:
        // Use existing report functions
        switch (reportType) {
          case 'overview':
            reportData = await getOverviewReport(fromDate, toDate, currency);
            break;
          case 'sales':
            reportData = await getSalesReport(fromDate, toDate, currency);
            break;
          case 'marketing':
            reportData = await getMarketingReport(fromDate, toDate);
            break;
          case 'financial':
            reportData = await getFinancialReport(fromDate, toDate, currency);
            break;
          case 'engagement':
            reportData = await getEngagementReport(fromDate, toDate);
            break;
          case 'pipeline':
            reportData = await getPipelineReport(fromDate, toDate, currency);
            break;
          default:
            return NextResponse.json(
              { success: false, error: 'Invalid report type' },
              { status: 400 }
            );
        }
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      reportType,
      parameters,
      format,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Generate custom report based on user parameters
async function generateCustomReport(parameters: any) {
  const { metrics, filters, groupBy, orderBy } = parameters;
  
  // This would implement custom query building based on user selections
  // For now, return a placeholder structure
  return {
    customData: [],
    summary: {
      message: 'Custom report generation would be implemented here based on user parameters'
    },
    parameters
  };
}

// Generate export-ready report
async function generateExportReport(parameters: any) {
  const { dataTypes, format, includeCharts } = parameters;
  
  // Fetch all requested data types
  const exportData: any = {};
  
  if (dataTypes?.includes('leads')) {
    exportData.leads = await prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        status: true,
        value: true,
        createdAt: true
      }
    });
  }
  
  if (dataTypes?.includes('deals')) {
    exportData.deals = await prisma.deal.findMany({
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        createdAt: true
      }
    });
  }
  
  if (dataTypes?.includes('invoices')) {
    exportData.invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        createdAt: true
      }
    });
  }
  
  return {
    exportData,
    format,
    includeCharts,
    recordCount: Object.values(exportData).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
  };
}
