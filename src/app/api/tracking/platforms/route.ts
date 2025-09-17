import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tracking/platforms - Get all social media platforms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const platforms = await prisma.socialPlatform.findMany({
      where,
      select: {
        id: true,
        name: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose sensitive API keys
        _count: {
          select: {
            shares: true,
            analytics: true
          }
        }
      },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

// POST /api/tracking/platforms - Create or update a social media platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      displayName,
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      isActive = true,
      settings
    } = body;

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if platform already exists
    const existingPlatform = await prisma.socialPlatform.findUnique({
      where: { name: name.toLowerCase() }
    });

    let platform;

    if (existingPlatform) {
      // Update existing platform
      platform = await prisma.socialPlatform.update({
        where: { id: existingPlatform.id },
        data: {
          displayName,
          ...(apiKey && { apiKey }),
          ...(apiSecret && { apiSecret }),
          ...(accessToken && { accessToken }),
          ...(refreshToken && { refreshToken }),
          isActive,
          ...(settings && { settings: JSON.stringify(settings) })
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } else {
      // Create new platform
      platform = await prisma.socialPlatform.create({
        data: {
          name: name.toLowerCase(),
          displayName,
          apiKey,
          apiSecret,
          accessToken,
          refreshToken,
          isActive,
          settings: settings ? JSON.stringify(settings) : null
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: platform,
      message: existingPlatform ? 'Platform updated successfully' : 'Platform created successfully'
    });
  } catch (error) {
    console.error('Error creating/updating platform:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update platform' },
      { status: 500 }
    );
  }
}

// PUT /api/tracking/platforms - Bulk update platform settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms } = body;

    if (!Array.isArray(platforms)) {
      return NextResponse.json(
        { success: false, error: 'Platforms must be an array' },
        { status: 400 }
      );
    }

    const updatePromises = platforms.map(async (platformData) => {
      const { id, isActive, settings } = platformData;
      
      if (!id) return null;

      return prisma.socialPlatform.update({
        where: { id },
        data: {
          ...(typeof isActive === 'boolean' && { isActive }),
          ...(settings && { settings: JSON.stringify(settings) })
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          isActive: true
        }
      });
    });

    const updatedPlatforms = await Promise.all(updatePromises);
    const validUpdates = updatedPlatforms.filter(Boolean);

    return NextResponse.json({
      success: true,
      data: validUpdates,
      message: `Updated ${validUpdates.length} platforms`
    });
  } catch (error) {
    console.error('Error bulk updating platforms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update platforms' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}