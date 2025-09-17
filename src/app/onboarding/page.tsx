"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  FileText, 
  BarChart3, 
  Share2, 
  Mail, 
  Settings,
  Sparkles,
  Phone,
  Clock,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  tips?: string[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to Largify Solutions",
    description: "Your AI-powered business development platform",
    icon: <Sparkles className="h-8 w-8 text-blue-600" />,
    features: [
      "AI-driven lead generation and management",
      "Automated proposal creation and tracking",
      "Social media content engine",
      "Email marketing automation",
      "Comprehensive analytics dashboard"
    ],
    tips: [
      "Start with the Dashboard to get an overview",
      "Use the Pipeline to track your leads",
      "Generate proposals with AI assistance"
    ]
  },
  {
    id: 2,
    title: "Lead Management & Pipeline",
    description: "Organize and track your business opportunities",
    icon: <Users className="h-8 w-8 text-green-600" />,
    features: [
      "Import leads from multiple sources",
      "AI-powered lead scoring and qualification",
      "Visual pipeline management",
      "Automated follow-up reminders",
      "Lead conversion tracking"
    ],
    tips: [
      "Add leads manually or import from CSV",
      "Use tags to categorize your leads",
      "Set up automated follow-up sequences"
    ]
  },
  {
    id: 3,
    title: "AI Proposal Generation",
    description: "Create professional proposals in minutes",
    icon: <FileText className="h-8 w-8 text-purple-600" />,
    features: [
      "AI-generated proposal content",
      "Customizable templates",
      "Real-time collaboration",
      "Digital signatures",
      "Proposal analytics and tracking"
    ],
    tips: [
      "Use templates to speed up proposal creation",
      "Customize proposals for each client",
      "Track proposal views and engagement"
    ]
  },
  {
    id: 4,
    title: "Social Content Engine",
    description: "Automate your social media presence",
    icon: <Share2 className="h-8 w-8 text-pink-600" />,
    features: [
      "AI content generation",
      "Multi-platform scheduling",
      "Content calendar management",
      "Performance analytics",
      "Hashtag optimization"
    ],
    tips: [
      "Schedule content in advance",
      "Use AI to generate engaging posts",
      "Monitor performance metrics"
    ]
  },
  {
    id: 5,
    title: "Email Marketing",
    description: "Engage your audience with targeted campaigns",
    icon: <Mail className="h-8 w-8 text-orange-600" />,
    features: [
      "Email sequence automation",
      "Template library",
      "A/B testing",
      "Deliverability optimization",
      "Campaign analytics"
    ],
    tips: [
      "Start with welcome email sequences",
      "Segment your audience for better targeting",
      "Test different subject lines"
    ]
  },
  {
    id: 6,
    title: "Analytics & Insights",
    description: "Make data-driven business decisions",
    icon: <BarChart3 className="h-8 w-8 text-indigo-600" />,
    features: [
      "Real-time dashboard",
      "Custom reports",
      "ROI tracking",
      "Performance metrics",
      "Export capabilities"
    ],
    tips: [
      "Check your dashboard daily",
      "Set up custom KPI tracking",
      "Use insights to optimize campaigns"
    ]
  }
]

export default function OnboardingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isCompleting, setIsCompleting] = useState(false)

  const progress = (currentStep / onboardingSteps.length) * 100
  const currentStepData = onboardingSteps.find(step => step.id === currentStep)

  useEffect(() => {
    // Check if user has already completed onboarding
    if (user && user.preferences?.onboardingCompleted) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      // Mark onboarding as completed
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast.success('Welcome aboard!', {
          description: 'Onboarding completed successfully. Redirecting to dashboard...'
        })
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Error', {
        description: 'Failed to complete onboarding. Please try again.'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Largify Solutions
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Let's get you started with your AI-powered business development journey
          </p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Progress value={progress} className="w-64" />
            <span className="text-sm font-medium text-gray-600">
              {currentStep} of {onboardingSteps.length}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {currentStepData?.icon}
            </div>
            <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentStepData?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentStepData?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {currentStepData?.tips && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Pro Tips:</h3>
                <ul className="space-y-2">
                  {currentStepData.tips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-blue-800">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <MessageCircle className="h-5 w-5" />
              <span>Need Help? We're Here for You!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800 mb-1">WhatsApp Support</h4>
                <p className="text-sm text-green-700 mb-3">+966 59 736 9443</p>
                <Button 
                  size="sm"
                  onClick={() => window.open('https://wa.me/966597369443', '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Chat Now
                </Button>
              </div>
              
              <div className="text-center">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800 mb-1">Response Time</h4>
                <p className="text-sm text-green-700 mb-3">Usually within 1 hour</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Fast Support
                </Badge>
              </div>
              
              <div className="text-center">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800 mb-1">Expert Guidance</h4>
                <p className="text-sm text-green-700 mb-3">Setup & optimization help</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Professional
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} className="text-gray-600">
              Skip Onboarding
            </Button>
          </div>
          
          <div>
            {currentStep < onboardingSteps.length ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCompleting ? 'Completing...' : 'Get Started'}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}