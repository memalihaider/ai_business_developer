import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        steps: {
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            contacts: true,
            steps: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Calculate real metrics for each campaign
    const campaignsWithMetrics = await Promise.all(campaigns.map(async (campaign) => {
      // Get email statistics for this campaign
      const sentEmails = await prisma.scheduledEmail.count({
        where: {
          campaignId: campaign.id,
          status: 'sent'
        }
      });

      // Get open statistics
      const totalOpens = await prisma.emailOpen.count({
        where: { campaignId: campaign.id }
      });

      const uniqueOpens = await prisma.emailOpen.count({
        where: {
          campaignId: campaign.id,
          isUnique: true
        }
      });

      // Get click statistics
      const totalClicks = await prisma.emailClick.count({
        where: { campaignId: campaign.id }
      });

      const uniqueClicks = await prisma.emailClick.count({
        where: {
          campaignId: campaign.id,
          isUnique: true
        }
      });

      // Calculate rates
      const openRate = sentEmails > 0 ? (uniqueOpens / sentEmails) * 100 : 0;
      const clickRate = sentEmails > 0 ? (uniqueClicks / sentEmails) * 100 : 0;
      const conversionRate = sentEmails > 0 ? (uniqueClicks / sentEmails) * 100 : 0; // Using clicks as conversion proxy

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        type: campaign.type,
        scheduledAt: campaign.scheduledAt?.toISOString().split('T')[0],
        startedAt: campaign.startedAt?.toISOString().split('T')[0],
        completedAt: campaign.completedAt?.toISOString().split('T')[0],
        totalContacts: campaign._count.contacts,
        sentEmails,
        openedCount: totalOpens,
        clickedCount: totalClicks,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        steps: campaign.steps.map(step => ({
          id: step.id,
          name: step.name,
          type: step.type,
          delay: step.delay,
          order: step.order,
          templateId: step.templateId
        })),
        contacts: campaign.contacts.map(cc => cc.contact),
        createdAt: campaign.createdAt.toISOString().split('T')[0],
        updatedAt: campaign.updatedAt.toISOString().split('T')[0]
      };
    }));

    const total = await prisma.campaign.count({ where });

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      startDate, 
      endDate, 
      contactIds, 
      steps,
      settings
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Campaign name and type are required' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: description || '',
        type,
        status: 'draft',
        scheduledAt: startDate ? new Date(startDate) : null,
        settings: settings ? JSON.stringify(settings) : null,
        contacts: contactIds ? {
          create: contactIds.map((contactId: string) => ({
            contactId,
            status: 'pending'
          }))
        } : undefined,
        steps: steps ? {
          create: steps.map((step: any, index: number) => ({
            name: step.name,
            type: step.type,
            templateId: step.templateId,
            delay: step.delay || 0,
            order: index + 1,
            conditions: step.conditions ? JSON.stringify(step.conditions) : null,
            settings: step.settings ? JSON.stringify(step.settings) : null
          }))
        } : undefined
      },
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        steps: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      type: campaign.type,
      scheduledAt: campaign.scheduledAt?.toISOString().split('T')[0],
      startedAt: campaign.startedAt?.toISOString().split('T')[0],
      completedAt: campaign.completedAt?.toISOString().split('T')[0],
      totalContacts: campaign.contacts.length,
      sentEmails: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      steps: campaign.steps.map(step => ({
        id: step.id,
        name: step.name,
        type: step.type,
        delay: step.delay,
        order: step.order,
        template: step.template
      })),
      contacts: campaign.contacts.map(cc => cc.contact),
      createdAt: campaign.createdAt.toISOString().split('T')[0],
      updatedAt: campaign.updatedAt.toISOString().split('T')[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      name, 
      description, 
      status, 
      startDate, 
      endDate, 
      contactIds, 
      steps,
      settings
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Update campaign basic info
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (settings) updateData.settings = JSON.stringify(settings);

    // Update contacts if provided
    if (contactIds) {
      await prisma.campaignContact.deleteMany({
        where: { campaignId: id }
      });
      
      updateData.contacts = {
        create: contactIds.map((contactId: string) => ({
          contactId,
          status: 'pending'
        }))
      };
    }

    // Update steps if provided
    if (steps) {
      await prisma.campaignStep.deleteMany({
        where: { campaignId: id }
      });
      
      updateData.steps = {
        create: steps.map((step: any, index: number) => ({
          name: step.name,
          type: step.type,
          templateId: step.templateId,
          delay: step.delay || 0,
          order: index + 1,
          conditions: step.conditions ? JSON.stringify(step.conditions) : null,
          settings: step.settings ? JSON.stringify(step.settings) : null
        }))
      };
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        steps: {
          orderBy: {
            order: 'asc'
          },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      type: campaign.type,
      startDate: campaign.startDate?.toISOString().split('T')[0],
      endDate: campaign.endDate?.toISOString().split('T')[0],
      totalContacts: campaign.contacts.length,
      steps: campaign.steps.map(step => ({
        id: step.id,
        name: step.name,
        type: step.type,
        delay: step.delay,
        order: step.order,
        template: step.template
      })),
      contacts: campaign.contacts.map(cc => cc.contact),
      createdAt: campaign.createdAt.toISOString().split('T')[0],
      updatedAt: campaign.updatedAt.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Check if campaign is running
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { status: true }
    });

    if (campaign?.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active campaign. Please stop it first.' },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}