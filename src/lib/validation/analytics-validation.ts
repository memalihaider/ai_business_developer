import { z } from 'zod';

// Schema definitions for analytics data validation
export const SocialPlatformSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  isActive: z.boolean().default(true),
  settings: z.string().optional(), // JSON string
});

export const SocialShareSchema = z.object({
  id: z.string().cuid(),
  platformId: z.string().cuid(),
  campaignId: z.string().optional(),
  contactId: z.string().cuid().optional(),
  emailId: z.string().cuid().optional(),
  shareUrl: z.string().url(),
  shareText: z.string().optional(),
  shareType: z.enum(['manual', 'auto', 'scheduled']).default('manual'),
  postId: z.string().optional(),
  status: z.enum(['pending', 'posted', 'failed']).default('pending'),
  engagement: z.string().optional(), // JSON string
  timestamp: z.date().default(() => new Date()),
});

export const SocialAnalyticsSchema = z.object({
  id: z.string().cuid(),
  platformId: z.string().cuid(),
  campaignId: z.string().optional(),
  date: z.date().default(() => new Date()),
  shares: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  reposts: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).default(0),
  engagement: z.number().min(0).max(100).default(0), // Percentage
});

export const RealtimeMetricsSchema = z.object({
  timestamp: z.string().datetime(),
  totalShares: z.number().int().min(0),
  totalClicks: z.number().int().min(0),
  totalLikes: z.number().int().min(0),
  totalComments: z.number().int().min(0),
  engagementRate: z.string().regex(/^\d+\.\d{2}$/), // Format: "X.XX"
  activeUsers: z.number().int().min(0),
  activeConnections: z.number().int().min(0),
});

export const PlatformMetricsSchema = z.object({
  platform: z.string().min(1),
  shares: z.number().int().min(0),
  clicks: z.number().int().min(0),
  engagement: z.string().regex(/^\d+\.\d{2}$/),
  growth: z.string().regex(/^-?\d+\.\d$/),
});

export const AlertSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['spike', 'drop', 'milestone', 'error']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  timestamp: z.string().datetime(),
  severity: z.enum(['low', 'medium', 'high']),
});

export const TimeRangeSchema = z.enum(['24h', '7d', '30d', '90d']);

// API request/response schemas
export const AnalyticsQuerySchema = z.object({
  timeRange: TimeRangeSchema.default('30d'),
  platformId: z.string().cuid().optional(),
  campaignId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(10),
});

export const RealtimeConnectionSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  filters: z.object({
    platforms: z.array(z.string()).optional(),
    alertTypes: z.array(z.string()).optional(),
  }).optional(),
});

// Validation functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSocialPlatform(data: unknown) {
  try {
    return SocialPlatformSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid social platform data: ${error.errors.map(e => e.message).join(', ')}`,
        error.errors[0]?.path.join('.'),
        'INVALID_PLATFORM_DATA'
      );
    }
    throw error;
  }
}

export function validateSocialShare(data: unknown) {
  try {
    return SocialShareSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid social share data: ${error.errors.map(e => e.message).join(', ')}`,
        error.errors[0]?.path.join('.'),
        'INVALID_SHARE_DATA'
      );
    }
    throw error;
  }
}

export function validateAnalyticsData(data: unknown) {
  try {
    return SocialAnalyticsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid analytics data: ${error.errors.map(e => e.message).join(', ')}`,
        error.errors[0]?.path.join('.'),
        'INVALID_ANALYTICS_DATA'
      );
    }
    throw error;
  }
}

export function validateRealtimeMetrics(data: unknown) {
  try {
    return RealtimeMetricsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid realtime metrics: ${error.errors.map(e => e.message).join(', ')}`,
        error.errors[0]?.path.join('.'),
        'INVALID_REALTIME_DATA'
      );
    }
    throw error;
  }
}

export function validateAnalyticsQuery(data: unknown) {
  try {
    return AnalyticsQuerySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`,
        error.errors[0]?.path.join('.'),
        'INVALID_QUERY_PARAMS'
      );
    }
    throw error;
  }
}

// Data sanitization functions
export function sanitizeAnalyticsData(data: any) {
  // Remove sensitive fields
  const sanitized = { ...data };
  delete sanitized.apiKey;
  delete sanitized.apiSecret;
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  
  // Ensure numeric values are within reasonable bounds
  if (sanitized.shares) sanitized.shares = Math.max(0, Math.min(sanitized.shares, 1000000));
  if (sanitized.clicks) sanitized.clicks = Math.max(0, Math.min(sanitized.clicks, 1000000));
  if (sanitized.likes) sanitized.likes = Math.max(0, Math.min(sanitized.likes, 1000000));
  if (sanitized.comments) sanitized.comments = Math.max(0, Math.min(sanitized.comments, 100000));
  if (sanitized.reach) sanitized.reach = Math.max(0, Math.min(sanitized.reach, 10000000));
  if (sanitized.impressions) sanitized.impressions = Math.max(0, Math.min(sanitized.impressions, 100000000));
  
  // Ensure engagement rate is a valid percentage
  if (sanitized.engagement) {
    sanitized.engagement = Math.max(0, Math.min(sanitized.engagement, 100));
  }
  
  return sanitized;
}

export function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>"'&]/g, '') // Remove HTML/XML characters
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .trim()
    .substring(0, 1000); // Limit length
}

// Rate limiting helpers
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Error handling utilities
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);
  
  if (error.code === 'P2002') {
    throw new ValidationError('Duplicate entry detected', undefined, 'DUPLICATE_ENTRY');
  }
  
  if (error.code === 'P2025') {
    throw new ValidationError('Record not found', undefined, 'NOT_FOUND');
  }
  
  if (error.code === 'P2003') {
    throw new ValidationError('Foreign key constraint failed', undefined, 'CONSTRAINT_FAILED');
  }
  
  throw new ValidationError('Database operation failed', undefined, 'DATABASE_ERROR');
}

export function handleApiError(error: any): { status: number; message: string; code?: string } {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      message: error.message,
      code: error.code,
    };
  }
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return {
      status: 400,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
    };
  }
  
  if (error.name === 'PrismaClientUnknownRequestError') {
    return {
      status: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }
  
  return {
    status: 500,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// Export rate limiter instance
export const analyticsRateLimiter = new RateLimiter(1000, 60000); // 1000 requests per minute
export const realtimeRateLimiter = new RateLimiter(60, 60000); // 60 requests per minute for real-time