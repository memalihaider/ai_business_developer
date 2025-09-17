import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/analyst-notes - Fetch analyst notes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, daily, weekly, monthly
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const reportType = searchParams.get('reportType');
    
    // Calculate date range based on period
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'daily':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
        break;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = {
          createdAt: {
            gte: startOfWeek
          }
        };
        break;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          createdAt: {
            gte: startOfMonth
          }
        };
        break;
      default:
        // No date filter for 'all'
        break;
    }
    
    // Build where clause
    const whereClause: any = {
      ...dateFilter
    };
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (reportType) {
      whereClause.reportType = reportType;
    }
    
    // Get total count for pagination
    const totalCount = await prisma.analystNote.count({
      where: whereClause
    });
    
    // Fetch notes with pagination
    const notes = await prisma.analystNote.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        reportType: true,
        tags: true,
        priority: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      success: true,
      data: notes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      },
      filters: {
        period,
        search,
        reportType
      }
    });
  } catch (error) {
    console.error('Error fetching analyst notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analyst notes' },
      { status: 500 }
    );
  }
}

// POST /api/analyst-notes - Create new analyst note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, reportType, tags, priority = 'medium', isPublic = false, authorId } = body;
    
    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    if (!authorId) {
      return NextResponse.json(
        { success: false, error: 'Author ID is required' },
        { status: 400 }
      );
    }
    
    // Create the note
    const note = await prisma.analystNote.create({
      data: {
        title,
        content,
        reportType,
        tags,
        priority,
        isPublic,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: note,
      message: 'Analyst note created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating analyst note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create analyst note' },
      { status: 500 }
    );
  }
}

// PUT /api/analyst-notes - Update existing analyst note
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, reportType, tags, priority, isPublic } = body;
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    // Check if note exists
    const existingNote = await prisma.analystNote.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return NextResponse.json(
        { success: false, error: 'Analyst note not found' },
        { status: 404 }
      );
    }
    
    // Update the note
    const updatedNote = await prisma.analystNote.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(reportType && { reportType }),
        ...(tags && { tags }),
        ...(priority && { priority }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedNote,
      message: 'Analyst note updated successfully'
    });
  } catch (error) {
    console.error('Error updating analyst note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update analyst note' },
      { status: 500 }
    );
  }
}

// DELETE /api/analyst-notes - Delete analyst note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    // Check if note exists
    const existingNote = await prisma.analystNote.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return NextResponse.json(
        { success: false, error: 'Analyst note not found' },
        { status: 404 }
      );
    }
    
    // Delete the note
    await prisma.analystNote.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Analyst note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analyst note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete analyst note' },
      { status: 500 }
    );
  }
}