import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get leads metrics
    const [totalLeads, newLeadsThisMonth, recentLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          company: true,
          createdAt: true
        }
      })
    ]);

    // Get proposals metrics
    const [totalProposals, proposalsSentThisMonth, pendingProposals] = await Promise.all([
      prisma.proposal.count(),
      prisma.proposal.count({
        where: {
          sentAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.proposal.count({
        where: {
          isDraft: false,
          acceptedAt: null,
          rejectedAt: null
        }
      })
    ]);

    // Get deals/projects metrics
    const [totalDeals, wonDeals, dealValue] = await Promise.all([
      prisma.deal.count(),
      prisma.deal.count({
        where: {
          stage: 'closed-won'
        }
      }),
      prisma.deal.aggregate({
        where: {
          stage: 'closed-won',
          actualCloseDate: {
            gte: startOfQuarter
          }
        },
        _sum: {
          value: true
        }
      })
    ]);

    // Get revenue from quotations and deals
    const [quotationRevenue, dealRevenue] = await Promise.all([
      prisma.quotation.aggregate({
        where: {
          status: 'accepted',
          acceptedAt: {
            gte: startOfQuarter
          }
        },
        _sum: {
          total: true
        }
      }),
      dealValue
    ]);

    const totalRevenue = (quotationRevenue._sum.total || 0) + (dealRevenue._sum.value || 0);

    // Get recent activities
    const recentActivities = await Promise.all([
      prisma.deal.findMany({
        take: 3,
        where: {
          updatedAt: {
            gte: sevenDaysAgo
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          stage: true,
          value: true,
          updatedAt: true
        }
      }),
      prisma.proposal.findMany({
        take: 3,
        where: {
          updatedAt: {
            gte: sevenDaysAgo
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          clientName: true,
          isDraft: true,
          updatedAt: true
        }
      })
    ]);

    // Get chart data for the last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const [dayLeads, dayProposals, dayDeals, dayRevenue] = await Promise.all([
        prisma.lead.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.proposal.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.deal.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.quotation.aggregate({
          where: {
            status: 'accepted',
            acceptedAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          _sum: {
            total: true
          }
        })
      ]);

      chartData.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: date.toISOString().split('T')[0],
        leads: dayLeads,
        proposals: dayProposals,

        revenue: dayRevenue._sum.total || 0
      });
    }

    // Format activities for display
    const formattedActivities = [
      ...recentActivities[0].map(deal => `Deal "${deal.title}" moved to ${deal.stage}`),
      ...recentActivities[1].map(proposal => `Proposal "${proposal.title}" ${proposal.isDraft ? 'drafted' : 'updated'} for ${proposal.clientName}`)
    ].slice(0, 5);

    const metrics = {
      leads: {
        total: totalLeads,
        thisMonth: newLeadsThisMonth,
        recent: recentLeads
      },
      proposals: {
        total: totalProposals,
        sent: proposalsSentThisMonth,
        pending: pendingProposals
      },

      revenue: {
        total: totalRevenue,
        thisQuarter: totalRevenue,
        currency: 'USD'
      },
      activities: formattedActivities,
      chartData: chartData,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: Add POST method for real-time updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh':
        // Trigger a refresh of cached data if needed
        return NextResponse.json({ success: true, message: 'Refresh triggered' });
      
      case 'update_metric':
        // Handle specific metric updates
        return NextResponse.json({ success: true, message: 'Metric updated' });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Dashboard metrics POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}