import { NextRequest, NextResponse } from 'next/server';
import { proposalOperations, templateOperations, analyticsOperations, prisma } from '@/lib/db';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {

  try {
    // Get analytics summary
    const analyticsSummary = await analyticsOperations.getAnalyticsSummary();
    
    // Get template count
    const templates = await templateOperations.getAllTemplates();
    const templateCount = templates.length;
    
    // Calculate average processing time from recent proposals
    let recentProposals = [];
    try {
      recentProposals = await prisma.proposalAnalytics.findMany({
        where: {
          event: 'generated',
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100 // Last 100 generations
      });
    } catch (analyticsError) {
      console.warn('ProposalAnalytics table not accessible, using defaults:', analyticsError);
      recentProposals = [];
    }

    // Calculate average time (simulated based on proposal complexity)
    let averageTime = 0;
    if (recentProposals.length > 0) {
      // Simulate processing time based on metadata
      const totalTime = recentProposals.reduce((sum, proposal) => {
        const metadata = proposal.metadata ? JSON.parse(proposal.metadata) : {};
        const baseTime = 3; // Base 3 minutes
        const templateBonus = metadata.templateUsed ? -1 : 0; // Templates are faster
        const sectionPenalty = (metadata.customSections || 0) * 0.5; // Custom sections add time
        return sum + Math.max(1, baseTime + templateBonus + sectionPenalty);
      }, 0);
      averageTime = Math.round(totalTime / recentProposals.length);
    } else {
      averageTime = 5; // Default 5 minutes
    }

    // Calculate success rate
    const successRate = analyticsSummary.conversionRate || 0;

    // Get real-time counts
    const totalProposals = await prisma.proposal.count();
    const activeProposals = await prisma.proposal.count({
      where: {
        status: { not: 'rejected' }
      }
    });

    return NextResponse.json({
      averageTime: `${averageTime} min`,
      successRate: `${Math.round(successRate)}%`,
      templateCount,
      totalProposals,
      activeProposals,
      recentActivity: recentProposals.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
