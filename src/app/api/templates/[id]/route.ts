import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const template = await prisma.proposalTemplate.findUnique({
      where: {
        id: id
      },
      include: {
        proposals: {
          select: {
            id: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Transform the data to include computed fields
    const transformedTemplate = {
      ...template,
      usageCount: template.proposals?.length || 0,
      isPopular: (template.proposals?.length || 0) > 5,
      rating: Math.random() * 2 + 3, // Mock rating between 3-5
      downloads: Math.floor(Math.random() * 100) + 10,
      tags: template.tags ? JSON.parse(template.tags as string) : [],
      lastUsed: template.updatedAt,
      sections: template.sections ? JSON.parse(template.sections as string) : []
    };

    return NextResponse.json(transformedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update a specific template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const {
      name,
      description,
      type,
      category,
      content,
      sections,
      isPublic,
      tags
    } = body;

    // Check if template exists
    const existingTemplate = await prisma.proposalTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update the template
    const updatedTemplate = await prisma.proposalTemplate.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        type: type || existingTemplate.type,
        category: category || existingTemplate.category,
        content: content || existingTemplate.content,
        sections: sections ? JSON.stringify(sections) : existingTemplate.sections,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
        tags: tags ? JSON.stringify(tags) : existingTemplate.tags,
        updatedAt: new Date()
      },
      include: {
        proposals: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform the data to include computed fields
    const transformedTemplate = {
      ...updatedTemplate,
      usageCount: updatedTemplate.proposals?.length || 0,
      isPopular: (updatedTemplate.proposals?.length || 0) > 5,
      rating: Math.random() * 2 + 3,
      downloads: Math.floor(Math.random() * 100) + 10,
      tags: updatedTemplate.tags ? JSON.parse(updatedTemplate.tags as string) : [],
      lastUsed: updatedTemplate.updatedAt,
      sections: updatedTemplate.sections ? JSON.parse(updatedTemplate.sections as string) : []
    };

    return NextResponse.json(transformedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a specific template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if template exists
    const existingTemplate = await prisma.proposalTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete the template
    await prisma.proposalTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Template deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Partial update of a template (e.g., toggle favorite, update usage count)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, data } = body;

    // Check if template exists
    const existingTemplate = await prisma.proposalTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'toggle_favorite':
        // This would typically involve a user-template relationship table
        // For now, we'll just update the updatedAt field
        break;
      
      case 'increment_usage':
        // This would typically be handled when a proposal is created using this template
        // For now, we'll just update the updatedAt field
        break;
      
      case 'update_visibility':
        updateData.isPublic = data.isPublic;
        break;
      
      case 'add_tags':
        const currentTags = existingTemplate.tags ? JSON.parse(existingTemplate.tags as string) : [];
        const newTags = [...new Set([...currentTags, ...(data.tags || [])])];
        updateData.tags = JSON.stringify(newTags);
        break;
      
      case 'remove_tags':
        const existingTags = existingTemplate.tags ? JSON.parse(existingTemplate.tags as string) : [];
        const filteredTags = existingTags.filter((tag: string) => !data.tags?.includes(tag));
        updateData.tags = JSON.stringify(filteredTags);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedTemplate = await prisma.proposalTemplate.update({
      where: { id },
      data: updateData,
      include: {
        proposals: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform the data to include computed fields
    const transformedTemplate = {
      ...updatedTemplate,
      usageCount: updatedTemplate.proposals?.length || 0,
      isPopular: (updatedTemplate.proposals?.length || 0) > 5,
      rating: Math.random() * 2 + 3,
      downloads: Math.floor(Math.random() * 100) + 10,
      tags: updatedTemplate.tags ? JSON.parse(updatedTemplate.tags as string) : [],
      lastUsed: updatedTemplate.updatedAt,
      sections: updatedTemplate.sections ? JSON.parse(updatedTemplate.sections as string) : []
    };

    return NextResponse.json(transformedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}