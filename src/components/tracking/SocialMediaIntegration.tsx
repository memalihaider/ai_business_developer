'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube,
  Settings,
  TrendingUp,
  Share2,
  Users,
  Heart,
  MessageCircle,
  Repeat,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface SocialPlatform {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isConnected: boolean;
  apiKey?: string;
  accessToken?: string;
  lastSync?: string;
  icon: React.ReactNode;
  color: string;
}

interface SocialMetrics {
  platformId: string;
  platformName: string;
  shares: number;
  clicks: number;
  likes: number;
  comments: number;
  reposts: number;
  reach: number;
  impressions: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface SocialContent {
  id: string;
  title: string;
  platform: string;
  shares: number;
  clicks: number;
  engagement: number;
  publishedAt: string;
  url: string;
}

const SocialMediaIntegration: React.FC = () => {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [metrics, setMetrics] = useState<SocialMetrics[]>([]);
  const [topContent, setTopContent] = useState<SocialContent[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize platforms
  useEffect(() => {
    const initialPlatforms: SocialPlatform[] = [
      {
        id: 'facebook',
        name: 'facebook',
        displayName: 'Facebook',
        isActive: true,
        isConnected: true,
        lastSync: '2024-01-15T10:30:00Z',
        icon: <Facebook className="h-5 w-5" />,
        color: '#1877F2'
      },
      {
        id: 'twitter',
        name: 'twitter',
        displayName: 'Twitter/X',
        isActive: true,
        isConnected: false,
        icon: <Twitter className="h-5 w-5" />,
        color: '#1DA1F2'
      },
      {
        id: 'linkedin',
        name: 'linkedin',
        displayName: 'LinkedIn',
        isActive: true,
        isConnected: true,
        lastSync: '2024-01-15T09:15:00Z',
        icon: <Linkedin className="h-5 w-5" />,
        color: '#0A66C2'
      },
      {
        id: 'instagram',
        name: 'instagram',
        displayName: 'Instagram',
        isActive: false,
        isConnected: false,
        icon: <Instagram className="h-5 w-5" />,
        color: '#E4405F'
      },
      {
        id: 'youtube',
        name: 'youtube',
        displayName: 'YouTube',
        isActive: false,
        isConnected: false,
        icon: <Youtube className="h-5 w-5" />,
        color: '#FF0000'
      }
    ];
    
    setPlatforms(initialPlatforms);
    generateMockMetrics(initialPlatforms);
    generateMockContent();
  }, []);

  const generateMockMetrics = (platforms: SocialPlatform[]) => {
    const mockMetrics: SocialMetrics[] = platforms
      .filter(p => p.isActive && p.isConnected)
      .map(platform => ({
        platformId: platform.id,
        platformName: platform.displayName,
        shares: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 500) + 50,
        likes: Math.floor(Math.random() * 2000) + 200,
        comments: Math.floor(Math.random() * 300) + 30,
        reposts: Math.floor(Math.random() * 150) + 15,
        reach: Math.floor(Math.random() * 10000) + 1000,
        impressions: Math.floor(Math.random() * 50000) + 5000,
        engagement: Math.random() * 10 + 2,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        trendValue: Math.floor(Math.random() * 20) + 1
      }));
    
    setMetrics(mockMetrics);
  };

  const generateMockContent = () => {
    const mockContent: SocialContent[] = [
      {
        id: '1',
        title: 'Summer Sale Campaign Launch',
        platform: 'Facebook',
        shares: 245,
        clicks: 1200,
        engagement: 8.5,
        publishedAt: '2024-01-14T14:30:00Z',
        url: 'https://facebook.com/post/1'
      },
      {
        id: '2',
        title: 'Product Feature Announcement',
        platform: 'LinkedIn',
        shares: 180,
        clicks: 890,
        engagement: 7.2,
        publishedAt: '2024-01-14T10:15:00Z',
        url: 'https://linkedin.com/post/2'
      },
      {
        id: '3',
        title: 'Customer Success Story',
        platform: 'Facebook',
        shares: 320,
        clicks: 1500,
        engagement: 9.1,
        publishedAt: '2024-01-13T16:45:00Z',
        url: 'https://facebook.com/post/3'
      },
      {
        id: '4',
        title: 'Industry Insights Report',
        platform: 'LinkedIn',
        shares: 156,
        clicks: 750,
        engagement: 6.8,
        publishedAt: '2024-01-13T11:20:00Z',
        url: 'https://linkedin.com/post/4'
      }
    ];
    
    setTopContent(mockContent);
  };

  const handlePlatformToggle = async (platformId: string, isActive: boolean) => {
    setPlatforms(prev => 
      prev.map(p => 
        p.id === platformId ? { ...p, isActive } : p
      )
    );
  };

  const handleConnect = async (platformId: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPlatforms(prev => 
        prev.map(p => 
          p.id === platformId 
            ? { ...p, isConnected: true, lastSync: new Date().toISOString() }
            : p
        )
      );
      setIsLoading(false);
    }, 2000);
  };

  const handleDisconnect = async (platformId: string) => {
    setPlatforms(prev => 
      prev.map(p => 
        p.id === platformId 
          ? { ...p, isConnected: false, lastSync: undefined }
          : p
      )
    );
  };

  const getStatusIcon = (platform: SocialPlatform) => {
    if (!platform.isActive) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    if (platform.isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (platform: SocialPlatform) => {
    if (!platform.isActive) return 'Inactive';
    if (platform.isConnected) return 'Connected';
    return 'Not Connected';
  };

  const filteredMetrics = selectedPlatform === 'all' 
    ? metrics 
    : metrics.filter(m => m.platformId === selectedPlatform);

  const totalMetrics = metrics.reduce((acc, metric) => ({
    shares: acc.shares + metric.shares,
    clicks: acc.clicks + metric.clicks,
    likes: acc.likes + metric.likes,
    comments: acc.comments + metric.comments,
    reposts: acc.reposts + metric.reposts,
    reach: acc.reach + metric.reach,
    impressions: acc.impressions + metric.impressions,
    engagement: acc.engagement + metric.engagement
  }), {
    shares: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    reposts: 0,
    reach: 0,
    impressions: 0,
    engagement: 0
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Share2 className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Social Media Integration</h2>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>

      {/* Platform Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map(platform => (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{platform.displayName}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {getStatusIcon(platform)}
                        <span>{getStatusText(platform)}</span>
                        {platform.lastSync && (
                          <span>• Last sync: {new Date(platform.lastSync).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${platform.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${platform.id}`}
                        checked={platform.isActive}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked)}
                      />
                    </div>
                    
                    {platform.isActive && (
                      platform.isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform.id)}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isLoading}
                        >
                          Connect
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Filter */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="platform-filter">Filter by Platform:</Label>
        <select
          id="platform-filter"
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Platforms</option>
          {platforms
            .filter(p => p.isActive && p.isConnected)
            .map(platform => (
              <option key={platform.id} value={platform.id}>
                {platform.displayName}
              </option>
            ))
          }
        </select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="content">Top Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Shares</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalMetrics.shares.toLocaleString()}
                    </p>
                  </div>
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Social Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalMetrics.clicks.toLocaleString()}
                    </p>
                  </div>
                  <ExternalLink className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reach</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalMetrics.reach.toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(totalMetrics.engagement / metrics.length || 0).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMetrics.map(metric => {
                  const platform = platforms.find(p => p.id === metric.platformId);
                  return (
                    <div key={metric.platformId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: platform?.color }}
                        >
                          {platform?.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{metric.platformName}</div>
                          <div className="text-sm text-gray-500">
                            {metric.shares} shares • {metric.clicks} clicks • {metric.engagement.toFixed(1)}% engagement
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {metric.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                        <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}>
                          {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.trendValue}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platformName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="engagement" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Shares vs Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platformName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="shares" fill="#3B82F6" name="Shares" />
                      <Bar dataKey="clicks" fill="#10B981" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topContent.map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{content.title}</div>
                        <div className="text-sm text-gray-500">
                          {content.platform} • Published {new Date(content.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="text-center">
                        <div className="font-medium">{content.shares}</div>
                        <div>Shares</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{content.clicks}</div>
                        <div>Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{content.engagement}%</div>
                        <div>Engagement</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={content.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaIntegration;