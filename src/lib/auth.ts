import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  };
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        success: false,
        error: 'No token provided'
      };
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Account is inactive'
      };
    }

    // Check if session exists and is active
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return {
        success: false,
        error: 'Invalid or expired session'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }
}

export async function requireAuth(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    throw new Error(authResult.error || 'Authentication failed');
  }
  return authResult.user!;
}

export async function requireAdminAuth(request: NextRequest) {
  const user = await requireAuth(request);
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}