'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  MousePointer,
  Reply,
  UserMinus,
  Users,
  Clock,
  Target,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  MapPin
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalRecipients: number;
    emailsSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    unsubscribeRate: number;
    bounceRate: number;
    revenue: number;
    roi: number;
  };
  trends: {
    period: string;
    emailsSent: number[];
    opens: number[];
    clicks: number[];
    replies: number[];
    unsubscribes: number[];
    labels: string[];
  };
  campaigns: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
    recipients: number;
    sent: number;
    opens: number;
    clicks: number;
    replies: number;
    unsubscribes: number;
    revenue: number;
    createdAt: string;
    lastActivity: string;
  }>;
  engagement: {
    byTime: Array<{ hour: number; opens: number; clicks: number }>;
    byDay: Array<{ day: string; opens: number; clicks: number }>;
    byDevice: Array<{ device: string; count: number; percentage: number }>;
    byLocation: Array<{ country: string; opens: number; clicks: number }>;
  };
  templates: Array<{
    id: string;
    name: string;
    usage: number;
    openRate: number;
    clickRate: number;
    performance: 'high' | 'medium' | 'low';
  }>;
  abTests: Array<{
    id: string;
    name: string;
    status: 'running' | 'completed' | 'paused';
    variants: Array<{
      name: string;
      sent: number;
      opens: number;
      clicks: number;
      conversions: number;
    }>;
    winner?: string;
    confidence: number;
  }>;
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf') => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  isLoading = false,
  onRefresh,
  onExport
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('opens');
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock data for demonstration
  const mockData: AnalyticsData = {
    overview: {
      totalCampaigns: 24,
      activeCampaigns: 8,
      totalRecipients: 15420,
      emailsSent: 45680,
      deliveryRate: 98.2,
      openRate: 24.5,
      clickRate: 3.8,
      replyRate: 1.2,
      unsubscribeRate: 0.3,
      bounceRate: 1.8,
      revenue: 125400,
      roi: 420
    },
    trends: {
      period: '7d',
      emailsSent: [1200, 1450, 1100, 1800, 1600, 1350, 1500],
      opens: [290, 355, 270, 440, 390, 330, 365],
      clicks: [45, 58, 42, 72, 65, 52, 58],
      replies: [12, 18, 15, 22, 19, 16, 20],
      unsubscribes: [3, 5, 2, 8, 6, 4, 5],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    campaigns: [
      {
        id: '1',
        name: 'Welcome Series',
        status: 'active',
        recipients: 2500,
        sent: 7500,
        opens: 1875,
        clicks: 285,
        replies: 95,
        unsubscribes: 12,
        revenue: 15600,
        createdAt: '2024-01-15',
        lastActivity: '2024-01-20'
      },
      {
        id: '2',
        name: 'Product Launch',
        status: 'completed',
        recipients: 5200,
        sent: 5200,
        opens: 1456,
        clicks: 312,
        replies: 78,
        unsubscribes: 25,
        revenue: 45200,
        createdAt: '2024-01-10',
        lastActivity: '2024-01-18'
      }
    ],
    engagement: {
      byTime: [
        { hour: 9, opens: 145, clicks: 23 },
        { hour: 10, opens: 189, clicks: 31 },
        { hour: 11, opens: 167, clicks: 28 },
        { hour: 14, opens: 201, clicks: 35 },
        { hour: 15, opens: 178, clicks: 29 },
        { hour: 16, opens: 156, clicks: 25 }
      ],
      byDay: [
        { day: 'Monday', opens: 290, clicks: 45 },
        { day: 'Tuesday', opens: 355, clicks: 58 },
        { day: 'Wednesday', opens: 270, clicks: 42 },
        { day: 'Thursday', opens: 440, clicks: 72 },
        { day: 'Friday', opens: 390, clicks: 65 }
      ],
      byDevice: [
        { device: 'Desktop', count: 1250, percentage: 45 },
        { device: 'Mobile', count: 1100, percentage: 40 },
        { device: 'Tablet', count: 420, percentage: 15 }
      ],
      byLocation: [
        { country: 'United States', opens: 850, clicks: 125 },
        { country: 'United Kingdom', opens: 320, clicks: 48 },
        { country: 'Canada', opens: 280, clicks: 42 },
        { country: 'Australia', opens: 190, clicks: 28 }
      ]
    },
    templates: [
      {
        id: '1',
        name: 'Welcome Email',
        usage: 45,
        openRate: 32.5,
        clickRate: 5.2,
        performance: 'high'
      },
      {
        id: '2',
        name: 'Product Update',
        usage: 28,
        openRate: 18.3,
        clickRate: 2.8,
        performance: 'medium'
      }
    ],
    abTests: [
      {
        id: '1',
        name: 'Subject Line Test',
        status: 'running',
        variants: [
          { name: 'Variant A', sent: 500, opens: 125, clicks: 18, conversions: 5 },
          { name: 'Variant B', sent: 500, opens: 145, clicks: 22, conversions: 8 }
        ],
        confidence: 85
      }
    ]
  };

  const analyticsData = data || mockData;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && onRefresh) {
      interval = setInterval(onRefresh, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, onRefresh]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderMetricCard = (title: string, value: string | number, change?: number, icon: React.ReactNode, format?: 'currency' | 'percentage' | 'number') => {
    let formattedValue = value;
    if (format === 'currency' && typeof value === 'number') {
      formattedValue = formatCurrency(value);
    } else if (format === 'percentage' && typeof value === 'number') {
      formattedValue = `${value}%`;
    } else if (format === 'number' && typeof value === 'number') {
      formattedValue = formatNumber(value);
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{formattedValue}</p>
              {change !== undefined && (
                <div className={`flex items-center text-sm ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderChart = (data: number[], labels: string[], color: string = '#3b82f6') => {
    const maxValue = Math.max(...data);
    return (
      <div className="flex items-end justify-between h-32 px-2">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-8 rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
              title={`${labels[index]}: ${value}`}
            />
            <span className="text-xs text-gray-500 mt-2">{labels[index]}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your email campaign performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onExport?.('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderMetricCard(
                  'Total Campaigns',
                  analyticsData.overview.totalCampaigns,
                  12,
                  <BarChart3 className="w-8 h-8" />,
                  'number'
                )}
                {renderMetricCard(
                  'Emails Sent',
                  analyticsData.overview.emailsSent,
                  8,
                  <Mail className="w-8 h-8" />,
                  'number'
                )}
                {renderMetricCard(
                  'Open Rate',
                  analyticsData.overview.openRate,
                  2.3,
                  <Eye className="w-8 h-8" />,
                  'percentage'
                )}
                {renderMetricCard(
                  'Revenue',
                  analyticsData.overview.revenue,
                  15,
                  <DollarSign className="w-8 h-8" />,
                  'currency'
                )}
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderMetricCard(
                  'Click Rate',
                  analyticsData.overview.clickRate,
                  -0.5,
                  <MousePointer className="w-8 h-8" />,
                  'percentage'
                )}
                {renderMetricCard(
                  'Reply Rate',
                  analyticsData.overview.replyRate,
                  0.8,
                  <Reply className="w-8 h-8" />,
                  'percentage'
                )}
                {renderMetricCard(
                  'Unsubscribe Rate',
                  analyticsData.overview.unsubscribeRate,
                  -0.2,
                  <UserMinus className="w-8 h-8" />,
                  'percentage'
                )}
                {renderMetricCard(
                  'ROI',
                  analyticsData.overview.roi,
                  25,
                  <Target className="w-8 h-8" />,
                  'percentage'
                )}
              </div>

              {/* Trends Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Performance Trends</CardTitle>
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opens">Opens</SelectItem>
                        <SelectItem value="clicks">Clicks</SelectItem>
                        <SelectItem value="replies">Replies</SelectItem>
                        <SelectItem value="emailsSent">Emails Sent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderChart(
                    analyticsData.trends[selectedMetric as keyof typeof analyticsData.trends] as number[],
                    analyticsData.trends.labels,
                    selectedMetric === 'opens' ? '#3b82f6' : 
                    selectedMetric === 'clicks' ? '#10b981' :
                    selectedMetric === 'replies' ? '#f59e0b' : '#8b5cf6'
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Campaign Performance</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {analyticsData.campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.recipients)}</p>
                          <p className="text-xs text-gray-600">Recipients</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.sent)}</p>
                          <p className="text-xs text-gray-600">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.opens)}</p>
                          <p className="text-xs text-gray-600">Opens</p>
                          <p className="text-xs text-green-600">
                            {((campaign.opens / campaign.sent) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.clicks)}</p>
                          <p className="text-xs text-gray-600">Clicks</p>
                          <p className="text-xs text-blue-600">
                            {((campaign.clicks / campaign.sent) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.replies)}</p>
                          <p className="text-xs text-gray-600">Replies</p>
                          <p className="text-xs text-purple-600">
                            {((campaign.replies / campaign.sent) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatNumber(campaign.unsubscribes)}</p>
                          <p className="text-xs text-gray-600">Unsubscribes</p>
                          <p className="text-xs text-red-600">
                            {((campaign.unsubscribes / campaign.sent) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatCurrency(campaign.revenue)}</p>
                          <p className="text-xs text-gray-600">Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engagement by Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Engagement by Hour
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChart(
                      analyticsData.engagement.byTime.map(item => item.opens),
                      analyticsData.engagement.byTime.map(item => `${item.hour}:00`),
                      '#3b82f6'
                    )}
                  </CardContent>
                </Card>

                {/* Engagement by Day */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Engagement by Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChart(
                      analyticsData.engagement.byDay.map(item => item.opens),
                      analyticsData.engagement.byDay.map(item => item.day.slice(0, 3)),
                      '#10b981'
                    )}
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Device Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analyticsData.engagement.byDevice.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device.device === 'Desktop' && <Monitor className="w-4 h-4" />}
                          {device.device === 'Mobile' && <Smartphone className="w-4 h-4" />}
                          {device.device === 'Tablet' && <Monitor className="w-4 h-4" />}
                          <span className="font-medium">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={device.percentage} className="w-20" />
                          <span className="text-sm font-medium">{device.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analyticsData.engagement.byLocation.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{location.country}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600">{location.opens} opens</span>
                          <span className="text-green-600">{location.clicks} clicks</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Template Performance</h2>
              </div>

              <div className="grid gap-4">
                {analyticsData.templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-gray-600">Used {template.usage} times</p>
                        </div>
                        <Badge className={getPerformanceColor(template.performance)}>
                          {template.performance} performance
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{template.usage}</p>
                          <p className="text-xs text-gray-600">Usage Count</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{template.openRate}%</p>
                          <p className="text-xs text-gray-600">Open Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{template.clickRate}%</p>
                          <p className="text-xs text-gray-600">Click Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="abtests" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">A/B Test Results</h2>
              </div>

              <div className="grid gap-4">
                {analyticsData.abTests.map((test) => (
                  <Card key={test.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <p className="text-sm text-gray-600">Confidence: {test.confidence}%</p>
                        </div>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {test.variants.map((variant, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">{variant.name}</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Sent</p>
                                <p className="font-semibold">{variant.sent}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Opens</p>
                                <p className="font-semibold">{variant.opens}</p>
                                <p className="text-xs text-blue-600">
                                  {((variant.opens / variant.sent) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Clicks</p>
                                <p className="font-semibold">{variant.clicks}</p>
                                <p className="text-xs text-green-600">
                                  {((variant.clicks / variant.sent) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Conversions</p>
                                <p className="font-semibold">{variant.conversions}</p>
                                <p className="text-xs text-purple-600">
                                  {((variant.conversions / variant.sent) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-6 mt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Activity
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-sm text-gray-600">Emails sent (last hour)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">34</p>
                    <p className="text-sm text-gray-600">Opens (last hour)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <MousePointer className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-sm text-gray-600">Clicks (last hour)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'open', email: 'john@example.com', campaign: 'Welcome Series', time: '2 minutes ago' },
                      { type: 'click', email: 'sarah@example.com', campaign: 'Product Launch', time: '5 minutes ago' },
                      { type: 'reply', email: 'mike@example.com', campaign: 'Follow-up', time: '8 minutes ago' },
                      { type: 'unsubscribe', email: 'jane@example.com', campaign: 'Newsletter', time: '12 minutes ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'open' && <Eye className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'click' && <MousePointer className="w-4 h-4 text-green-500" />}
                          {activity.type === 'reply' && <Reply className="w-4 h-4 text-purple-500" />}
                          {activity.type === 'unsubscribe' && <UserMinus className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.email} {activity.type}ed email from {activity.campaign}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;