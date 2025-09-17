import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// GET /api/social-auth/callback - Handle OAuth callbacks from social media platforms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      const errorUrl = new URL('/social-content-engine/analytics', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      errorUrl.searchParams.set('auth_error', error);
      errorUrl.searchParams.set('auth_error_description', errorDescription || 'Authentication failed');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Validate required parameters
    if (!code || !state) {
      const errorUrl = new URL('/social-content-engine/analytics', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      errorUrl.searchParams.set('auth_error', 'invalid_request');
      errorUrl.searchParams.set('auth_error_description', 'Missing authorization code or state parameter');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Parse platform from state
    const [platform, stateToken] = state.split(':');
    if (!platform) {
      const errorUrl = new URL('/social-content-engine/analytics', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      errorUrl.searchParams.set('auth_error', 'invalid_state');
      errorUrl.searchParams.set('auth_error_description', 'Invalid state parameter');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Process the OAuth callback by calling our auth API
    const callbackResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/social-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'callback',
        platform,
        code,
        state: stateToken
      })
    });

    const callbackResult = await callbackResponse.json();

    // Redirect back to analytics page with result
    const redirectUrl = new URL('/social-content-engine/analytics', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    if (callbackResult.success) {
      redirectUrl.searchParams.set('auth_success', 'true');
      redirectUrl.searchParams.set('platform', platform);
      redirectUrl.searchParams.set('connected_at', callbackResult.data.connectedAt);
    } else {
      redirectUrl.searchParams.set('auth_error', 'connection_failed');
      redirectUrl.searchParams.set('auth_error_description', callbackResult.error || 'Failed to connect platform');
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    
    // Redirect to analytics page with error
    const errorUrl = new URL('/social-content-engine/analytics', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('auth_error', 'server_error');
    errorUrl.searchParams.set('auth_error_description', 'An unexpected error occurred during authentication');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

// Handle POST requests (shouldn't normally happen for OAuth callbacks, but just in case)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'POST method not supported for OAuth callback' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}