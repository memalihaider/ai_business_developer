"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download,
  Maximize2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  date: string
  leads: number
  proposals: number

  revenue: number
  conversions: number
}

interface InteractiveChartsProps {
  className?: string
  data?: ChartDataPoint[]
  showControls?: boolean
  defaultTimeRange?: '7d' | '30d' | '90d' | '1y'
  defaultChartType?: 'bar' | 'line' | 'area' | 'pie'
}

const generateMockData = (days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      leads: Math.floor(Math.random() * 50) + 10,
      proposals: Math.floor(Math.random() * 20) + 5,
  
      revenue: Math.floor(Math.random() * 10000) + 2000,
      conversions: Math.floor(Math.random() * 15) + 3
    })
  }
  
  return data
}

const COLORS = {
  leads: '#8884d8',
  proposals: '#82ca9d',

  revenue: '#ff7300',
  conversions: '#00ff88'
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function InteractiveCharts({ 
  className,
  data,
  showControls = true,
  defaultTimeRange = '30d',
  defaultChartType = 'line'
}: InteractiveChartsProps) {
  const [timeRange, setTimeRange] = useState(defaultTimeRange)
  const [chartType, setChartType] = useState(defaultChartType)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['leads', 'proposals', 'revenue'])
  const [isFullscreen, setIsFullscreen] = useState(false)

  const chartData = useMemo(() => {
    if (data) return data
    
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange]
    
    return generateMockData(days)
  }, [data, timeRange])

  const pieData = useMemo(() => {
    const totals = chartData.reduce((acc, item) => {
      acc.leads += item.leads
      acc.proposals += item.proposals

      acc.conversions += item.conversions
      return acc
    }, { leads: 0, proposals: 0, conversions: 0 })

    return [
      { name: 'Leads', value: totals.leads, color: PIE_COLORS[0] },
      { name: 'Proposals', value: totals.proposals, color: PIE_COLORS[1] },
  
      { name: 'Conversions', value: totals.conversions, color: PIE_COLORS[3] }
    ]
  }, [chartData])

  const toggleMetric = useCallback((metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }, [])

  const calculateTrend = useCallback((metric: keyof ChartDataPoint) => {
    if (chartData.length < 2) return 0
    
    const recent = chartData.slice(-7).reduce((sum, item) => sum + (item[metric] as number), 0) / 7
    const previous = chartData.slice(-14, -7).reduce((sum, item) => sum + (item[metric] as number), 0) / 7
    
    return ((recent - previous) / previous) * 100
  }, [chartData])

  const exportData = useCallback(() => {
    const csv = [
      ['Date', ...selectedMetrics].join(','),
      ...chartData.map(item => 
        [item.date, ...selectedMetrics.map(metric => item[metric as keyof ChartDataPoint])].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-data-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [chartData, selectedMetrics, timeRange])

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            {selectedMetrics.map(metric => (
              <Bar 
                key={metric} 
                dataKey={metric} 
                fill={COLORS[metric as keyof typeof COLORS]} 
                name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {selectedMetrics.map(metric => (
                <linearGradient key={metric} id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[metric as keyof typeof COLORS]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[metric as keyof typeof COLORS]} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            {selectedMetrics.map(metric => (
              <Area 
                key={metric}
                type="monotone" 
                dataKey={metric} 
                stroke={COLORS[metric as keyof typeof COLORS]}
                fill={`url(#color${metric})`}
                name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        )
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
          </PieChart>
        )
      
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            {selectedMetrics.map(metric => (
              <Line 
                key={metric}
                type="monotone" 
                dataKey={metric} 
                stroke={COLORS[metric as keyof typeof COLORS]} 
                name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        )
    }
  }

  return (
    <Card className={cn(
      "h-full transition-all duration-300",
      isFullscreen && "fixed inset-4 z-50 shadow-2xl",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analytics Dashboard
          </CardTitle>
          
          {showControls && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Range Selector */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Chart Type Selector */}
              <div className="flex items-center border rounded-md">
                <Button
                  size="sm"
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  onClick={() => setChartType('line')}
                  className="h-8 px-2"
                >
                  <LineChartIcon className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'bar' ? 'default' : 'ghost'}
                  onClick={() => setChartType('bar')}
                  className="h-8 px-2"
                >
                  <BarChart3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  onClick={() => setChartType('area')}
                  className="h-8 px-2"
                >
                  <Activity className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={chartType === 'pie' ? 'default' : 'ghost'}
                  onClick={() => setChartType('pie')}
                  className="h-8 px-2"
                >
                  <PieChartIcon className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Action Buttons */}
              <Button
                size="sm"
                variant="outline"
                onClick={exportData}
                className="h-8"
              >
                <Download className="w-3 h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Metric Filters */}
        {chartType !== 'pie' && (
          <div className="flex items-center gap-2 flex-wrap mt-4">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Metrics:
            </span>
            {Object.keys(COLORS).map(metric => {
              const trend = calculateTrend(metric as keyof ChartDataPoint)
              return (
                <Badge
                  key={metric}
                  variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    selectedMetrics.includes(metric) && "bg-[#7A8063] hover:bg-[#7A8055]"
                  )}
                  onClick={() => toggleMetric(metric)}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: COLORS[metric as keyof typeof COLORS] }}
                  />
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  {trend !== 0 && (
                    <span className={cn(
                      "ml-1 flex items-center",
                      trend > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                </Badge>
              )
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          "w-full transition-all duration-300",
          isFullscreen ? "h-[calc(100vh-200px)]" : "h-80"
        )}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default InteractiveCharts