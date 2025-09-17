'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MousePointer, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Users,
  BarChart3
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface MetricsCardsProps {
  metrics: {
    totalOpens: number;
    uniqueOpens: number;
    totalClicks: number;
    uniqueClicks: number;
    socialShares: number;
    socialClicks: number;
    openRate: number;
    clickRate: number;
    socialEngagement: number;
  };
  previousMetrics?: {
    totalOpens: number;
    uniqueOpens: number;
    totalClicks: number;
    uniqueClicks: number;
    socialShares: number;
    socialClicks: number;
    openRate: number;
    clickRate: number;
    socialEngagement: number;
  };
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg border-l-4 ${colorClasses[color]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]} ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
          {change && (
            <div className="flex items-center space-x-1">
              {change.type === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge 
                variant={change.type === 'increase' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {change.type === 'increase' ? '+' : ''}{change.value}%
              </Badge>
            </div>
          )}
        </div>
        {change && (
          <p className="text-xs text-gray-500 mt-2">
            vs {change.period}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  metrics, 
  previousMetrics, 
  loading = false 
}) => {
  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      type: change >= 0 ? 'increase' as const : 'decrease' as const,
      period: 'previous period'
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: 'Total Opens',
      value: metrics.totalOpens,
      change: previousMetrics ? calculateChange(metrics.totalOpens, previousMetrics.totalOpens) : null,
      icon: <Eye className="h-4 w-4" />,
      description: 'All email opens',
      color: 'blue' as const
    },
    {
      title: 'Unique Opens',
      value: metrics.uniqueOpens,
      change: previousMetrics ? calculateChange(metrics.uniqueOpens, previousMetrics.uniqueOpens) : null,
      icon: <Users className="h-4 w-4" />,
      description: 'Unique recipients',
      color: 'green' as const
    },
    {
      title: 'Total Clicks',
      value: metrics.totalClicks,
      change: previousMetrics ? calculateChange(metrics.totalClicks, previousMetrics.totalClicks) : null,
      icon: <MousePointer className="h-4 w-4" />,
      description: 'All link clicks',
      color: 'purple' as const
    },
    {
      title: 'Unique Clicks',
      value: metrics.uniqueClicks,
      change: previousMetrics ? calculateChange(metrics.uniqueClicks, previousMetrics.uniqueClicks) : null,
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Unique clickers',
      color: 'orange' as const
    },
    {
      title: 'Open Rate',
      value: `${metrics.openRate.toFixed(1)}%`,
      change: previousMetrics ? calculateChange(metrics.openRate, previousMetrics.openRate) : null,
      icon: <Mail className="h-4 w-4" />,
      description: 'Opens per send',
      color: 'blue' as const
    },
    {
      title: 'Click Rate',
      value: `${metrics.clickRate.toFixed(1)}%`,
      change: previousMetrics ? calculateChange(metrics.clickRate, previousMetrics.clickRate) : null,
      icon: <MousePointer className="h-4 w-4" />,
      description: 'Clicks per send',
      color: 'green' as const
    },
    {
      title: 'Social Shares',
      value: metrics.socialShares,
      change: previousMetrics ? calculateChange(metrics.socialShares, previousMetrics.socialShares) : null,
      icon: <Share2 className="h-4 w-4" />,
      description: 'Content shares',
      color: 'purple' as const
    },
    {
      title: 'Social Engagement',
      value: `${metrics.socialEngagement.toFixed(1)}%`,
      change: previousMetrics ? calculateChange(metrics.socialEngagement, previousMetrics.socialEngagement) : null,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Social interaction rate',
      color: 'orange' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          description={metric.description}
          color={metric.color}
        />
      ))}
    </div>
  );
};

export default MetricsCards;
export { MetricCard };