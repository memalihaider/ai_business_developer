import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-static';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateUser = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Validation schema for content ideas
const contentIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  category: z.string().default('general'),
  platform: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  aiGenerated: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  aiModel: z.string().optional(),
  userId: z.string().optional(),
  isPublic: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  scheduledAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const updateContentIdeaSchema = contentIdeaSchema.partial();

// GET - Fetch content ideas with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const isFavorite = searchParams.get('isFavorite');

    const skip = (page - 1) * limit;

    // Build where clause - filter by user
    const where: any = {
      userId: user.id // Only show user's own content ideas
    };
    
    if (category) where.category = category;
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (isFavorite === 'true') where.isFavorite = true;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.contentIdea.count({ where });

    // Fetch content ideas
    const contentIdeas = await prisma.contentIdea.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            analytics: true,
          },
        },
      },
    });

    // Parse tags from JSON strings
    const formattedIdeas = contentIdeas.map(idea => ({
      ...idea,
      tags: idea.tags ? JSON.parse(idea.tags) : [],
    }));

    return NextResponse.json({
      success: true,
      data: formattedIdeas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching content ideas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content ideas' },
      { status: 500 }
    );
  }
}

// POST - Create new content idea
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const body = await request.json();
    const validatedData = contentIdeaSchema.parse(body);

    // Convert tags array to JSON string for storage
    const tagsString = validatedData.tags ? JSON.stringify(validatedData.tags) : null;

    const contentIdea = await prisma.contentIdea.create({
      data: {
        ...validatedData,
        tags: tagsString,
        scheduledAt: validatedData.scheduledAt,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log analytics event
    if (validatedData.userId) {
      await prisma.contentIdeaAnalytics.create({
        data: {
          ideaId: contentIdea.id,
          event: 'created',
          userId: validatedData.userId,
          metadata: JSON.stringify({ category: contentIdea.category, aiGenerated: contentIdea.aiGenerated }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...contentIdea,
        tags: contentIdea.tags ? JSON.parse(contentIdea.tags) : [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content idea:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create content idea' },
      { status: 500 }
    );
  }
}

// PUT - Update content idea
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Content idea ID is required' },
        { status: 400 }
      );
    }

    // Check if content idea belongs to user
    const existingIdea = await prisma.contentIdea.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!existingIdea) {
      return NextResponse.json(
        { success: false, error: 'Content idea not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateContentIdeaSchema.parse(body);

    // Convert tags array to JSON string for storage
    const tagsString = validatedData.tags ? JSON.stringify(validatedData.tags) : undefined;

    const contentIdea = await prisma.contentIdea.update({
      where: { id },
      data: {
        ...validatedData,
        tags: tagsString,
        scheduledAt: validatedData.scheduledAt,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log analytics event
    if (validatedData.userId) {
      await prisma.contentIdeaAnalytics.create({
        data: {
          ideaId: contentIdea.id,
          event: 'updated',
          userId: validatedData.userId,
          metadata: JSON.stringify({ updatedFields: Object.keys(validatedData) }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...contentIdea,
        tags: contentIdea.tags ? JSON.parse(contentIdea.tags) : [],
      },
    });
  } catch (error) {
    console.error('Error updating content idea:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update content idea' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content idea
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Content idea ID is required' },
        { status: 400 }
      );
    }

    // Check if content idea belongs to user
    const existingIdea = await prisma.contentIdea.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!existingIdea) {
      return NextResponse.json(
        { success: false, error: 'Content idea not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.contentIdea.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Content idea deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting content idea:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid or expired token' || error.message === 'User not found or inactive')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete content idea' },
      { status: 500 }
    );
  }
}
