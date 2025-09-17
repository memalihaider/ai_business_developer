import { NextRequest, NextResponse } from 'next/server';
import { caseStudyOperations } from '@/lib/db';

export const dynamic = 'force-static';

// GET /api/case-studies - Get all case studies or search case studies
export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let caseStudies;
    if (query) {
      caseStudies = await caseStudyOperations.searchCaseStudies(query);
    } else {
      caseStudies = await caseStudyOperations.getAllCaseStudies();
    }

    // Parse JSON fields for frontend
    const parsedCaseStudies = caseStudies.map(cs => ({
      ...cs,
      tags: JSON.parse(cs.tags),
      metrics: cs.metrics ? JSON.parse(cs.metrics) : null,
    }));

    return NextResponse.json({ caseStudies: parsedCaseStudies }, { status: 200 });
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    );
  }
}

// POST /api/case-studies - Create a new case study
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, client, industry, summary, problem, solution, results, cover, tags, metrics, techStack, draft, googleDocLink } = body;

    // Validate required fields
    if (!title || !client || !industry || !summary) {
      return NextResponse.json(
        { error: 'Title, client, industry, and summary are required' },
        { status: 400 }
      );
    }

    const caseStudy = await caseStudyOperations.createCaseStudy({
      title,
      client,
      industry,
      summary,
      problem,
      solution,
      results,
      cover,
      tags: tags || [],
      metrics,
      techStack,
      draft: draft ?? true,
      googleDocLink: googleDocLink || null,
    });

    // Parse JSON fields for frontend
    const parsedCaseStudy = {
      ...caseStudy,
      tags: JSON.parse(caseStudy.tags),
      metrics: caseStudy.metrics ? JSON.parse(caseStudy.metrics) : null,
    };

    return NextResponse.json({ caseStudy: parsedCaseStudy }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case study:', error);
    return NextResponse.json(
      { error: 'Failed to create case study' },
      { status: 500 }
    );
  }
}
