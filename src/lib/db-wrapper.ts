import { PrismaClient } from '@prisma/client';
import { prisma } from './db';

// Database connection status
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    connectionRetries = 0;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    isConnected = false;
    return false;
  }
}

// Retry mechanism for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before operation
      if (!isConnected) {
        await checkDatabaseConnection();
      }
      
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Don't retry for certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  
  throw lastError;
}

// Check if error should not be retried
function isNonRetryableError(error: any): boolean {
  // Prisma error codes that shouldn't be retried
  const nonRetryableCodes = [
    'P2002', // Unique constraint violation
    'P2025', // Record not found
    'P2003', // Foreign key constraint violation
    'P2004', // Constraint violation
    'P2014', // Invalid ID
    'P2015', // Related record not found
    'P2016', // Query interpretation error
    'P2017', // Records not connected
    'P2018', // Required connected records not found
    'P2019', // Input error
    'P2020', // Value out of range
    'P2021', // Table does not exist
    'P2022', // Column does not exist
  ];
  
  return nonRetryableCodes.includes(error.code);
}

// Enhanced error handling wrapper
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);
  
  // Map Prisma errors to user-friendly messages
  switch (error.code) {
    case 'P2002':
      const field = error.meta?.target?.[0] || 'field';
      throw new Error(`A record with this ${field} already exists`);
    case 'P2025':
      throw new Error('Record not found');
    case 'P2003':
      throw new Error('Cannot delete record due to related data');
    case 'P2014':
      throw new Error('Invalid ID provided');
    case 'P1001':
      throw new Error('Database connection failed');
    case 'P1002':
      throw new Error('Database connection timeout');
    case 'P1008':
      throw new Error('Database operation timeout');
    case 'P1017':
      throw new Error('Database connection lost');
    default:
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('An unexpected database error occurred');
  }
}

// Secure database operation wrapper
export async function secureOperation<T>(
  operation: () => Promise<T>,
  context?: { userId?: string; action?: string; resource?: string }
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Log operation start (for audit purposes)
    if (context) {
      console.log(`Database operation started:`, {
        userId: context.userId,
        action: context.action,
        resource: context.resource,
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await withRetry(operation);
    
    // Log successful operation
    const duration = Date.now() - startTime;
    if (context && duration > 1000) { // Log slow queries
      console.warn(`Slow database operation:`, {
        ...context,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error) {
    // Log failed operation
    if (context) {
      console.error(`Database operation failed:`, {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    handleDatabaseError(error);
  }
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>"'&]/g, '');
}

export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${fieldName} is required`);
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Initialize database connection on startup
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database connection...');
    await checkDatabaseConnection();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    isConnected = false;
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}