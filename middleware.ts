import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { checkUserAccess } from '@/lib/restrictions'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/api/auth',
  '/api/social-auth',
  '/_next',
  '/favicon.ico'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/api/admin'
]

// Define API routes that should be protected
const protectedApiRoutes = [
  '/api/dashboard',
  '/api/leads',
  '/api/social-platforms',
  '/api/social-posts',
  '/api/integrations',
  '/api/scheduler',
  '/api/tracking'
]

async function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  // If no token, redirect to login for protected routes
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate token and get user info
  const user = await validateToken(token)
  if (!user) {
    // Invalid token, redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (user.role !== 'ADMIN') {
      // Not an admin, deny access
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        )
      }
      
      // Redirect to dashboard for non-admin users
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check user restrictions for non-admin users
  if (user.role !== 'ADMIN') {
    try {
      const accessCheck = await checkUserAccess(token, pathname)
      
      if (!accessCheck.hasAccess) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: accessCheck.reason || 'Access restricted' },
            { status: 403 }
          )
        }
        
        // For page routes, redirect to a restricted access page or dashboard
        const restrictedUrl = new URL('/dashboard', request.url)
        restrictedUrl.searchParams.set('restricted', 'true')
        restrictedUrl.searchParams.set('reason', encodeURIComponent(accessCheck.reason || 'Access restricted'))
        return NextResponse.redirect(restrictedUrl)
      }
    } catch (error) {
      console.error('Error checking user restrictions:', error)
      // Continue with normal flow if restriction check fails
    }
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', user.role)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}