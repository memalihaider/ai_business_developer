"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  Users,
  Calendar,
  Clock,
  Target,
  Activity,
  RefreshCw,
  Download,
  Filter
} from "lucide-react";
import { toast } from "sonner";

// Types
interface PostAnalytics {
  id: string;
  postId: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  createdAt: string;
  updatedAt: string;
  post?: {
    id: string;
    content: string;
    status: string;
    scheduledFor?: string;
    publishedAt?: string;
  };
}

interface AnalyticsOverview {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  topPerformingPost: PostAnalytics | null;
  platformBreakdown: Record<string, {
    posts: number;
    views: number;
    engagement: number;
  }>;
  recentActivity: {
    date: string;
    posts: number;
    views: number;
    engagement: number;
  }[];
}

// Platform configurations
const PLATFORMS = {
  facebook: { name: 'Facebook', color: 'bg-blue-500', icon: '📘' },
  twitter: { name: 'Twitter', color: 'bg-sky-500', icon: '🐦' },
  instagram: { name: 'Instagram', color: 'bg-pink-500', icon: '📷' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' }
};

// Metric Card Component
function MetricCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Platform Performance Component
function PlatformPerformance({ data }: { data: AnalyticsOverview['platformBreakdown'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Platform Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([platform, stats]) => {
            const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
            if (!platformInfo) return null;

            return (
              <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{platformInfo.icon}</div>
                  <div>
                    <p className="font-medium">{platformInfo.name}</p>
                    <p className="text-sm text-gray-600">{stats.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stats.views.toLocaleString()} views</p>
                  <p className="text-sm text-gray-600">{stats.engagement.toFixed(1)}% engagement</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Top Posts Component
function TopPosts({ analytics }: { analytics: PostAnalytics[] }) {
  const topPosts = analytics
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Top Performing Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPosts.map((post, index) => {
            const platformInfo = PLATFORMS[post.platform as keyof typeof PLATFORMS];
            
            return (
              <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{platformInfo?.icon}</span>
                    <Badge variant="outline" className="text-xs">
                      {platformInfo?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                    {post.post?.content || 'Post content'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.comments.toLocaleString()}
                    </span>
                    <span className="font-medium text-blue-600">
                      {post.engagementRate.toFixed(1)}% engagement
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
function RecentActivity({ data }: { data: AnalyticsOverview['recentActivity'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 7).map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium">{new Date(activity.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{activity.posts} posts published</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{activity.views.toLocaleString()} views</p>
                <p className="text-sm text-gray-600">{activity.engagement.toFixed(1)}% engagement</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Analytics Dashboard Component
export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedPlatform]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch analytics data
      const params = new URLSearchParams({
        timeRange,
        ...(selectedPlatform !== 'all' && { platform: selectedPlatform })
      });
      
      const response = await fetch(`/api/social-posts/analytics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics || []);
        setOverview(data.overview || null);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/social-posts/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, platform: selectedPlatform })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Analytics data exported successfully!');
      } else {
        toast.error('Failed to export analytics data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">
            Start publishing posts to see analytics and performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Track your social media performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {Object.entries(PLATFORMS).map(([key, platform]) => (
                <SelectItem key={key} value={key}>
                  {platform.icon} {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Posts"
          value={overview.totalPosts}
          icon={Calendar}
          trend="neutral"
        />
        <MetricCard
          title="Total Views"
          value={overview.totalViews.toLocaleString()}
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Total Engagement"
          value={`${(overview.totalLikes + overview.totalComments + overview.totalShares).toLocaleString()}`}
          icon={Heart}
          trend="up"
        />
        <MetricCard
          title="Avg. Engagement Rate"
          value={`${overview.avgEngagementRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={overview.avgEngagementRate > 3 ? 'up' : 'neutral'}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformPerformance data={overview.platformBreakdown} />
        <RecentActivity data={overview.recentActivity} />
      </div>

      {/* Top Posts */}
      <TopPosts analytics={analytics} />
    </div>
  );
}