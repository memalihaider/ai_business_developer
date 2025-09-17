import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface UserRestriction {
  id: string
  pageRoute: string
  isBlocked: boolean
  reason?: string
}

interface DecodedToken {
  userId: string
  email: string
  role: string
  restrictions?: UserRestriction[]
}

/**
 * Check if a user has access to a specific route
 * @param token - JWT token from the request
 * @param route - The route to check access for
 * @returns Promise<{ hasAccess: boolean, reason?: string }>
 */
export async function checkUserAccess(token: string, route: string): Promise<{ hasAccess: boolean, reason?: string }> {
  try {
    // Decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    
    // Admin users have access to everything
    if (decoded.role === 'ADMIN') {
      return { hasAccess: true }
    }

    // If no restrictions in token, fetch from database
    if (!decoded.restrictions) {
      const restrictions = await fetchUserRestrictions(decoded.userId)
      return checkRouteAccess(restrictions, route)
    }

    return checkRouteAccess(decoded.restrictions, route)
  } catch (error) {
    console.error('Error checking user access:', error)
    return { hasAccess: false, reason: 'Invalid authentication' }
  }
}

/**
 * Fetch user restrictions from database
 * @param userId - The user ID
 * @returns Promise<UserRestriction[]>
 */
async function fetchUserRestrictions(userId: string): Promise<UserRestriction[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/users/${userId}/restrictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.restrictions || []
  } catch (error) {
    console.error('Error fetching user restrictions:', error)
    return []
  }
}

/**
 * Check if a route is accessible based on restrictions
 * @param restrictions - Array of user restrictions
 * @param route - The route to check
 * @returns { hasAccess: boolean, reason?: string }
 */
function checkRouteAccess(restrictions: UserRestriction[], route: string): { hasAccess: boolean, reason?: string } {
  // Find matching restriction for the route
  const restriction = restrictions.find(r => {
    // Exact match
    if (r.pageRoute === route) return true
    
    // Wildcard match (e.g., /dashboard/* matches /dashboard/analytics)
    if (r.pageRoute.endsWith('/*')) {
      const basePath = r.pageRoute.slice(0, -2)
      return route.startsWith(basePath)
    }
    
    return false
  })

  if (restriction && restriction.isBlocked) {
    return {
      hasAccess: false,
      reason: restriction.reason || 'Access to this page is restricted'
    }
  }

  return { hasAccess: true }
}

/**
 * Get all restricted routes for a user
 * @param userId - The user ID
 * @returns Promise<string[]> - Array of restricted route patterns
 */
export async function getUserRestrictedRoutes(userId: string): Promise<string[]> {
  const restrictions = await fetchUserRestrictions(userId)
  return restrictions
    .filter(r => r.isBlocked)
    .map(r => r.pageRoute)
}

/**
 * Common restricted routes that can be applied
 */
export const COMMON_RESTRICTED_ROUTES = [
  '/dashboard',
  '/dashboard/*',
  '/proposals',
  '/proposals/*',
  '/clients',
  '/clients/*',
  '/social-content-engine',
  '/social-content-engine/*',
  '/pipeline',
  '/pipeline/*',
  '/email',
  '/email/*',
  '/analytics',
  '/analytics/*',
  '/settings',
  '/settings/*'
] as const

/**
 * Route display names for admin interface
 */
export const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/*': 'All Dashboard Pages',
  '/proposals': 'Proposals',
  '/proposals/*': 'All Proposal Pages',
  '/clients': 'Clients',
  '/clients/*': 'All Client Pages',
  '/social-content-engine': 'Social Content Engine',
  '/social-content-engine/*': 'All Social Content Pages',
  '/pipeline': 'Pipeline',
  '/pipeline/*': 'All Pipeline Pages',
  '/email': 'Email',
  '/email/*': 'All Email Pages',
  '/analytics': 'Analytics',
  '/analytics/*': 'All Analytics Pages',
  '/settings': 'Settings',
  '/settings/*': 'All Settings Pages'
}