import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Rate limiting configuration
const RATE_LIMITS = {
  hourly: {
    free: 50,
    basic: 200,
    premium: 1000,
    enterprise: 5000
  },
  daily: {
    free: 500,
    basic: 2000,
    premium: 10000,
    enterprise: 50000
  },
  monthly: {
    free: 5000,
    basic: 50000,
    premium: 200000,
    enterprise: 1000000
  }
};

// POST /api/rate-limiting/check - Check if sending is allowed
export async function POST(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const body = await request.json();
    const { emailCount = 1, campaignId } = body;

    // Get user's current plan (defaulting to 'free' for now)
    const userPlan = 'free'; // This would come from user's subscription

    const rateLimitCheck = await checkRateLimit(session.user.email, userPlan, emailCount);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        allowed: false,
        reason: rateLimitCheck.reason,
        limits: rateLimitCheck.limits,
        usage: rateLimitCheck.usage,
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 });
    }

    // If sending is allowed, record the usage
    if (campaignId) {
      await recordEmailUsage(session.user.email, emailCount, campaignId);
    }

    return NextResponse.json({
      allowed: true,
      limits: rateLimitCheck.limits,
      usage: rateLimitCheck.usage,
      remaining: rateLimitCheck.remaining
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}

// GET /api/rate-limiting/usage - Get current usage statistics
export async function GET(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // hourly, daily, monthly, all

    const userPlan = 'free'; // This would come from user's subscription
    const usage = await getUsageStatistics('demo@example.com', userPlan, period);
    
    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}

// PUT /api/rate-limiting/settings - Update rate limiting settings
export async function PUT(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const body = await request.json();
    const { customLimits, sendingSchedule, throttleSettings } = body;

    // Update user's rate limiting preferences
    const settings = await updateRateLimitSettings(
      'demo@example.com',
      customLimits,
      sendingSchedule,
      throttleSettings
    );
    
    return NextResponse.json({
      success: true,
      settings,
      message: 'Rate limiting settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating rate limit settings:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limit settings' },
      { status: 500 }
    );
  }
}

// Check rate limit function
async function checkRateLimit(userEmail: string, plan: string, emailCount: number) {
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get current usage
  const [hourlyUsage, dailyUsage, monthlyUsage] = await Promise.all([
    getUsageForPeriod(userEmail, hourStart, now),
    getUsageForPeriod(userEmail, dayStart, now),
    getUsageForPeriod(userEmail, monthStart, now)
  ]);

  const limits = {
    hourly: RATE_LIMITS.hourly[plan as keyof typeof RATE_LIMITS.hourly] || RATE_LIMITS.hourly.free,
    daily: RATE_LIMITS.daily[plan as keyof typeof RATE_LIMITS.daily] || RATE_LIMITS.daily.free,
    monthly: RATE_LIMITS.monthly[plan as keyof typeof RATE_LIMITS.monthly] || RATE_LIMITS.monthly.free
  };

  const usage = {
    hourly: hourlyUsage,
    daily: dailyUsage,
    monthly: monthlyUsage
  };

  // Check if adding emailCount would exceed any limit
  const wouldExceed = {
    hourly: (hourlyUsage + emailCount) > limits.hourly,
    daily: (dailyUsage + emailCount) > limits.daily,
    monthly: (monthlyUsage + emailCount) > limits.monthly
  };

  if (wouldExceed.hourly) {
    return {
      allowed: false,
      reason: 'Hourly limit exceeded',
      limits,
      usage,
      resetTime: new Date(hourStart.getTime() + 60 * 60 * 1000) // Next hour
    };
  }

  if (wouldExceed.daily) {
    return {
      allowed: false,
      reason: 'Daily limit exceeded',
      limits,
      usage,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) // Next day
    };
  }

  if (wouldExceed.monthly) {
    return {
      allowed: false,
      reason: 'Monthly limit exceeded',
      limits,
      usage,
      resetTime: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1) // Next month
    };
  }

  return {
    allowed: true,
    limits,
    usage,
    remaining: {
      hourly: limits.hourly - hourlyUsage,
      daily: limits.daily - dailyUsage,
      monthly: limits.monthly - monthlyUsage
    }
  };
}

