import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
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
      
      // Find and invalidate the session
      const session = await prisma.userSession.findFirst({
        where: {
          userId: decoded.userId,
          token,
          isActive: true
        }
      });

      if (session) {
        // Mark session as inactive
        await prisma.userSession.update({
          where: { id: session.id },
          data: { 
            isActive: false,
            loggedOutAt: new Date()
          }
        });

        // Log logout activity
        await prisma.userActivity.create({
          data: {
            userId: decoded.userId,
            action: 'LOGOUT',
            details: 'User logged out successfully',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (jwtError) {
      // Token is invalid or expired, but we still want to return success
      // since the goal of logout is achieved
      return NextResponse.json({
        success: true,
        message: 'Logout successful'
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// POST /api/auth/logout-all - Logout from all devices
export async function DELETE(request: NextRequest) {
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
      
      // Invalidate all active sessions for the user
      const updatedSessions = await prisma.userSession.updateMany({
        where: {
          userId: decoded.userId,
          isActive: true
        },
        data: {
          isActive: false,
          loggedOutAt: new Date()
        }
      });

      // Log logout from all devices activity
      await prisma.userActivity.create({
        data: {
          userId: decoded.userId,
          action: 'LOGOUT_ALL',
          details: `Logged out from all devices (${updatedSessions.count} sessions)`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        success: true,
        message: `Logged out from all devices (${updatedSessions.count} sessions)`,
        data: {
          sessionsLoggedOut: updatedSessions.count
        }
      });
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error during logout from all devices:', error);
    return NextResponse.json(
      { success: false, error: 'Logout from all devices failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}