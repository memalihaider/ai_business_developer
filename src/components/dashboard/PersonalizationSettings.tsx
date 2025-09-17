"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings, 
  Palette, 
  Layout, 
  Bell, 
  Clock, 
  Eye, 
  EyeOff,
  Save,
  RotateCcw,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Tablet,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PersonalizationSettings {
  theme: 'light' | 'dark' | 'system'
  layout: 'grid' | 'masonry' | 'columns'
  refreshInterval: number
  notifications: {
    newLeads: boolean
    proposalUpdates: boolean
  
    revenueAlerts: boolean
    systemUpdates: boolean
  }
  widgets: {
    leads: { visible: boolean; size: 'small' | 'medium' | 'large' | 'full' }
    proposals: { visible: boolean; size: 'small' | 'medium' | 'large' | 'full' }
  
    revenue: { visible: boolean; size: 'small' | 'medium' | 'large' | 'full' }
    activities: { visible: boolean; size: 'small' | 'medium' | 'large' | 'full' }
    charts: { visible: boolean; size: 'small' | 'medium' | 'large' | 'full' }
  }
  chartPreferences: {
    defaultType: 'line' | 'bar' | 'area' | 'pie'
    defaultTimeRange: '7d' | '30d' | '90d' | '1y'
    showTrends: boolean
    animateCharts: boolean
  }
  displayOptions: {
    compactMode: boolean
    showTooltips: boolean
    highContrast: boolean
    reducedMotion: boolean
  }
}

interface PersonalizationSettingsProps {
  className?: string
  settings?: PersonalizationSettings
  onSettingsChange?: (settings: PersonalizationSettings) => void
  onClose?: () => void
}

const defaultSettings: PersonalizationSettings = {
  theme: 'system',
  layout: 'grid',
  refreshInterval: 30000,
  notifications: {
    newLeads: true,
    proposalUpdates: true,

    revenueAlerts: true,
    systemUpdates: false
  },
  widgets: {
    leads: { visible: true, size: 'medium' },
    proposals: { visible: true, size: 'medium' },

    revenue: { visible: true, size: 'large' },
    activities: { visible: true, size: 'medium' },
    charts: { visible: true, size: 'large' }
  },
  chartPreferences: {
    defaultType: 'line',
    defaultTimeRange: '30d',
    showTrends: true,
    animateCharts: true
  },
  displayOptions: {
    compactMode: false,
    showTooltips: true,
    highContrast: false,
    reducedMotion: false
  }
}

