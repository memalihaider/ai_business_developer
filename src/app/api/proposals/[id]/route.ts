import { NextRequest, NextResponse } from 'next/server';
import { proposalOperations, analyticsOperations } from '@/lib/db';

// Helper function to get user ID from request headers (set by middleware)
const getUserId = (request: NextRequest): string | null => {
  return request.headers.get('x-user-id');
};

// Helper function to check if user owns the resource
const checkResourceOwnership = async (userId: string, proposalId: string): Promise<boolean> => {
  try {
    const proposal = await proposalOperations.getProposalById(proposalId);
    return proposal && proposal.userId === userId;
  } catch (error) {
    return false;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate ID format
    if (!params.id || typeof params.id !== 'string' || params.id.length > 50) {
      return NextResponse.json(
        { error: 'Invalid proposal ID' },
        { status: 400 }
      );
    }

    const proposal = await proposalOperations.getProposalById(params.id);
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check ownership unless it's a public proposal view
    const isPublicView = request.nextUrl.searchParams.get('public') === 'true';
    if (!isPublicView && proposal.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate ID format
    if (!params.id || typeof params.id !== 'string' || params.id.length > 50) {
      return NextResponse.json(
        { error: 'Invalid proposal ID' },
        { status: 400 }
      );
    }

    // Check ownership before allowing update
    const hasAccess = await checkResourceOwnership(userId, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

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