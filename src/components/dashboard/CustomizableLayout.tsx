"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  GripVertical, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Save,
  Layout,
  Grid3X3,
  Columns,
  Rows
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardWidget {
  id: string
  title: string
  component: React.ReactNode
  size: 'small' | 'medium' | 'large' | 'full'
  visible: boolean
  position: { x: number; y: number }
}

interface CustomizableLayoutProps {
  widgets: DashboardWidget[]
  onLayoutChange?: (widgets: DashboardWidget[]) => void
  editMode?: boolean
  onEditModeChange?: (editMode: boolean) => void
}

export function CustomizableLayout({ 
  widgets: initialWidgets, 
  onLayoutChange,
  editMode = false,
  onEditModeChange 
}: CustomizableLayoutProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry' | 'columns'>('grid')

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    if (!editMode) return
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
  }, [editMode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    const newWidgets = [...widgets]
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget)
    const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = newWidgets.splice(draggedIndex, 1)
      newWidgets.splice(targetIndex, 0, draggedItem)
      
      setWidgets(newWidgets)
      onLayoutChange?.(newWidgets)
    }
    
    setDraggedWidget(null)
  }, [draggedWidget, widgets, onLayoutChange])

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    const newWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    )
    setWidgets(newWidgets)
    onLayoutChange?.(newWidgets)
  }, [widgets, onLayoutChange])

  const changeWidgetSize = useCallback((widgetId: string, size: DashboardWidget['size']) => {
    const newWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size }
        : widget
    )
    setWidgets(newWidgets)
    onLayoutChange?.(newWidgets)
  }, [widgets, onLayoutChange])

  const resetLayout = useCallback(() => {
    setWidgets(initialWidgets)
    onLayoutChange?.(initialWidgets)
  }, [initialWidgets, onLayoutChange])

  const saveLayout = useCallback(() => {
    // Here you would typically save to localStorage or API
    localStorage.setItem('dashboard-layout', JSON.stringify(widgets))
    onEditModeChange?.(false)
  }, [widgets, onEditModeChange])

  const getGridClasses = (size: DashboardWidget['size']) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1'
      case 'medium': return 'col-span-2 row-span-1'
      case 'large': return 'col-span-2 row-span-2'
      case 'full': return 'col-span-full row-span-1'
      default: return 'col-span-1 row-span-1'
    }
  }

  const getLayoutClasses = () => {
    switch (layoutStyle) {
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 auto-rows-min'
      case 'masonry':
        return 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
      case 'columns':
        return 'flex flex-col lg:flex-row gap-6'
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
    }
  }

  return (
    <div className="space-y-6">
      {/* Layout Controls */}
      {editMode && (
        <Card className="p-4 border-[#7A8063]/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Edit Mode
              </Badge>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Layout:</span>
                <Button
                  size="sm"
                  variant={layoutStyle === 'grid' ? 'default' : 'outline'}
                  onClick={() => setLayoutStyle('grid')}
                  className="h-8"
                >
                  <Grid3X3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={layoutStyle === 'columns' ? 'default' : 'outline'}
                  onClick={() => setLayoutStyle('columns')}
                  className="h-8"
                >
                  <Columns className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={layoutStyle === 'masonry' ? 'default' : 'outline'}
                  onClick={() => setLayoutStyle('masonry')}
                  className="h-8"
                >
                  <Layout className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={resetLayout}
                className="h-8"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={saveLayout}
                className="h-8 bg-[#7A8063] hover:bg-[#7A8055]"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Layout
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Widget Grid */}
      <div className={getLayoutClasses()}>
        {widgets
          .filter(widget => widget.visible)
          .map((widget) => (
            <Card
              key={widget.id}
              className={cn(
                "relative transition-all duration-300 hover:shadow-lg",
                layoutStyle === 'grid' && getGridClasses(widget.size),
                layoutStyle === 'masonry' && "break-inside-avoid mb-6",
                layoutStyle === 'columns' && "flex-1 min-w-0",
                editMode && "cursor-move border-dashed border-2 border-[#7A8063]/50",
                draggedWidget === widget.id && "opacity-50 scale-95"
              )}
              draggable={editMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
            >
              {/* Edit Mode Controls */}
              {editMode && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className="h-6 w-6 p-0 hover:bg-white/80"
                  >
                    {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  
                  <div className="flex items-center">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}
              
              {/* Size Controls */}
              {editMode && (
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                  {['small', 'medium', 'large', 'full'].map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant={widget.size === size ? 'default' : 'ghost'}
                      onClick={() => changeWidgetSize(widget.id, size as DashboardWidget['size'])}
                      className="h-5 w-5 p-0 text-xs"
                    >
                      {size[0].toUpperCase()}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Widget Content */}
              <div className={cn(editMode && "pointer-events-none")}>
                {widget.component}
              </div>
            </Card>
          ))
        }
      </div>

      {/* Hidden Widgets Panel */}
      {editMode && widgets.some(w => !w.visible) && (
        <Card className="p-4 border-[#7A8063]/30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#7A8063]">
              Hidden Widgets
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {widgets
              .filter(widget => !widget.visible)
              .map((widget) => (
                <Button
                  key={widget.id}
                  size="sm"
                  variant="outline"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="h-8 text-xs"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  {widget.title}
                </Button>
              ))
            }
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CustomizableLayout