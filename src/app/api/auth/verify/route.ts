import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-static';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/auth/verify - Verify JWT token and return user data
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    try {
      // Verify and decode token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Find user and session
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Account is inactive' },
          { status: 401 }
        );
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
        return NextResponse.json(
          { success: false, error: 'Session expired or invalid' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          user,
          sessionId: session.id,
          expiresAt: session.expiresAt.toISOString()
        }
      });
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
