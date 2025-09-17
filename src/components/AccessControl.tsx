"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, ArrowLeft, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AccessControlProps {
  children: React.ReactNode
  requiredRoute?: string
}

interface UserRestriction {
  id: string
  pageRoute: string
  isBlocked: boolean
  reason?: string
}

export default function AccessControl({ children, requiredRoute }: AccessControlProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [restrictionReason, setRestrictionReason] = useState<string>('')
  const [checkingAccess, setCheckingAccess] = useState(true)

  const routeToCheck = requiredRoute || pathname

  useEffect(() => {
    async function checkAccess() {
      if (isLoading) return
      
      if (!user) {
        setHasAccess(false)
        setCheckingAccess(false)
        return
      }

      // Admin users have access to everything
      if (user.role === 'ADMIN') {
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }

      try {
        // Check if user has restrictions for this route
        const response = await fetch(`/api/admin/users/${user.id}/restrictions`)
        
        if (!response.ok) {
          setHasAccess(true) // Default to allow access if can't check restrictions
          setCheckingAccess(false)
          return
        }

        const data = await response.json()
        const restrictions: UserRestriction[] = data.restrictions || []
        
        // Check if current route is restricted
        const restriction = restrictions.find(r => {
          // Exact match
          if (r.pageRoute === routeToCheck) return true
          
          // Wildcard match (e.g., /dashboard/* matches /dashboard/analytics)
          if (r.pageRoute.endsWith('/*')) {
            const basePath = r.pageRoute.slice(0, -2)
            return routeToCheck.startsWith(basePath)
          }
          
          return false
        })

        if (restriction && restriction.isBlocked) {
          setHasAccess(false)
          setRestrictionReason(restriction.reason || 'Access to this page is restricted')
        } else {
          setHasAccess(true)
        }
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(true) // Default to allow access on error
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [user, isLoading, routeToCheck])

  // Show loading state
  if (isLoading || checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show access denied if user doesn't have access
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-gray-600">
              {restrictionReason || 'You don\'t have permission to access this page'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Need Access?
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Contact Largify Solutions via WhatsApp for:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Subscription upgrades</li>
                    <li>• Access permissions</li>
                    <li>• General inquiries</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => window.open('https://wa.me/966597369443', '_blank')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact via WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                WhatsApp: +966 59 736 9443
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has access, render children
  return <>{children}</>
}

// Higher-order component for easy page wrapping
export function withAccessControl<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoute?: string
) {
  return function AccessControlledComponent(props: P) {
    return (
      <AccessControl requiredRoute={requiredRoute}>
        <WrappedComponent {...props} />
      </AccessControl>
    )
  }
}