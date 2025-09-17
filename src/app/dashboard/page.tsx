"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Briefcase, 
  FileText, 
  PlusCircle, 
  DollarSign, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Settings
} from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts"
import { useDashboardMetrics, useConnectionStatus } from "@/hooks/useDashboardMetrics"
import { cn } from "@/lib/utils"
import PersonalizationSettings from "@/components/dashboard/PersonalizationSettings"
import CustomizableDashboard from "@/components/dashboard/CustomizableDashboard"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  
  // Real-time data hooks
  const { data: metrics, loading, error, refresh, lastFetched } = useDashboardMetrics({
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true
  })
  const { isOnline, lastSync } = useConnectionStatus()

  // UI states
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [dashboardSettings, setDashboardSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-settings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return null
        }
      }
    }
    return null
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }



  // Loading skeleton component
  const MetricSkeleton = () => (
    <Card className="p-4 border-[#7A8063]/30 dark:border-[#7A8063]/20 shadow-lg dark:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex items-center justify-between pb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )

  // Error state
  if (error && !metrics) {
    return (
      <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 shadow-lg">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load dashboard data: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleManualRefresh} className="bg-[#7A8063] hover:bg-[#7A8055] shadow-lg hover:shadow-xl transition-all duration-300">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7A8063] to-[#5C6047] bg-clip-text text-transparent">
            Business Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <Badge 
            variant={isOnline ? "default" : "destructive"} 
            className={cn(
              "flex items-center gap-1 px-3 py-1 transition-all duration-300",
              isOnline ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200" : ""
            )}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
          
          {/* Last Updated */}
          {lastSync && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Clock className="w-3 h-3" />
              {lastSync.toLocaleTimeString()}
            </Badge>
          )}
          
          {/* Manual Refresh */}
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing || loading}
            size="sm"
            variant="outline"
            className="border-[#7A8063]/40 hover:bg-[#7A8063]/10 transition-all duration-300"
          >
            <RefreshCw className={cn("w-4 h-4", (isRefreshing || loading) && "animate-spin")} />
          </Button>
          
          {/* Settings Button */}
          <Button 
            onClick={() => setShowSettings(true)}
            size="sm"
            variant="outline"
            className="border-[#7A8063]/40 hover:bg-[#7A8063]/10 transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Customizable Dashboard */}
      <CustomizableDashboard metrics={metrics} loading={loading} refresh={refresh} />

      {/* Recent Activity & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 border-[#7A8063]/30 dark:border-[#7A8063]/20 shadow-lg dark:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            ) : (
              (metrics?.activities || []).map((activity, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{activity}</p>
                </div>
              ))
            )}
            {(!metrics?.activities || metrics.activities.length === 0) && !loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activities
              </p>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Chart */}
        <Card className="lg:col-span-2 p-6 border-[#7A8063]/30 dark:border-[#7A8063]/20 shadow-lg dark:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="space-y-4 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-3/6" />
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={metrics?.chartData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A8063" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7A8063" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--background)", 
                      border: "1px solid #7A8063",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      color: "var(--foreground)"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#7A8063" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="proposals" 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                  />

                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <PersonalizationSettings
              settings={dashboardSettings || undefined}
              onSettingsChange={(settings) => {
                setDashboardSettings(settings)
                // Apply settings to dashboard
                localStorage.setItem('dashboard-settings', JSON.stringify(settings))
              }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
