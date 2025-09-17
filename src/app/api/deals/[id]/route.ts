import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/deals/[id] - Get a specific deal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
            phone: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

// PUT /api/deals/[id] - Update a deal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      value,
      currency,
      stage,
      priority,
      probability,
      expectedCloseDate,
      actualCloseDate,
      source,
      tags,
      notes,
      contactId,
      leadId,
      customFields,
    } = body;

    // Get current deal for activity logging
    const currentDeal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = parseFloat(value) || 0;
    if (currency !== undefined) updateData.currency = currency;
    if (stage !== undefined) updateData.stage = stage;
    if (priority !== undefined) updateData.priority = priority;
    if (probability !== undefined) updateData.probability = parseInt(probability) || 0;
    if (expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }
    if (actualCloseDate !== undefined) {
      updateData.actualCloseDate = actualCloseDate ? new Date(actualCloseDate) : null;
    }
    if (source !== undefined) updateData.source = source;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (contactId !== undefined) updateData.contactId = contactId;
    if (leadId !== undefined) updateData.leadId = leadId;
    if (customFields !== undefined) {
      updateData.customFields = customFields ? JSON.stringify(customFields) : null;
    }

    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    // Log stage change activity
    if (stage && stage !== currentDeal.stage) {
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          type: 'stage_change',
          description: `Deal stage changed from ${currentDeal.stage} to ${stage}`,
          oldValue: currentDeal.stage,
          newValue: stage,
        },
      });
    }

    // Log value change activity
    if (value !== undefined && parseFloat(value) !== currentDeal.value) {
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          type: 'value_updated',
          description: `Deal value changed from $${currentDeal.value} to $${value}`,
          oldValue: currentDeal.value.toString(),
          newValue: value.toString(),
        },
      });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    await prisma.deal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}