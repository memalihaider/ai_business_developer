import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Encryption key - in production, use a proper key management system
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'

// Simple encryption function
function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

// Simple decryption function
function decrypt(encryptedText: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

// GET - Retrieve all payment platform configurations
export async function GET() {
  try {
    const configs = await prisma.paymentPlatformConfig.findMany({
      orderBy: { displayName: 'asc' }
    })

    // Decrypt sensitive data for display (mask API keys)
    const safeConfigs = configs.map(config => ({
      ...config,
      apiKey: config.apiKey ? '••••••••' + (decrypt(config.apiKey).slice(-4) || '') : null,
      secretKey: config.secretKey ? '••••••••' + (decrypt(config.secretKey).slice(-4) || '') : null,
    }))

    return NextResponse.json(safeConfigs)
  } catch (error) {
    console.error('Error fetching payment platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment platforms' },
      { status: 500 }
    )
  }
}

// POST - Create or update payment platform configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, displayName, apiKey, secretKey, merchantId, isActive } = body

    if (!platform || !displayName) {
      return NextResponse.json(
        { error: 'Platform and display name are required' },
        { status: 400 }
      )
    }

    // Encrypt sensitive data
    const encryptedData: any = {
      platform,
      displayName,
      isActive: isActive || false,
      connectionStatus: 'not_configured',
      updatedAt: new Date()
    }

    if (apiKey) encryptedData.apiKey = encrypt(apiKey)
    if (secretKey) encryptedData.secretKey = encrypt(secretKey)
    if (merchantId) encryptedData.merchantId = merchantId

    // Upsert the configuration
    const config = await prisma.paymentPlatformConfig.upsert({
      where: { platform },
      update: encryptedData,
      create: encryptedData
    })

    return NextResponse.json({
      ...config,
      apiKey: apiKey ? '••••••••' + apiKey.slice(-4) : null,
      secretKey: secretKey ? '••••••••' + secretKey.slice(-4) : null,
    })
  } catch (error) {
    console.error('Error saving payment platform:', error)
    return NextResponse.json(
      { error: 'Failed to save payment platform configuration' },
      { status: 500 }
    )
  }
}

// PUT - Test connection for a payment platform
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform } = body

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    // Update connection status to testing
    await prisma.paymentPlatformConfig.update({
      where: { platform },
      data: {
        connectionStatus: 'testing',
        lastTested: new Date()
      }
    })

    // Simulate connection test (in real implementation, test actual API)
    const isConnected = Math.random() > 0.3 // 70% success rate for demo
    
    const updatedConfig = await prisma.paymentPlatformConfig.update({
      where: { platform },
      data: {
        connectionStatus: isConnected ? 'connected' : 'failed',
        isConnected,
        errorMessage: isConnected ? null : 'Connection test failed. Please check your API credentials.'
      }
    })

    return NextResponse.json({
      ...updatedConfig,
      apiKey: updatedConfig.apiKey ? '••••••••' + (decrypt(updatedConfig.apiKey).slice(-4) || '') : null,
      secretKey: updatedConfig.secretKey ? '••••••••' + (decrypt(updatedConfig.secretKey).slice(-4) || '') : null,
    })
  } catch (error) {
    console.error('Error testing payment platform connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment platform configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    await prisma.paymentPlatformConfig.delete({
      where: { platform }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment platform:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment platform configuration' },
      { status: 500 }
    )
  }
}