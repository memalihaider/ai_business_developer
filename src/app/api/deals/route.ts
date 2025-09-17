import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/deals - Get all deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contactId');
    const leadId = searchParams.get('leadId');

    const where: any = {};
    if (stage) where.stage = stage;
    if (contactId) where.contactId = contactId;
    if (leadId) where.leadId = leadId;

    const deals = await prisma.deal.findMany({
      where,
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
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      value,
      currency = 'USD',
      stage = 'lead',
      priority = 'medium',
      probability = 0,
      expectedCloseDate,
      source,
      tags,
      notes,
      contactId,
      leadId,
      customFields,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        value: parseFloat(value) || 0,
        currency,
        stage,
        priority,
        probability: parseInt(probability) || 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        source,
        tags: tags ? JSON.stringify(tags) : null,
        notes,
        contactId,
        leadId,
        customFields: customFields ? JSON.stringify(customFields) : null,
      },
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

    // Create activity log
    await prisma.dealActivity.create({
      data: {
        dealId: deal.id,
        type: 'deal_created',
        description: `Deal "${title}" was created`,
        newValue: stage,
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}