export function PersonalizationSettings({ 
  className,
  settings = defaultSettings,
  onSettingsChange,
  onClose
}: PersonalizationSettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<PersonalizationSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync with external settings changes
  useEffect(() => {
    setCurrentSettings(settings)
    setHasChanges(false)
  }, [settings])

  const updateSettings = useCallback((updates: Partial<PersonalizationSettings>) => {
    const newSettings = { ...currentSettings, ...updates }
    setCurrentSettings(newSettings)
    setHasChanges(true)
  }, [currentSettings])

  const updateNestedSettings = useCallback(<T extends keyof PersonalizationSettings>(
    section: T,
    updates: Partial<PersonalizationSettings[T]>
  ) => {
    const newSettings = {
      ...currentSettings,
      [section]: { ...currentSettings[section], ...updates }
    }
    setCurrentSettings(newSettings)
    setHasChanges(true)
  }, [currentSettings])

  const saveSettings = useCallback(() => {
    try {
      onSettingsChange?.(currentSettings)
      localStorage.setItem('dashboard-settings', JSON.stringify(currentSettings))
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Could add toast notification here
    }
  }, [currentSettings, onSettingsChange])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose()
      }
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        if (hasChanges) {
          saveSettings()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, hasChanges, saveSettings])

  const resetSettings = useCallback(() => {
    try {
      setCurrentSettings(defaultSettings)
      setHasChanges(true)
      // Clear localStorage to ensure clean reset
      localStorage.removeItem('dashboard-settings')
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }, [])

  const getThemeIcon = (theme: PersonalizationSettings['theme']) => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />
      case 'dark': return <Moon className="w-4 h-4" />
      case 'system': return <Monitor className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const getWidgetIcon = (widget: string) => {
    switch (widget) {
      case 'leads': return <Users className="w-4 h-4" />
      case 'proposals': return <FileText className="w-4 h-4" />
  
      case 'revenue': return <DollarSign className="w-4 h-4" />
      case 'activities': return <Activity className="w-4 h-4" />
      case 'charts': return <BarChart3 className="w-4 h-4" />
      default: return <Layout className="w-4 h-4" />
    }
  }

  return (
    <Card className={cn("h-full max-w-4xl mx-auto", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-[#7A8063] flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Dashboard Settings
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={resetSettings}
              className="h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={!hasChanges}
              className="h-8 bg-[#7A8063] hover:bg-[#7A8055]"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
                aria-label="Close settings"
                title="Close settings"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme & Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <Button
                        key={theme}
                        size="sm"
                        variant={currentSettings.theme === theme ? 'default' : 'outline'}
                        onClick={() => updateSettings({ theme })}
                        className="flex items-center gap-2 capitalize"
                      >
                        {getThemeIcon(theme)}
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <Switch
                      id="high-contrast"
                      checked={currentSettings.displayOptions.highContrast}
                      onCheckedChange={(checked) => 
                        updateNestedSettings('displayOptions', { highContrast: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reduced-motion">Reduced Motion</Label>
                    <Switch
                      id="reduced-motion"
                      checked={currentSettings.displayOptions.reducedMotion}
                      onCheckedChange={(checked) => 
                        updateNestedSettings('displayOptions', { reducedMotion: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Layout Settings */}
          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Dashboard Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <div className="flex gap-2">
                    {(['grid', 'masonry', 'columns'] as const).map((layout) => (
                      <Button
                        key={layout}
                        size="sm"
                        variant={currentSettings.layout === layout ? 'default' : 'outline'}
                        onClick={() => updateSettings({ layout })}
                        className="capitalize"
                      >
                        {layout}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Auto Refresh Interval</Label>
                  <Select 
                    value={currentSettings.refreshInterval.toString()} 
                    onValueChange={(value) => updateSettings({ refreshInterval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">1 minute</SelectItem>
                      <SelectItem value="300000">5 minutes</SelectItem>
                      <SelectItem value="0">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <Switch
                    id="compact-mode"
                    checked={currentSettings.displayOptions.compactMode}
                    onCheckedChange={(checked) => 
                      updateNestedSettings('displayOptions', { compactMode: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Widget Settings */}
          <TabsContent value="widgets" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Widget Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {Object.entries(currentSettings.widgets).map(([widget, config]) => (
                      <div key={widget} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getWidgetIcon(widget)}
                          <div>
                            <Label className="capitalize font-medium">{widget}</Label>
                            <p className="text-xs text-gray-500">Configure {widget} widget</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Select 
                            value={config.size} 
                            onValueChange={(size) => 
                              updateNestedSettings('widgets', {
                                ...currentSettings.widgets,
                                [widget]: { ...config, size: size as any }
                              })
                            }
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">S</SelectItem>
                              <SelectItem value="medium">M</SelectItem>
                              <SelectItem value="large">L</SelectItem>
                              <SelectItem value="full">XL</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Switch
                            checked={config.visible}
                            onCheckedChange={(visible) => 
                              updateNestedSettings('widgets', {
                                ...currentSettings.widgets,
                                [widget]: { ...config, visible }
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(currentSettings.notifications).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <Switch
                      id={key}
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        updateNestedSettings('notifications', { [key]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Chart Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Chart Type</Label>
                    <Select 
                      value={currentSettings.chartPreferences.defaultType} 
                      onValueChange={(defaultType) => 
                        updateNestedSettings('chartPreferences', { defaultType: defaultType as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Default Time Range</Label>
                    <Select 
                      value={currentSettings.chartPreferences.defaultTimeRange} 
                      onValueChange={(defaultTimeRange) => 
                        updateNestedSettings('chartPreferences', { defaultTimeRange: defaultTimeRange as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                        <SelectItem value="90d">90 days</SelectItem>
                        <SelectItem value="1y">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-trends">Show Trends</Label>
                    <Switch
                      id="show-trends"
                      checked={currentSettings.chartPreferences.showTrends}
                      onCheckedChange={(checked) => 
                        updateNestedSettings('chartPreferences', { showTrends: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animate-charts">Animate Charts</Label>
                    <Switch
                      id="animate-charts"
                      checked={currentSettings.chartPreferences.animateCharts}
                      onCheckedChange={(checked) => 
                        updateNestedSettings('chartPreferences', { animateCharts: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Display Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-tooltips">Show Tooltips</Label>
                  <Switch
                    id="show-tooltips"
                    checked={currentSettings.displayOptions.showTooltips}
                    onCheckedChange={(checked) => 
                      updateNestedSettings('displayOptions', { showTooltips: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PersonalizationSettings