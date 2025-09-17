import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { industries, filters } = body;

    // Generate AI-powered alerts for specified industries
    const alerts = await aiService.generateIndustryAlerts(industries || ['Technology', 'Healthcare', 'Finance']);

    // Generate opportunities based on filters
    const opportunities = [];
    for (const industry of industries || ['Technology', 'Healthcare', 'Finance']) {
      const industryOpportunities = await aiService.generateOpportunities(industry, filters);
      opportunities.push(...industryOpportunities.slice(0, 2)); // Limit per industry
    }

    // Get analysis insights
    const analysis = await aiService.analyzeOpportunities(opportunities);

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        alerts,
        analysis,
        scanTimestamp: new Date().toISOString(),
        totalValue: opportunities.reduce((sum, opp) => {
          const value = parseFloat(opp.value.replace(/[^0-9.-]+/g, '')) || 0;
          return sum + value;
        }, 0)
      }
    });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scan opportunities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Opportunity scan endpoint - use POST method',
    availableEndpoints: {
      'POST /api/opportunities/scan': 'Scan for new opportunities using AI',
    }
  });
}
