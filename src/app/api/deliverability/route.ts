import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/deliverability - Get email deliverability analytics
export async function GET(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const campaignId = searchParams.get('campaignId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || '7d';

    // Set default date range
    const now = new Date();
    let fromDate = new Date();
    let toDate = now;

    if (dateFrom && dateTo) {
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      switch (period) {
        case '24h':
          fromDate.setHours(fromDate.getHours() - 24);
          break;
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(fromDate.getDate() - 30);
          break;
        default:
          fromDate.setDate(fromDate.getDate() - 7);
      }
    }

    switch (type) {
      case 'overview':
        return await getDeliverabilityOverview(fromDate, toDate, campaignId);
      case 'reputation':
        return await getReputationMetrics(fromDate, toDate);
      case 'bounces':
        return await getBounceAnalytics(fromDate, toDate, campaignId);
      case 'spam':
        return await getSpamAnalytics(fromDate, toDate, campaignId);
      case 'engagement':
        return await getEngagementMetrics(fromDate, toDate, campaignId);
      case 'trends':
        return await getDeliverabilityTrends(fromDate, toDate, campaignId);
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching deliverability analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverability analytics' },
      { status: 500 }
    );
  }
}

// Get deliverability overview
async function getDeliverabilityOverview(fromDate: Date, toDate: Date, campaignId?: string | null) {
  const where: any = {
    sentAt: {
      gte: fromDate,
      lte: toDate
    }
  };

  if (campaignId) {
    where.campaignId = campaignId;
  }

  // Get email statistics by status
  const emailStats = await prisma.emailLog.groupBy({
    by: ['status'],
    where,
    _count: {
      id: true
    }
  });

  // Get bounce statistics
  const bounceStats = await prisma.emailLog.groupBy({
    by: ['bounceType'],
    where: {
      ...where,
      status: 'BOUNCED'
    },
    _count: {
      id: true
    }
  });

  // Get engagement events
  const engagementStats = await prisma.emailEvent.groupBy({
    by: ['type'],
    where: {
      timestamp: {
        gte: fromDate,
        lte: toDate
      },
      ...(campaignId && {
        emailLog: {
          campaignId
        }
      })
    },
    _count: {
      id: true
    }
  });

  // Calculate metrics
  const totalSent = emailStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const delivered = emailStats.find(s => s.status === 'DELIVERED')?._count.id || 0;
  const bounced = emailStats.find(s => s.status === 'BOUNCED')?._count.id || 0;
  const failed = emailStats.find(s => s.status === 'FAILED')?._count.id || 0;
  const spam = emailStats.find(s => s.status === 'SPAM')?._count.id || 0;
  
  const opens = engagementStats.find(s => s.type === 'OPEN')?._count.id || 0;
  const clicks = engagementStats.find(s => s.type === 'CLICK')?._count.id || 0;
  const unsubscribes = engagementStats.find(s => s.type === 'UNSUBSCRIBE')?._count.id || 0;
  const complaints = engagementStats.find(s => s.type === 'COMPLAINT')?._count.id || 0;

  // Calculate rates
  const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
  const openRate = delivered > 0 ? (opens / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicks / delivered) * 100 : 0;
  const unsubscribeRate = delivered > 0 ? (unsubscribes / delivered) * 100 : 0;
  const complaintRate = delivered > 0 ? (complaints / delivered) * 100 : 0;

  // Bounce breakdown
  const hardBounces = bounceStats.find(s => s.bounceType === 'HARD')?._count.id || 0;
  const softBounces = bounceStats.find(s => s.bounceType === 'SOFT')?._count.id || 0;

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalSent,
        delivered,
        bounced,
        failed,
        spam
      },
      rates: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 100) / 100
      },
      engagement: {
        opens,
        clicks,
        unsubscribes,
        complaints
      },
      bounces: {
        total: bounced,
        hard: hardBounces,
        soft: softBounces
      },
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Get reputation metrics
async function getReputationMetrics(fromDate: Date, toDate: Date) {
  // Get domain reputation data
  const domainStats = await prisma.emailLog.groupBy({
    by: ['senderDomain'],
    where: {
      sentAt: {
        gte: fromDate,
        lte: toDate
      }
    },
    _count: {
      id: true
    },
    _avg: {
      reputationScore: true
    }
  });

  // Get IP reputation data
  const ipStats = await prisma.emailLog.groupBy({
    by: ['senderIp'],
    where: {
      sentAt: {
        gte: fromDate,
        lte: toDate
      }
    },
    _count: {
      id: true
    },
    _avg: {
      reputationScore: true
    }
  });

  // Calculate overall reputation score
  const overallReputation = await prisma.emailLog.aggregate({
    where: {
      sentAt: {
        gte: fromDate,
        lte: toDate
      }
    },
    _avg: {
      reputationScore: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      overall: {
        score: Math.round((overallReputation._avg.reputationScore || 0) * 100) / 100,
        status: getReputationStatus(overallReputation._avg.reputationScore || 0)
      },
      domains: domainStats.map(stat => ({
        domain: stat.senderDomain,
        emailCount: stat._count.id,
        avgScore: Math.round((stat._avg.reputationScore || 0) * 100) / 100,
        status: getReputationStatus(stat._avg.reputationScore || 0)
      })),
      ips: ipStats.map(stat => ({
        ip: stat.senderIp,
        emailCount: stat._count.id,
        avgScore: Math.round((stat._avg.reputationScore || 0) * 100) / 100,
        status: getReputationStatus(stat._avg.reputationScore || 0)
      })),
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Get bounce analytics
async function getBounceAnalytics(fromDate: Date, toDate: Date, campaignId?: string | null) {
  const where: any = {
    sentAt: {
      gte: fromDate,
      lte: toDate
    },
    status: 'BOUNCED'
  };

  if (campaignId) {
    where.campaignId = campaignId;
  }

  // Get bounce reasons
  const bounceReasons = await prisma.emailLog.groupBy({
    by: ['bounceReason'],
    where,
    _count: {
      id: true
    }
  });

  // Get bounce trends by day
  const bounceTrends = await prisma.$queryRaw`
    SELECT 
      DATE(sent_at) as date,
      bounce_type,
      COUNT(*) as count
    FROM email_logs 
    WHERE sent_at >= ${fromDate} 
      AND sent_at <= ${toDate} 
      AND status = 'BOUNCED'
      ${campaignId ? prisma.$queryRaw`AND campaign_id = ${campaignId}` : prisma.$queryRaw``}
    GROUP BY DATE(sent_at), bounce_type
    ORDER BY date ASC
  `;

  return NextResponse.json({
    success: true,
    data: {
      reasons: bounceReasons.map(reason => ({
        reason: reason.bounceReason,
        count: reason._count.id
      })),
      trends: bounceTrends,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Get spam analytics
async function getSpamAnalytics(fromDate: Date, toDate: Date, campaignId?: string | null) {
  const where: any = {
    sentAt: {
      gte: fromDate,
      lte: toDate
    }
  };

  if (campaignId) {
    where.campaignId = campaignId;
  }

  // Get spam complaints
  const spamComplaints = await prisma.emailEvent.count({
    where: {
      type: 'COMPLAINT',
      timestamp: {
        gte: fromDate,
        lte: toDate
      },
      ...(campaignId && {
        emailLog: {
          campaignId
        }
      })
    }
  });

  // Get emails marked as spam
  const spamEmails = await prisma.emailLog.count({
    where: {
      ...where,
      status: 'SPAM'
    }
  });

  // Get spam score distribution
  const spamScores = await prisma.emailLog.groupBy({
    by: ['spamScore'],
    where,
    _count: {
      id: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      complaints: spamComplaints,
      spamEmails,
      scoreDistribution: spamScores.map(score => ({
        score: score.spamScore,
        count: score._count.id
      })),
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Get engagement metrics
async function getEngagementMetrics(fromDate: Date, toDate: Date, campaignId?: string | null) {
  const where: any = {
    timestamp: {
      gte: fromDate,
      lte: toDate
    }
  };

  if (campaignId) {
    where.emailLog = {
      campaignId
    };
  }

  // Get engagement by type and time
  const engagementTrends = await prisma.$queryRaw`
    SELECT 
      DATE(timestamp) as date,
      type,
      COUNT(*) as count
    FROM email_events 
    WHERE timestamp >= ${fromDate} 
      AND timestamp <= ${toDate}
      ${campaignId ? prisma.$queryRaw`AND email_log_id IN (
        SELECT id FROM email_logs WHERE campaign_id = ${campaignId}
      )` : prisma.$queryRaw``}
    GROUP BY DATE(timestamp), type
    ORDER BY date ASC
  `;

  // Get engagement by device/client
  const deviceStats = await prisma.emailEvent.groupBy({
    by: ['userAgent'],
    where,
    _count: {
      id: true
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      trends: engagementTrends,
      devices: deviceStats.map(stat => ({
        userAgent: stat.userAgent,
        count: stat._count.id
      })),
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Get deliverability trends
async function getDeliverabilityTrends(fromDate: Date, toDate: Date, campaignId?: string | null) {
  const dailyStats = await prisma.$queryRaw`
    SELECT 
      DATE(sent_at) as date,
      status,
      COUNT(*) as count
    FROM email_logs 
    WHERE sent_at >= ${fromDate} 
      AND sent_at <= ${toDate}
      ${campaignId ? prisma.$queryRaw`AND campaign_id = ${campaignId}` : prisma.$queryRaw``}
    GROUP BY DATE(sent_at), status
    ORDER BY date ASC
  `;

  return NextResponse.json({
    success: true,
    data: {
      trends: dailyStats,
      period: {
        from: fromDate,
        to: toDate
      }
    }
  });
}

// Helper function to determine reputation status
function getReputationStatus(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}