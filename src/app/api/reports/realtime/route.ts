import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/reports/realtime - Fetch real-time analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'USD';
    
    // Get real-time data from the last 24 hours for immediate updates
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch real-time metrics in parallel for better performance
    const [realtimeMetrics, trends, recentActivity] = await Promise.all([
      getRealTimeMetrics(currency, last30Days, now),
      getTrendData(currency, last30Days, now),
      getRecentActivity(last24Hours, now)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics: realtimeMetrics,
        trends,
        recentActivity,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}

// Get real-time metrics
async function getRealTimeMetrics(currency: string, fromDate: Date, toDate: Date) {
  const [leads, deals, invoices, campaigns, contacts, payments, emailMetrics] = await Promise.all([
    // Total leads
    prisma.lead.count({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      }
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
        createdAt: { gte: fromDate, lte: toDate }
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
    prisma.contact.count({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      }
    }),
    
    // Payment metrics
    prisma.payment.aggregate({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        currency,
        status: 'completed'
      },
      _count: { id: true },
      _sum: { amount: true },
      _avg: { amount: true }
    }),
    
    // Email engagement metrics
    Promise.all([
      prisma.emailOpen.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate }
        }
      }),
      prisma.emailClick.count({
        where: {
          timestamp: { gte: fromDate, lte: toDate }
        }
      })
    ])
  ]);

  const [emailOpens, emailClicks] = emailMetrics;
  const totalEmailsSent = campaigns._sum?.sentCount || 0;
  
  return {
    totalLeads: leads,
    totalDeals: deals._count.id || 0,
    totalRevenue: deals._sum.value || 0,
    averageDealValue: deals._avg.value || 0,
    totalInvoices: invoices._count.id || 0,
    totalInvoiceAmount: invoices._sum.totalAmount || 0,
    averageInvoiceAmount: invoices._avg.totalAmount || 0,
    totalCampaigns: campaigns._count.id || 0,
    totalContacts: contacts,
    totalPayments: payments._count.id || 0,
    totalPaymentAmount: payments._sum.amount || 0,
    emailOpenRate: totalEmailsSent > 0 ? (emailOpens / totalEmailsSent) * 100 : 0,
    emailClickRate: totalEmailsSent > 0 ? (emailClicks / totalEmailsSent) * 100 : 0,
    conversionRate: leads > 0 ? (deals._count.id / leads) * 100 : 0
  };
}

// Get trend data for charts
async function getTrendData(currency: string, fromDate: Date, toDate: Date) {
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const trends = [];
  
  for (let i = 0; i < Math.min(days, 30); i++) {
    const dayStart = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const [dailyLeads, dailyDeals, dailyRevenue] = await Promise.all([
      prisma.lead.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd }
        }
      }),
      prisma.deal.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          currency
        }
      }),
      prisma.deal.aggregate({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          currency
        },
        _sum: { value: true }
      })
    ]);
    
    trends.push({
      date: dayStart.toISOString().split('T')[0],
      leads: dailyLeads,
      deals: dailyDeals,
      revenue: dailyRevenue._sum.value || 0
    });
  }
  
  return trends;
}

// Get recent activity
async function getRecentActivity(fromDate: Date, toDate: Date) {
  const [recentLeads, recentDeals, recentPayments] = await Promise.all([
    prisma.lead.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate }
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    
    prisma.deal.findMany({
      where: {
        updatedAt: { gte: fromDate, lte: toDate }
      },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    }),
    
    prisma.payment.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: 'completed'
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);
  
  return {
    recentLeads,
    recentDeals,
    recentPayments
  };
}

// POST /api/reports/realtime - Subscribe to real-time updates (WebSocket simulation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, currency = 'USD' } = body;
    
    if (action === 'subscribe') {
      // In a real implementation, this would establish a WebSocket connection
      // For now, we'll return the current data with a subscription confirmation
      const realtimeData = await getRealTimeMetrics(currency, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      
      return NextResponse.json({
        success: true,
        subscribed: true,
        data: realtimeData,
        message: 'Subscribed to real-time updates',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling real-time subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}