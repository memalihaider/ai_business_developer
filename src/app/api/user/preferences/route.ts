import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    // Get token from header or cookie
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const body = await request.json()

    // Validate request body
    const allowedFields = [
      'onboardingCompleted',
      'onboardingCompletedAt',
      'theme',
      'language',
      'notifications',
      'emailNotifications',
      'timezone'
    ]

    const updateData: any = {}
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let preferences
    
    if (user.preferences) {
      // Update existing preferences
      preferences = await prisma.userPreferences.update({
        where: { userId: userId },
        data: updateData
      })
    } else {
      // Create new preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId: userId,
          ...updateData
        }
      })
    }

    return NextResponse.json({
      success: true,
      preferences: {
        id: preferences.id,
        onboardingCompleted: preferences.onboardingCompleted,
        onboardingCompletedAt: preferences.onboardingCompletedAt,
        theme: preferences.theme,
        language: preferences.language,
        notifications: preferences.notifications,
        emailNotifications: preferences.emailNotifications,
        timezone: preferences.timezone
      }
    })

  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get user preferences
export async function GET(request: NextRequest) {
  try {
    // Get token from header or cookie
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Get user preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    })

    if (!preferences) {
      return NextResponse.json({
        success: true,
        preferences: {
          onboardingCompleted: false,
          theme: 'light',
          language: 'en',
          notifications: true,
          emailNotifications: true,
          timezone: 'UTC'
        }
      })
    }

    return NextResponse.json({
      success: true,
      preferences: {
        id: preferences.id,
        onboardingCompleted: preferences.onboardingCompleted,
        onboardingCompletedAt: preferences.onboardingCompletedAt,
        theme: preferences.theme,
        language: preferences.language,
        notifications: preferences.notifications,
        emailNotifications: preferences.emailNotifications,
        timezone: preferences.timezone
      }
    })

  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}