import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const sequenceId = searchParams.get("sequenceId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const period = searchParams.get("period") || "7d";
    const currency = searchParams.get("currency") || "USD";
    const clientId = searchParams.get("clientId");

    // Set default date range based on period
    const now = new Date();
    let fromDate = new Date();
    let toDate = now;

    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      switch (period) {
        case "24h":
          fromDate.setHours(fromDate.getHours() - 24);
          break;
        case "7d":
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case "30d":
          fromDate.setDate(fromDate.getDate() - 30);
          break;
        case "90d":
          fromDate.setDate(fromDate.getDate() - 90);
          break;
        case "12m":
          fromDate.setMonth(fromDate.getMonth() - 12);
          break;
        default:
          fromDate.setDate(fromDate.getDate() - 7);
      }
    }

    switch (type) {
      case "overview":
        return await getOverviewAnalytics(fromDate, toDate, sequenceId);
      case "sequences":
        return await getSequenceAnalytics(fromDate, toDate, sequenceId);
      case "engagement":
        return await getEngagementAnalytics(fromDate, toDate, sequenceId);
      case "performance":
        return await getPerformanceAnalytics(fromDate, toDate, sequenceId);
      case "conversion":
        return await getConversionAnalytics(fromDate, toDate, sequenceId);
      case "payments":
        return await getPaymentAnalytics(fromDate, toDate, currency, clientId);
      case "revenue":
        return await getRevenueAnalytics(fromDate, toDate, currency, clientId);
      case "invoices":
        return await getInvoiceAnalytics(fromDate, toDate, currency, clientId);
      case "clients":
        return await getClientAnalytics(fromDate, toDate, currency);
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(fromDate: Date, toDate: Date, sequenceId?: string | null) {
  const where: any = {
    createdAt: {
      gte: fromDate,
      lte: toDate
    }
  };

  if (sequenceId) {
    where.enrollment = {
      sequenceId
    };
  }

  // Get email statistics
  const emailStats = await prisma.scheduledEmail.groupBy({
    by: ['status'],
    where,
    _count: {
      id: true
    }
  });

  // Get engagement statistics
  const engagementStats = await prisma.emailEvent.groupBy({
    by: ['type'],
    where: {
      timestamp: {
        gte: fromDate,
        lte: toDate
      }
    },
    _count: {
      id: true
    }
  });

  // Sequences functionality removed
  const activeSequences = 0;

  // Get active enrollments count
  const activeEnrollments = await prisma.sequenceRun.count({
    where: {
      status: "active",
      startedAt: {
        gte: fromDate,
        lte: toDate
      },
      ...(sequenceId && { sequenceId })
    }
  });

  // Calculate metrics
  const totalEmails = emailStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const sentEmails = emailStats.find(s => s.status === 'sent')?._count.id || 0;
  const opens = engagementStats.find(s => s.type === 'open')?._count.id || 0;
  const clicks = engagementStats.find(s => s.type === 'click')?._count.id || 0;
  const replies = engagementStats.find(s => s.type === 'reply')?._count.id || 0;

  const openRate = sentEmails > 0 ? (opens / sentEmails) * 100 : 0;
  const clickRate = sentEmails > 0 ? (clicks / sentEmails) * 100 : 0;
  const replyRate = sentEmails > 0 ? (replies / sentEmails) * 100 : 0;

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalEmails,
        sentEmails,
        scheduledEmails: emailStats.find(s => s.status === 'scheduled')?._count.id || 0,
        failedEmails: emailStats.find(s => s.status === 'failed')?._count.id || 0,
        activeSequences,
        activeEnrollments
      },
      engagement: {
        opens,
        clicks,
        replies,
        unsubscribes: engagementStats.find(s => s.type === 'unsubscribe')?._count.id || 0
      },
      rates: {
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        replyRate: Math.round(replyRate * 100) / 100
      },
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

async function getSequenceAnalytics(fromDate: Date, toDate: Date, sequenceId?: string | null) {
  const where: any = {
    createdAt: {
      gte: fromDate,
      lte: toDate
    }
  };

  if (sequenceId) {
    where.id = sequenceId;
  }

  // Sequences functionality removed
  const sequenceStats = [];

  return NextResponse.json({
    success: true,
    data: {
      sequences: sequenceStats,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

async function getEngagementAnalytics(fromDate: Date, toDate: Date, sequenceId?: string | null) {
  // Get daily engagement data
  const dailyEngagement = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      type,
      COUNT(*) as count
    FROM email_engagement 
    WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
    ${sequenceId ? prisma.$queryRaw`AND email_id IN (
      SELECT id FROM scheduled_email 
      WHERE enrollment_id IN (
        SELECT id FROM sequence_enrollment WHERE sequence_id = ${sequenceId}
      )
    )` : prisma.$queryRaw``}
    GROUP BY DATE(created_at), type
    ORDER BY date ASC
  `;

  // Get engagement by step
  const stepEngagement = await prisma.emailEvent.groupBy({
    by: ['type'],
    where: {
      timestamp: {
        gte: fromDate,
        lte: toDate
      }
    },
    _count: {
      id: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      dailyEngagement,
      stepEngagement,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

async function getPerformanceAnalytics(fromDate: Date, toDate: Date, sequenceId?: string | null) {
  // Get template performance
  const templatePerformance = await prisma.$queryRaw`
    SELECT 
      t.id,
      t.name,
      COUNT(se.id) as sent_count,
      COUNT(CASE WHEN ee.type = 'open' THEN 1 END) as opens,
      COUNT(CASE WHEN ee.type = 'click' THEN 1 END) as clicks,
      COUNT(CASE WHEN ee.type = 'reply' THEN 1 END) as replies
    FROM email_template t
    LEFT JOIN follow_up_step fs ON t.id = fs.template_id
    LEFT JOIN scheduled_email se ON fs.id = se.step_id
    LEFT JOIN email_engagement ee ON se.id = ee.email_id
    WHERE se.created_at >= ${fromDate} AND se.created_at <= ${toDate}
    ${sequenceId ? prisma.$queryRaw`AND fs.sequence_id = ${sequenceId}` : prisma.$queryRaw``}
    GROUP BY t.id, t.name
    ORDER BY sent_count DESC
  `;

  // Get send time performance
  const sendTimePerformance = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM scheduled_at) as hour,
      COUNT(*) as sent_count,
      COUNT(CASE WHEN ee.type = 'open' THEN 1 END) as opens
    FROM scheduled_email se
    LEFT JOIN email_engagement ee ON se.id = ee.email_id
    WHERE se.created_at >= ${fromDate} AND se.created_at <= ${toDate}
    ${sequenceId ? prisma.$queryRaw`AND se.enrollment_id IN (
      SELECT id FROM sequence_enrollment WHERE sequence_id = ${sequenceId}
    )` : prisma.$queryRaw``}
    GROUP BY EXTRACT(HOUR FROM scheduled_at)
    ORDER BY hour ASC
  `;

  return NextResponse.json({
    success: true,
    data: {
      templatePerformance,
      sendTimePerformance,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

async function getConversionAnalytics(fromDate: Date, toDate: Date, sequenceId?: string | null) {
  // Get conversion funnel data
  const funnelData = await prisma.$queryRaw`
    SELECT 
      fs.step_number,
      fs.name as step_name,
      COUNT(se.id) as sent,
      COUNT(CASE WHEN ee.type = 'open' THEN 1 END) as opened,
      COUNT(CASE WHEN ee.type = 'click' THEN 1 END) as clicked,
      COUNT(CASE WHEN ee.type = 'reply' THEN 1 END) as replied
    FROM follow_up_step fs
    LEFT JOIN scheduled_email se ON fs.id = se.step_id
    LEFT JOIN email_engagement ee ON se.id = ee.email_id
    WHERE se.created_at >= ${fromDate} AND se.created_at <= ${toDate}
    ${sequenceId ? prisma.$queryRaw`AND fs.sequence_id = ${sequenceId}` : prisma.$queryRaw``}
    GROUP BY fs.step_number, fs.name
    ORDER BY fs.step_number ASC
  `;

  // Calculate conversion rates
  const conversionRates = (funnelData as any[]).map(step => {
    const openRate = step.sent > 0 ? (step.opened / step.sent) * 100 : 0;
    const clickRate = step.opened > 0 ? (step.clicked / step.opened) * 100 : 0;
    const replyRate = step.sent > 0 ? (step.replied / step.sent) * 100 : 0;

    return {
      ...step,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      replyRate: Math.round(replyRate * 100) / 100
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      funnelData: conversionRates,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Payment Analytics
async function getPaymentAnalytics(fromDate: Date, toDate: Date, currency: string, clientId?: string | null) {
  // Mock payment analytics data for demo
  const mockPaymentTrends = generateMockPaymentTrends(fromDate, toDate, 'monthly');
  
  return NextResponse.json({
    success: true,
    data: {
      trends: mockPaymentTrends,
      summary: {
        totalPayments: mockPaymentTrends.reduce((sum, item) => sum + item.count, 0),
        totalAmount: mockPaymentTrends.reduce((sum, item) => sum + item.amount, 0),
        averagePayment: mockPaymentTrends.length > 0 
          ? mockPaymentTrends.reduce((sum, item) => sum + item.amount, 0) / mockPaymentTrends.reduce((sum, item) => sum + item.count, 0)
          : 0,
        growthRate: calculateGrowthRate(mockPaymentTrends),
        currency,
      },
      paymentMethods: [
        { method: 'Credit Card', count: 45, amount: 125000, percentage: 65 },
        { method: 'Bank Transfer', count: 18, amount: 85000, percentage: 25 },
        { method: 'Digital Wallet', count: 12, amount: 35000, percentage: 10 },
      ],
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    }
  });
}

// Revenue Analytics
async function getRevenueAnalytics(fromDate: Date, toDate: Date, currency: string, clientId?: string | null) {
  // Build where clause for database query
  const where: any = {
    createdAt: {
      gte: fromDate,
      lte: toDate
    },
    currency: currency
  };

  if (clientId) {
    where.clientId = clientId;
  }

  // Get real revenue data from database
  const [totalRevenueResult, pendingRevenueResult, topClientsData, monthlyRevenue] = await Promise.all([
    // Total revenue from paid invoices
    prisma.invoice.aggregate({
      where: { ...where, status: 'paid' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    // Pending revenue from unpaid invoices
    prisma.invoice.aggregate({
      where: { ...where, status: { in: ['draft', 'sent', 'overdue'] } },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    // Top clients by revenue
    prisma.invoice.groupBy({
      by: ['clientName'],
      where: { ...where, status: 'paid' },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5
    }),
    // Monthly revenue breakdown
    prisma.invoice.findMany({
      where: { ...where, status: 'paid' },
      select: {
        totalAmount: true,
        createdAt: true
      }
    })
  ]);

  const totalRevenue = totalRevenueResult._sum.totalAmount || 0;
  const pendingRevenue = pendingRevenueResult._sum.totalAmount || 0;
  const projectedRevenue = totalRevenue + pendingRevenue;

  // Process monthly revenue data
  const monthlyData = monthlyRevenue.reduce((acc: any[], invoice) => {
    const month = new Date(invoice.createdAt).toISOString().slice(0, 7); // YYYY-MM format
    const existing = acc.find(item => item.period === month);
    if (existing) {
      existing.revenue += invoice.totalAmount;
    } else {
      acc.push({
        period: month,
        revenue: invoice.totalAmount,
        projected: invoice.totalAmount // For simplicity, using actual as projected
      });
    }
    return acc;
  }, []);

  // Calculate growth rate
  const revenueGrowth = monthlyData.length >= 2 
    ? ((monthlyData[monthlyData.length - 1]?.revenue || 0) - (monthlyData[monthlyData.length - 2]?.revenue || 0)) / (monthlyData[monthlyData.length - 2]?.revenue || 1) * 100
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      revenue: monthlyData,
      summary: {
        totalRevenue,
        projectedRevenue,
        revenueGrowth,
        averageMonthlyRevenue: monthlyData.length > 0 
          ? totalRevenue / monthlyData.length
          : 0,
        currency,
      },
      breakdown: {
        recurring: totalRevenue * 0.6, // Estimate 60% recurring
        oneTime: totalRevenue * 0.4,   // Estimate 40% one-time
        subscriptions: totalRevenue * 0.3, // Estimate 30% subscriptions
      },
      topClients: topClientsData.map(client => ({
        name: client.clientName,
        revenue: client._sum.totalAmount || 0,
        invoices: client._count.id
      })),
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    }
  });
}

// Invoice Analytics
async function getInvoiceAnalytics(fromDate: Date, toDate: Date, currency: string, clientId?: string | null) {
  return NextResponse.json({
    success: true,
    data: {
      outstandingBalances: {
        total: 125000,
        currency,
        aging: {
          current: 45000,      // 0-30 days
          thirtyDays: 35000,   // 31-60 days
          sixtyDays: 25000,    // 61-90 days
          ninetyDays: 20000,   // 90+ days
        },
        byClient: [
          { clientName: 'Acme Corporation', amount: 25000, daysOverdue: 15, invoiceCount: 3 },
          { clientName: 'Tech Solutions Inc', amount: 18000, daysOverdue: 45, invoiceCount: 2 },
          { clientName: 'Global Enterprises', amount: 22000, daysOverdue: 8, invoiceCount: 4 },
          { clientName: 'Innovation Labs', amount: 15000, daysOverdue: 62, invoiceCount: 1 },
          { clientName: 'Digital Dynamics', amount: 12000, daysOverdue: 30, invoiceCount: 2 },
        ],
        riskAnalysis: {
          lowRisk: 70000,    // 0-30 days
          mediumRisk: 35000, // 31-60 days
          highRisk: 20000,   // 60+ days
        },
      },
      invoiceMetrics: {
        totalInvoices: 156,
        paidInvoices: 144,
        overdueInvoices: 12,
        averageInvoiceValue: 2850,
        averagePaymentTime: 19.5,
        collectionRate: 92.5,
      },
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    }
  });
}

// Client Analytics
async function getClientAnalytics(fromDate: Date, toDate: Date, currency: string) {
  return NextResponse.json({
    success: true,
    data: {
      totalClients: 48,
      activeClients: 35,
      newClients: 8,
      clientRetention: 87.5,
      topPerformers: [
        {
          name: 'Acme Corporation',
          totalRevenue: 125000,
          invoiceCount: 24,
          averagePaymentTime: 18,
          paymentReliability: 95,
        },
        {
          name: 'Tech Solutions Inc',
          totalRevenue: 98000,
          invoiceCount: 18,
          averagePaymentTime: 22,
          paymentReliability: 88,
        },
        {
          name: 'Global Enterprises',
          totalRevenue: 87000,
          invoiceCount: 32,
          averagePaymentTime: 15,
          paymentReliability: 92,
        },
      ],
      clientSegments: [
        { segment: 'Enterprise', count: 12, revenue: 450000, percentage: 65 },
        { segment: 'Mid-Market', count: 18, revenue: 180000, percentage: 25 },
        { segment: 'Small Business', count: 18, revenue: 70000, percentage: 10 },
      ],
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    }
  });
}

// Helper function to generate mock payment trends
function generateMockPaymentTrends(startDate: Date, endDate: Date, period: string) {
  const trends = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const intervals = period === 'daily' ? daysDiff : period === 'weekly' ? Math.ceil(daysDiff / 7) : Math.ceil(daysDiff / 30);
  
  for (let i = 0; i < Math.min(intervals, 12); i++) {
    const date = new Date(startDate);
    if (period === 'daily') {
      date.setDate(date.getDate() + i);
    } else if (period === 'weekly') {
      date.setDate(date.getDate() + (i * 7));
    } else {
      date.setMonth(date.getMonth() + i);
    }
    
    trends.push({
      period: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 20) + 5,
      amount: Math.floor(Math.random() * 50000) + 10000,
      successful: Math.floor(Math.random() * 18) + 4,
      failed: Math.floor(Math.random() * 3),
    });
  }
  
  return trends;
}

// Helper function to generate mock revenue data
function generateMockRevenueData(startDate: Date, endDate: Date, period: string) {
  const revenue = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const intervals = period === 'daily' ? daysDiff : period === 'weekly' ? Math.ceil(daysDiff / 7) : Math.ceil(daysDiff / 30);
  
  for (let i = 0; i < Math.min(intervals, 12); i++) {
    const date = new Date(startDate);
    if (period === 'daily') {
      date.setDate(date.getDate() + i);
    } else if (period === 'weekly') {
      date.setDate(date.getDate() + (i * 7));
    } else {
      date.setMonth(date.getMonth() + i);
    }
    
    const baseRevenue = Math.floor(Math.random() * 40000) + 20000;
    revenue.push({
      period: date.toISOString().split('T')[0],
      revenue: baseRevenue,
      projected: Math.floor(baseRevenue * (1 + (Math.random() * 0.2 - 0.1))),
      invoices: Math.floor(Math.random() * 15) + 5,
      clients: Math.floor(Math.random() * 8) + 3,
    });
  }
  
  return revenue;
}

// Helper function to calculate growth rate
function calculateGrowthRate(data: any[]) {
  if (data.length < 2) return 0;
  
  const firstValue = data[0].amount || data[0].revenue || 0;
  const lastValue = data[data.length - 1].amount || data[data.length - 1].revenue || 0;
  
  if (firstValue === 0) return 0;
  
  return ((lastValue - firstValue) / firstValue) * 100;
}

// POST endpoint for tracking custom events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, emailId, contactId, metadata } = body;

    if (!type || !emailId || !contactId) {
      return NextResponse.json(
        { error: "Type, emailId, and contactId are required" },
        { status: 400 }
      );
    }

    const engagement = await prisma.emailEvent.create({
      data: {
        type,
        emailId,
        contactId,
        data: JSON.stringify(metadata || {}),
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      engagement,
      message: "Engagement tracked successfully"
    });

  } catch (error) {
    console.error("Error tracking engagement:", error);
    return NextResponse.json(
      { error: "Failed to track engagement" },
      { status: 500 }
    );
  }
}