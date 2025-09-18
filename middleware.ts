import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { checkUserAccess } from './src/lib/restrictions'

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/logout',
  '/',
  '/about',
  '/contact'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/api/admin'
]

// Define protected API routes that need authentication
const protectedApiRoutes = [
  '/api/contacts',
  '/api/opportunities',
  '/api/invoices',
  '/api/proposals',
  '/api/email',
  '/api/social-posts',
  '/api/templates',
  '/api/ai'
]

// CSRF token validation for state-changing operations
const validateCSRFToken = (request: NextRequest): boolean => {
  const method = request.method
  
  // Only validate CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }

  const csrfTokenFromHeader = request.headers.get('x-csrf-token')
  const csrfTokenFromCookie = request.cookies.get('csrf-token')?.value

  // Skip CSRF validation for auth endpoints (they have their own protection)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return true
  }

  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    return false
  }

  return csrfTokenFromHeader === csrfTokenFromCookie
}

// Generate CSRF token using Web Crypto API (Edge Runtime compatible)
const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function validateToken(token: string) {
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const response = NextResponse.next()
    
    // Set CSRF token for public routes that might need it
    if (!request.cookies.get('csrf-token')) {
      const csrfToken = generateCSRFToken()
      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      })
    }
    
    return response
  }

  // CSRF Protection for state-changing operations
  if (!validateCSRFToken(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }
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