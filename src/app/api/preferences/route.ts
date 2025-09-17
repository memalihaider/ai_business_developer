import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          theme: 'light',
          currency: 'PKR',
          timezone: 'GMT+5 (PKT)',
          notifications: true,
          emailTracking: false,
          language: 'en'
        }
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate theme value
    if (updateData.theme && !['light', 'dark', 'system'].includes(updateData.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      )
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        theme: updateData.theme || 'light',
        currency: updateData.currency || 'PKR',
        timezone: updateData.timezone || 'GMT+5 (PKT)',
        notifications: updateData.notifications ?? true,
        emailTracking: updateData.emailTracking ?? false,
        language: updateData.language || 'en'
      }
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// POST /api/preferences - Create user preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...preferencesData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const preferences = await prisma.userPreferences.create({
      data: {
        userId,
        theme: preferencesData.theme || 'light',
        currency: preferencesData.currency || 'PKR',
        timezone: preferencesData.timezone || 'GMT+5 (PKT)',
        notifications: preferencesData.notifications ?? true,
        emailTracking: preferencesData.emailTracking ?? false,
        language: preferencesData.language || 'en'
      }
    })

    return NextResponse.json(preferences, { status: 201 })
  } catch (error) {
    console.error('Error creating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to create preferences' },
      { status: 500 }
    )
  }
}