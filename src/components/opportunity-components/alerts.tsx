"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, TrendingUp, Clock, ExternalLink } from "lucide-react";

interface Alert {
  id: number;
  message: string;
  type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  source?: string;
  actionable?: boolean;
}

interface Props {
  alerts: Alert[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      };
    case 'high':
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        iconColor: 'text-orange-500'
      };
    case 'medium':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Bell,
        iconColor: 'text-yellow-500'
      };
    default:
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Bell,
        iconColor: 'text-blue-500'
      };
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};

export default function OpportunityAlerts({ alerts, onRefresh, isLoading }: Props) {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Industry Alerts
            {alerts.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-slate-600 hover:text-slate-800"
            >
              <TrendingUp className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-slate-600 mb-2">No alerts at the moment</p>
            <p className="text-xs text-slate-500">AI monitoring for industry opportunities...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => {
              const severityConfig = getSeverityConfig(alert.severity || 'low');
              const IconComponent = severityConfig.icon;
              
              return (
                <div
                  key={alert.id}
                  className="relative p-4 rounded-xl bg-gradient-to-r from-white to-slate-50 border border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${severityConfig.color.includes('red') ? 'from-red-50 to-red-100' : severityConfig.color.includes('orange') ? 'from-orange-50 to-orange-100' : severityConfig.color.includes('yellow') ? 'from-yellow-50 to-yellow-100' : 'from-blue-50 to-blue-100'}`}>
                      <IconComponent className={`w-4 h-4 ${severityConfig.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-slate-800 font-medium leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.severity && (
                          <Badge className={`text-xs ml-2 ${severityConfig.color}`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp ? formatTimestamp(alert.timestamp) : 'Recent'}
                          </span>
                          {alert.source && (
                            <span>• {alert.source}</span>
                          )}
                        </div>
                        
                        {alert.actionable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
