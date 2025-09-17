"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchPreferences } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // Routes that should skip onboarding check
  const skipOnboardingRoutes = [
    '/login',
    '/onboarding',
    '/api',
    '/_next',
    '/favicon.ico'
  ]

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (isLoading) return
      
      // Skip check for certain routes
      if (skipOnboardingRoutes.some(route => pathname.startsWith(route))) {
        setCheckingOnboarding(false)
        return
      }

      // Skip if user is not authenticated
      if (!user) {
        setCheckingOnboarding(false)
        return
      }

      try {
        // Fetch user preferences to check onboarding status
        const preferences = await fetchPreferences()
        
        // If user hasn't completed onboarding, redirect to onboarding page
        if (!preferences?.onboardingCompleted) {
          router.push('/onboarding')
          return
        }
        
        setCheckingOnboarding(false)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user, isLoading, pathname, router, fetchPreferences])

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}