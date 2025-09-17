"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lock, MessageCircle, X } from 'lucide-react'
import { toast } from 'sonner'

export default function RestrictedAccessNotification() {
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const restricted = searchParams.get('restricted')
    const restrictionReason = searchParams.get('reason')
    
    if (restricted === 'true') {
      setIsVisible(true)
      setReason(decodeURIComponent(restrictionReason || 'Access to the requested page is restricted'))
      
      // Show toast notification
      toast.error('Access Restricted', {
        description: restrictionReason || 'You don\'t have permission to access that page'
      })
    }
  }, [searchParams])

  if (!isVisible) {
    return null
  }

  return (
    <div className="mb-6">
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Access Restricted</AlertTitle>
        <AlertDescription className="text-red-700 mt-2">
          <p className="mb-3">{reason}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-start space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Need Access?</p>
                <p className="text-blue-700 mb-2">
                  Contact Largify Solutions via WhatsApp for subscription upgrades and access permissions.
                </p>
                <p className="text-xs text-blue-600">
                  WhatsApp: +966 59 736 9443
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm"
              onClick={() => window.open('https://wa.me/966597369443', '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              Contact WhatsApp
            </Button>
            
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setIsVisible(false)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Hook to check if current page access was restricted
export function useRestrictedAccess() {
  const searchParams = useSearchParams()
  
  return {
    isRestricted: searchParams.get('restricted') === 'true',
    reason: searchParams.get('reason') ? decodeURIComponent(searchParams.get('reason')!) : null
  }
}