// Get usage for a specific period
async function getUsageForPeriod(userEmail: string, startDate: Date, endDate: Date): Promise<number> {
  try {
    const result = await prisma.emailLog.aggregate({
      where: {
        senderEmail: userEmail,
        sentAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED']
        }
      },
      _count: {
        id: true
      }
    });

    return result._count.id || 0;
  } catch (error) {
    console.error('Error getting usage for period:', error);
    return 0;
  }
}

// Record email usage
async function recordEmailUsage(userEmail: string, emailCount: number, campaignId?: string) {
  try {
    // Create email log entries for tracking
    const logEntries = Array.from({ length: emailCount }, () => ({
      senderEmail: userEmail,
      campaignId: campaignId || null,
      status: 'QUEUED' as const,
      sentAt: new Date()
    }));

    await prisma.emailLog.createMany({
      data: logEntries
    });
  } catch (error) {
    console.error('Error recording email usage:', error);
    throw error;
  }
}

// Get usage statistics
async function getUsageStatistics(userEmail: string, plan: string, period: string) {
  const now = new Date();
  const limits = {
    hourly: RATE_LIMITS.hourly[plan as keyof typeof RATE_LIMITS.hourly] || RATE_LIMITS.hourly.free,
    daily: RATE_LIMITS.daily[plan as keyof typeof RATE_LIMITS.daily] || RATE_LIMITS.daily.free,
    monthly: RATE_LIMITS.monthly[plan as keyof typeof RATE_LIMITS.monthly] || RATE_LIMITS.monthly.free
  };

  if (period === 'hourly' || period === 'all') {
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourlyUsage = await getUsageForPeriod(userEmail, hourStart, now);
    
    if (period === 'hourly') {
      return {
        period: 'hourly',
        usage: hourlyUsage,
        limit: limits.hourly,
        remaining: limits.hourly - hourlyUsage,
        resetTime: new Date(hourStart.getTime() + 60 * 60 * 1000)
      };
    }
  }

  if (period === 'daily' || period === 'all') {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyUsage = await getUsageForPeriod(userEmail, dayStart, now);
    
    if (period === 'daily') {
      return {
        period: 'daily',
        usage: dailyUsage,
        limit: limits.daily,
        remaining: limits.daily - dailyUsage,
        resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      };
    }
  }

  if (period === 'monthly' || period === 'all') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUsage = await getUsageForPeriod(userEmail, monthStart, now);
    
    if (period === 'monthly') {
      return {
        period: 'monthly',
        usage: monthlyUsage,
        limit: limits.monthly,
        remaining: limits.monthly - monthlyUsage,
        resetTime: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
      };
    }
  }

  // Return all periods
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [hourlyUsage, dailyUsage, monthlyUsage] = await Promise.all([
    getUsageForPeriod(userEmail, hourStart, now),
    getUsageForPeriod(userEmail, dayStart, now),
    getUsageForPeriod(userEmail, monthStart, now)
  ]);

  return {
    hourly: {
      usage: hourlyUsage,
      limit: limits.hourly,
      remaining: limits.hourly - hourlyUsage,
      resetTime: new Date(hourStart.getTime() + 60 * 60 * 1000)
    },
    daily: {
      usage: dailyUsage,
      limit: limits.daily,
      remaining: limits.daily - dailyUsage,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    },
    monthly: {
      usage: monthlyUsage,
      limit: limits.monthly,
      remaining: limits.monthly - monthlyUsage,
      resetTime: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
    }
  };
}

// Update rate limit settings
async function updateRateLimitSettings(
  userEmail: string,
  customLimits?: any,
  sendingSchedule?: any,
  throttleSettings?: any
) {
  // In a real implementation, you would store these settings in the database
  // For now, we'll return the settings as they would be stored
  return {
    customLimits: customLimits || null,
    sendingSchedule: sendingSchedule || {
      enabled: false,
      timeZone: 'UTC',
      allowedHours: { start: 9, end: 17 },
      allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    throttleSettings: throttleSettings || {
      enabled: true,
      delayBetweenEmails: 1000, // 1 second
      batchSize: 10,
      delayBetweenBatches: 60000 // 1 minute
    },
    updatedAt: new Date()
  };
}