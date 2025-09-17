'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Share2,
  Clock,
  Globe
} from 'lucide-react';

interface RealTimeData {
  timestamp: string;
  opens: number;
  clicks: number;
  socialShares: number;
}

interface DeviceData {
  name: string;
  value: number;
  color: string;
}

interface LocationData {
  country: string;
  opens: number;
  clicks: number;
  percentage: number;
}

interface RealTimeDashboardProps {
  campaignId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ 
  campaignId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(autoRefresh);

  // Mock data for demonstration
  const generateMockRealTimeData = (): RealTimeData[] => {
    const data: RealTimeData[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        opens: Math.floor(Math.random() * 100) + 20,
        clicks: Math.floor(Math.random() * 50) + 5,
        socialShares: Math.floor(Math.random() * 20) + 1
      });
    }
    
    return data;
  };

  const generateMockDeviceData = (): DeviceData[] => [
    { name: 'Desktop', value: 45, color: '#3B82F6' },
    { name: 'Mobile', value: 35, color: '#10B981' },
    { name: 'Tablet', value: 20, color: '#8B5CF6' }
  ];

  const generateMockLocationData = (): LocationData[] => [
    { country: 'United States', opens: 1250, clicks: 340, percentage: 35.2 },
    { country: 'United Kingdom', opens: 890, clicks: 245, percentage: 25.1 },
    { country: 'Canada', opens: 650, clicks: 180, percentage: 18.3 },
    { country: 'Australia', opens: 420, clicks: 115, percentage: 11.8 },
    { country: 'Germany', opens: 340, clicks: 95, percentage: 9.6 }
  ];

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // const response = await fetch(`/api/tracking/realtime${campaignId ? `?campaignId=${campaignId}` : ''}`);
      // const data = await response.json();
      
      // For now, using mock data
      setRealTimeData(generateMockRealTimeData());
      setDeviceData(generateMockDeviceData());
      setLocationData(generateMockLocationData());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
  }, [campaignId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive && autoRefresh) {
      interval = setInterval(fetchRealTimeData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, autoRefresh, refreshInterval]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Dashboard</h2>
          <Badge variant={isLive ? 'default' : 'secondary'} className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Updated {formatLastUpdated()}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={isLive ? 'border-green-500 text-green-600' : ''}
          >
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealTimeData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-Time Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Activity Over Time (Last 24 Hours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value as string)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="opens" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Opens"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Clicks"
                />
                <Area 
                  type="monotone" 
                  dataKey="socialShares" 
                  stackId="1" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6}
                  name="Social Shares"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Device Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Usage']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <span>Top Locations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.map((location, index) => (
                <div key={location.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{location.country}</div>
                      <div className="text-sm text-gray-500">
                        {location.opens.toLocaleString()} opens • {location.clicks.toLocaleString()} clicks
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{location.percentage}%</div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-purple-500 rounded-full" 
                        style={{ width: `${location.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5 text-orange-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent activity items */}
            {[
              { type: 'open', user: 'john.doe@example.com', campaign: 'Summer Sale 2024', time: '2 minutes ago' },
              { type: 'click', user: 'jane.smith@example.com', campaign: 'Product Launch', time: '5 minutes ago' },
              { type: 'share', user: 'mike.johnson@example.com', campaign: 'Newsletter #45', time: '8 minutes ago' },
              { type: 'open', user: 'sarah.wilson@example.com', campaign: 'Welcome Series', time: '12 minutes ago' },
              { type: 'click', user: 'david.brown@example.com', campaign: 'Summer Sale 2024', time: '15 minutes ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'open' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'click' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {activity.type === 'open' && <Users className="h-4 w-4" />}
                  {activity.type === 'click' && <MousePointer className="h-4 w-4" />}
                  {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.user} {activity.type === 'open' ? 'opened' : activity.type === 'click' ? 'clicked' : 'shared'} 
                    <span className="text-blue-600 ml-1">{activity.campaign}</span>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDashboard;