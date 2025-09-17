import { NextResponse } from 'next/server';
import { analyticsOperations } from '@/lib/db';

export async function GET() {
  try {
    const summary = await analyticsOperations.getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
}