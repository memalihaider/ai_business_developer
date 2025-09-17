import { NextRequest, NextResponse } from 'next/server';
import { proposalOperations, analyticsOperations } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await proposalOperations.getProposalById(params.id);
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Track view event if not draft
    if (!proposal.isDraft && !proposal.viewedAt) {
      await proposalOperations.updateProposal(params.id, {
        viewedAt: new Date()
      });
      
      await analyticsOperations.trackProposalEvent({
        proposalId: params.id,
        event: 'viewed',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const proposal = await proposalOperations.updateProposal(params.id, body);
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Track status change events
    if (body.status) {
      await analyticsOperations.trackProposalEvent({
        proposalId: params.id,
        event: `status_changed_to_${body.status}`,
        metadata: { previousStatus: proposal.status, newStatus: body.status }
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await proposalOperations.deleteProposal(params.id);
    
    return NextResponse.json(
      { message: 'Proposal deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
}