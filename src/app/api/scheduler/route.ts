import { NextRequest, NextResponse } from 'next/server';
import { 
  processScheduledEmails
} from '@/lib/scheduler';
import { prisma } from '@/lib/db';

// GET /api/scheduler - Get scheduler status and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sequenceId = searchParams.get('sequenceId');

    switch (action) {
      case 'pending':
        const pendingEmails = await prisma.scheduledEmail.findMany({
          where: {
            status: 'pending',
            scheduledAt: {
              lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            }
          },
          include: {
            contact: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'asc'
          },
          take: 50
        });
        return NextResponse.json(pendingEmails);

      case 'runs':
        const activeRuns = await prisma.sequenceRun.findMany({
          where: {
            status: 'active',
            ...(sequenceId && { sequenceId })
          },
          include: {
            contact: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            executedAt: 'desc'
          },
          take: 50
        });
        return NextResponse.json(activeRuns);

      default:
        // Return general scheduler status
        const [totalPending, totalActive, recentActivity] = await Promise.all([
          prisma.scheduledEmail.count({
            where: { status: 'pending' }
          }),
          Promise.resolve(0), // Sequences functionality removed
          prisma.scheduledEmail.findMany({
            where: {
              status: 'sent',
              sentAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            },
            take: 10,
            orderBy: {
              sentAt: 'desc'
            }
          })
        ]);

        return NextResponse.json({
          status: 'active',
          pendingEmails: totalPending,
          activeSequences: 0, // Sequences functionality removed
          emailsSentToday: recentActivity.length,
          lastProcessed: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in scheduler GET:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler data' },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - Control scheduler actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sequenceId, contactId, stepId, delayInHours } = body;

    switch (action) {
      case 'process':
        // Manually trigger email processing
        const result = await processScheduledEmails();
        return NextResponse.json({
          success: true,
          message: 'Scheduled emails processed',
          stats: result
        });

      // Sequences functionality removed

      case 'schedule_email':
        if (!sequenceId || !contactId || !stepId) {
          return NextResponse.json(
            { error: 'Sequence ID, Contact ID, and Step ID are required' },
            { status: 400 }
          );
        }
        
        const scheduledId = await scheduleSequenceEmail(
          sequenceId,
          contactId,
          stepId,
          delayInHours || 0
        );
        
        return NextResponse.json({
          success: true,
          message: 'Email scheduled successfully',
          scheduledId
        });

      case 'bulk_start':
        // Sequences functionality removed
        return NextResponse.json(
          { error: 'Sequences functionality has been removed' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in scheduler POST:', error);
    return NextResponse.json(
      { error: 'Failed to execute scheduler action' },
      { status: 500 }
    );
  }
}

// PUT /api/scheduler - Update scheduled emails
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduledEmailId, action, newScheduledAt } = body;

    if (!scheduledEmailId) {
      return NextResponse.json(
        { error: 'Scheduled email ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'reschedule':
        if (!newScheduledAt) {
          return NextResponse.json(
            { error: 'New scheduled time is required' },
            { status: 400 }
          );
        }
        
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: { scheduledAt: new Date(newScheduledAt) }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Email rescheduled successfully'
        });

      case 'cancel':
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: { status: 'cancelled' }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Email cancelled successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in scheduler PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled email' },
      { status: 500 }
    );
  }
}