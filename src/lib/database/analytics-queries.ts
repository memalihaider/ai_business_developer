import { PrismaClient } from '@prisma/client';
import { cache } from 'react';

// Connection pooling configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Optimized query functions with caching
export const getAnalyticsOverview = cache(async (timeRange: string = '30d') => {
  const dateFilter = getDateFilter(timeRange);
  
  try {
    const [totalMetrics, platformMetrics, recentActivity] = await Promise.all([
      // Total metrics aggregation
      prisma.socialAnalytics.aggregate({
        where: { date: { gte: dateFilter } },
        _sum: {
          shares: true,
          clicks: true,
          likes: true,
          comments: true,
          reposts: true,
          reach: true,
          impressions: true,
        },
        _avg: {
          engagement: true,
        },
      }),
      
      // Platform-specific metrics
      prisma.socialAnalytics.groupBy({
        by: ['platformId'],
        where: { date: { gte: dateFilter } },
        _sum: {
          shares: true,
          clicks: true,
          likes: true,
          comments: true,
          reposts: true,
          reach: true,
          impressions: true,
        },
        _avg: {
          engagement: true,
        },
      }),
      
      // Recent activity (last 24 hours)
      prisma.socialShare.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          platform: true,
          clicks: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);
    
    return {
      totalMetrics,
      platformMetrics,
      recentActivity,
    };
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    throw new Error('Failed to fetch analytics data');
  }
});

export const getPlatformAnalytics = cache(async (platformId: string, timeRange: string = '30d') => {
  const dateFilter = getDateFilter(timeRange);
  
  try {
    const [analytics, topPosts, engagement] = await Promise.all([
      // Time series data
      prisma.socialAnalytics.findMany({
        where: {
          platformId,
          date: { gte: dateFilter },
        },
        orderBy: { date: 'asc' },
      }),
      
      // Top performing posts
      prisma.socialShare.findMany({
        where: {
          platformId,
          timestamp: { gte: dateFilter },
        },
        include: {
          clicks: true,
          platform: true,
        },
        orderBy: {
          clicks: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
      
      // Engagement trends
      prisma.socialAnalytics.findMany({
        where: {
          platformId,
          date: { gte: dateFilter },
        },
        select: {
          date: true,
          engagement: true,
          likes: true,
          comments: true,
          reposts: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);
    
    return {
      analytics,
      topPosts,
      engagement,
    };
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    throw new Error('Failed to fetch platform analytics');
  }
});

export const getRealTimeMetrics = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const [recentShares, recentClicks, activeConnections] = await Promise.all([
      // Recent shares (last hour)
      prisma.socialShare.count({
        where: {
          timestamp: { gte: oneHourAgo },
        },
      }),
      
      // Recent clicks (last hour)
      prisma.socialClick.count({
        where: {
          timestamp: { gte: oneHourAgo },
        },
      }),
      
      // Active platform connections
      prisma.socialPlatform.count({
        where: {
          isActive: true,
        },
      }),
    ]);
    
    return {
      recentShares,
      recentClicks,
      activeConnections,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    throw new Error('Failed to fetch real-time metrics');
  }
};

export const getEngagementTrends = cache(async (timeRange: string = '30d') => {
  const dateFilter = getDateFilter(timeRange);
  
  try {
    const trends = await prisma.socialAnalytics.findMany({
      where: {
        date: { gte: dateFilter },
      },
      select: {
        date: true,
        platformId: true,
        engagement: true,
        likes: true,
        comments: true,
        reposts: true,
        reach: true,
        impressions: true,
      },
      orderBy: { date: 'asc' },
    });
    
    // Group by date and aggregate across platforms
    const groupedTrends = trends.reduce((acc, item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          engagement: 0,
          likes: 0,
          comments: 0,
          reposts: 0,
          reach: 0,
          impressions: 0,
          count: 0,
        };
      }
      
      acc[dateKey].engagement += item.engagement;
      acc[dateKey].likes += item.likes;
      acc[dateKey].comments += item.comments;
      acc[dateKey].reposts += item.reposts;
      acc[dateKey].reach += item.reach;
      acc[dateKey].impressions += item.impressions;
      acc[dateKey].count += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate averages
    return Object.values(groupedTrends).map((trend: any) => ({
      ...trend,
      engagement: trend.engagement / trend.count,
    }));
  } catch (error) {
    console.error('Error fetching engagement trends:', error);
    throw new Error('Failed to fetch engagement trends');
  }
});

export const getTopContent = cache(async (timeRange: string = '30d', limit: number = 10) => {
  const dateFilter = getDateFilter(timeRange);
  
  try {
    const topContent = await prisma.socialShare.findMany({
      where: {
        timestamp: { gte: dateFilter },
      },
      include: {
        platform: {
          select: {
            name: true,
            displayName: true,
          },
        },
        clicks: {
          select: {
            id: true,
            timestamp: true,
          },
        },
        _count: {
          select: {
            clicks: true,
          },
        },
      },
      orderBy: {
        clicks: {
          _count: 'desc',
        },
      },
      take: limit,
    });
    
    return topContent;
  } catch (error) {
    console.error('Error fetching top content:', error);
    throw new Error('Failed to fetch top content');
  }
});

// Utility function to get date filter based on time range
function getDateFilter(timeRange: string): Date {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
};

// Cleanup function for graceful shutdown
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};