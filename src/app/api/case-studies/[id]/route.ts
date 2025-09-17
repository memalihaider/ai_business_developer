import { NextRequest, NextResponse } from 'next/server';
import { caseStudyOperations } from '@/lib/db';

// GET /api/case-studies/[id] - Get a single case study
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseStudy = await caseStudyOperations.getCaseStudyById(params.id);

    if (!caseStudy) {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields for frontend
    const parsedCaseStudy = {
      ...caseStudy,
      tags: JSON.parse(caseStudy.tags),
      metrics: caseStudy.metrics ? JSON.parse(caseStudy.metrics) : null,
    };

    return NextResponse.json({ caseStudy: parsedCaseStudy }, { status: 200 });
  } catch (error) {
    console.error('Error fetching case study:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case study' },
      { status: 500 }
    );
  }
}

// PUT /api/case-studies/[id] - Update a case study
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, client, industry, summary, problem, solution, results, cover, tags, metrics, techStack, draft } = body;

    const caseStudy = await caseStudyOperations.updateCaseStudy(params.id, {
      title,
      client,
      industry,
      summary,
      problem,
      solution,
      results,
      cover,
      tags,
      metrics,
      techStack,
      draft,
    });

    // Parse JSON fields for frontend
    const parsedCaseStudy = {
      ...caseStudy,
      tags: JSON.parse(caseStudy.tags),
      metrics: caseStudy.metrics ? JSON.parse(caseStudy.metrics) : null,
    };

    return NextResponse.json({ caseStudy: parsedCaseStudy }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating case study:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update case study' },
      { status: 500 }
    );
  }
}

// DELETE /api/case-studies/[id] - Delete a case study
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await caseStudyOperations.deleteCaseStudy(params.id);
    return NextResponse.json({ message: 'Case study deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting case study:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete case study' },
      { status: 500 }
    );
  }
}