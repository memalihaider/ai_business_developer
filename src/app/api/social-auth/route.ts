import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Social media platform configurations
const PLATFORM_CONFIGS = {
  facebook: {
    name: 'Facebook',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
  },
  twitter: {
    name: 'Twitter',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scope: 'tweet.read,users.read,follows.read,offline.access',
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || ''
  },
  instagram: {
    name: 'Instagram',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scope: 'user_profile,user_media',
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || ''
  },
  linkedin: {
    name: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: 'r_liteprofile,r_emailaddress,w_member_social',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
  },
  youtube: {
    name: 'YouTube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  }
};

// GET /api/social-auth - Get OAuth URL for platform connection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const action = searchParams.get('action');

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Unsupported platform' },
        { status: 400 }
      );
    }

    if (action === 'connect') {
      // Generate OAuth URL for platform connection
      const state = generateRandomState();
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social-auth/callback`;
      
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', config.scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', `${platform}:${state}`);

      // Store state for verification (in production, use Redis or database)
      // For now, we'll just return the URL
      return NextResponse.json({
        success: true,
        data: {
          authUrl: authUrl.toString(),
          state,
          platform: config.name
        }
      });
    }

    if (action === 'status') {
      // Check connection status for all platforms or specific platform
      const connections = await getConnectionStatus(platform === 'all' ? null : platform);
      return NextResponse.json({
        success: true,
        data: connections
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "connect" or "status"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in social auth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process authentication request' },
      { status: 500 }
    );
  }
}

// POST /api/social-auth - Handle OAuth callback or disconnect platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, platform, code, state } = body;

    if (action === 'callback') {
      // Handle OAuth callback
      if (!platform || !code) {
        return NextResponse.json(
          { success: false, error: 'Platform and authorization code are required' },
          { status: 400 }
        );
      }

      const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Unsupported platform' },
          { status: 400 }
        );
      }

      // Exchange authorization code for access token
      const tokenData = await exchangeCodeForToken(platform, code, config);
      
      if (!tokenData.success) {
        return NextResponse.json(
          { success: false, error: 'Failed to obtain access token' },
          { status: 400 }
        );
      }

      // Store connection in database (mock implementation)
      const connection = await storeConnection(platform, tokenData.data);

      return NextResponse.json({
        success: true,
        data: {
          platform: config.name,
          connected: true,
          connectionId: connection.id,
          connectedAt: connection.connectedAt
        }
      });
    }

    if (action === 'disconnect') {
      // Disconnect platform
      if (!platform) {
        return NextResponse.json(
          { success: false, error: 'Platform is required' },
          { status: 400 }
        );
      }

      await disconnectPlatform(platform);

      return NextResponse.json({
        success: true,
        message: `${platform} disconnected successfully`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "callback" or "disconnect"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in social auth POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process authentication request' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function exchangeCodeForToken(platform: string, code: string, config: any) {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social-auth/callback`;
    
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    return {
      success: true,
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type || 'Bearer'
      }
    };
  } catch (error) {
    console.error(`Error exchanging code for token (${platform}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function storeConnection(platform: string, tokenData: any) {
  // Mock implementation - in production, store in database
  const connection = {
    id: `conn_${Date.now()}`,
    platform,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresIn: tokenData.expiresIn,
    connectedAt: new Date().toISOString(),
    isActive: true
  };

  // In production, you would:
  // await prisma.socialConnection.create({ data: connection });
  
  return connection;
}

async function getConnectionStatus(platform?: string | null) {
  // Mock implementation - in production, fetch from database
  const mockConnections = {
    facebook: { connected: true, connectedAt: '2024-01-15T10:30:00Z', status: 'active' },
    twitter: { connected: false, connectedAt: null, status: 'disconnected' },
    instagram: { connected: true, connectedAt: '2024-01-14T15:45:00Z', status: 'active' },
    linkedin: { connected: false, connectedAt: null, status: 'disconnected' },
    youtube: { connected: true, connectedAt: '2024-01-13T09:20:00Z', status: 'active' }
  };

  if (platform && platform !== 'all') {
    return {
      [platform]: mockConnections[platform as keyof typeof mockConnections] || 
        { connected: false, connectedAt: null, status: 'disconnected' }
    };
  }

  return mockConnections;
}

async function disconnectPlatform(platform: string) {
  // Mock implementation - in production, update database
  // await prisma.socialConnection.updateMany({
  //   where: { platform },
  //   data: { isActive: false, disconnectedAt: new Date() }
  // });
  
  console.log(`Disconnected ${platform}`);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}