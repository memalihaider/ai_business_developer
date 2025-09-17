import { NextRequest, NextResponse } from 'next/server';
import { proposalOperations } from '@/lib/db';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let proposals;
    if (search) {
      proposals = await proposalOperations.searchProposals(search);
    } else {
      proposals = await proposalOperations.getAllProposals();
    }

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      clientName,
      clientEmail,
      clientPhone,
      description,
      timeline,
      budget,
      type = 'service',
      status = 'draft',
      content,
      sections,
      templateId,
      leadId,
      isDraft = true
    } = body;

    // Validate required fields
    if (!title || !clientName || !description) {
      return NextResponse.json(
        { error: 'Title, client name, and description are required' },
        { status: 400 }
      );
    }

    const proposal = await proposalOperations.createProposal({
      title,
      clientName,
      clientEmail,
      clientPhone,
      description,
      timeline,
      budget,
      type,
      status,
      content,
      sections,
      templateId,
      leadId,
      isDraft
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
