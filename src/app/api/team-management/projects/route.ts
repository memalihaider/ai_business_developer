import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      startDate,
      endDate,
      deadline,
      budget,
      progress = 0,
      clientName,
      clientEmail,
      tags,
      requirements,
      deliverables,
      notes
    } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Validate progress
    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid client email format' },
        { status: 400 }
      );
    }

    // Validate budget if provided
    if (budget && (typeof budget !== 'number' || budget < 0)) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 }
      );
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Process tags if provided
    let processedTags = null;
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = JSON.stringify(tags);
      } else if (typeof tags === 'string') {
        try {
          // Try to parse as JSON first
          JSON.parse(tags);
          processedTags = tags;
        } catch {
          // If not JSON, treat as comma-separated string
          processedTags = JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag));
        }
      }
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget || null,
        progress,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        tags: processedTags,
        requirements: requirements?.trim() || null,
        deliverables: deliverables?.trim() || null,
        notes: notes?.trim() || null
      },
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      deadline,
      budget,
      progress,
      clientName,
      clientEmail,
      tags,
      requirements,
      deliverables,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validation (same as POST)
    if (name && name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name cannot be empty' },
        { status: 400 }
      );
    }

    if (status) {
      const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        );
      }
    }

    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid client email format' },
        { status: 400 }
      );
    }

    if (budget && (typeof budget !== 'number' || budget < 0)) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 }
      );
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Process tags if provided
    let processedTags = undefined;
    if (tags !== undefined) {
      if (tags === null) {
        processedTags = null;
      } else if (Array.isArray(tags)) {
        processedTags = JSON.stringify(tags);
      } else if (typeof tags === 'string') {
        try {
          JSON.parse(tags);
          processedTags = tags;
        } catch {
          processedTags = JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag));
        }
      }
    }

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (budget !== undefined) updateData.budget = budget || null;
    if (progress !== undefined) updateData.progress = progress;
    if (clientName !== undefined) updateData.clientName = clientName?.trim() || null;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail?.trim() || null;
    if (processedTags !== undefined) updateData.tags = processedTags;
    if (requirements !== undefined) updateData.requirements = requirements?.trim() || null;
    if (deliverables !== undefined) updateData.deliverables = deliverables?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if project has assignments
    if (existingProject._count.assignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with active assignments. Please remove all assignments first.' },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}