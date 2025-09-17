"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  User, 
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'lead' | 'proposal' | 'revenue' | 'task' | 'system'
  title: string
  description: string
  timestamp: Date
  user?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  className?: string
  maxItems?: number
  refreshInterval?: number
  showHeader?: boolean
  compact?: boolean
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Generated',
    description: 'John Smith from TechCorp submitted a contact form',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: 'System',
    status: 'success'
  },
  {
    id: '2',
    type: 'proposal',
    title: 'Proposal Sent',
    description: 'Website redesign proposal sent to ABC Company',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    user: 'Sarah Johnson',
    status: 'info'
  },

  {
    id: '4',
    type: 'revenue',
    title: 'Payment Received',
    description: '$5,000 payment received from XYZ Corp',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    user: 'System',
    status: 'success'
  },
  {
    id: '5',
    type: 'task',
    title: 'Task Overdue',
    description: 'Client review meeting scheduled for yesterday',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    user: 'System',
    status: 'warning'
  }
]

export function ActivityFeed({ 
  className,
  maxItems = 10,
  refreshInterval = 30000, // 30 seconds
  showHeader = true,
  compact = false
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities)
  const [isLoading, setIsLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchActivities = useCallback(async () => {
    if (isPaused) return
    
    setIsLoading(true)
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/activities')
      // const data = await response.json()
      
      // Simulate new activity occasionally
      if (Math.random() > 0.7) {
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: ['lead', 'proposal', 'revenue', 'task'][Math.floor(Math.random() * 4)] as ActivityItem['type'],
          title: 'New Activity',
          description: `Activity generated at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date(),
          user: 'System',
          status: ['success', 'info', 'warning'][Math.floor(Math.random() * 3)] as ActivityItem['status']
        }
        
        setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isPaused, maxItems])

  const manualRefresh = useCallback(() => {
    fetchActivities()
  }, [fetchActivities])

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(fetchActivities, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchActivities, refreshInterval, isPaused])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead': return <User className="w-4 h-4" />
      case 'proposal': return <FileText className="w-4 h-4" />

      case 'revenue': return <DollarSign className="w-4 h-4" />
      case 'task': return <Calendar className="w-4 h-4" />
      case 'system': return <Activity className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Card className={cn("h-full", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Feed
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(lastUpdate)}
              </Badge>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePause}
                className="h-7 w-7 p-0"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={manualRefresh}
                disabled={isLoading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn("p-0", showHeader && "px-6 pb-6")}>
        <ScrollArea className={cn("h-full", compact ? "max-h-64" : "max-h-96")}>
          <div className="space-y-3 p-1">
            {activities.slice(0, maxItems).map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                  getStatusColor(activity.status),
                  index === 0 && "ring-2 ring-[#7A8063]/20 animate-pulse"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  getStatusColor(activity.status)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "font-medium text-sm truncate",
                      compact && "text-xs"
                    )}>
                      {activity.title}
                    </h4>
                    <span className={cn(
                      "text-xs text-gray-500 flex-shrink-0",
                      compact && "text-[10px]"
                    )}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className={cn(
                    "text-sm text-gray-600 mt-1",
                    compact && "text-xs line-clamp-1"
                  )}>
                    {activity.description}
                  </p>
                  
                  {activity.user && (
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="secondary" className={cn(
                        "text-xs",
                        compact && "text-[10px] px-1 py-0"
                      )}>
                        {activity.user}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        compact && "text-[10px] px-1 py-0"
                      )}>
                        {activity.type}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default ActivityFeed