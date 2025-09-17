"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Radar, TrendingUp, AlertCircle } from "lucide-react";

interface Opportunity {
  id: number;
  title: string;
  industry: string;
  value: string;
  priority?: string;
  confidence?: number;
}

interface Props {
  opportunities: Opportunity[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function OpportunityRadar({ opportunities }: Props) {
  const topOpportunities = opportunities.slice(0, 3);
  
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Radar className="w-5 h-5 text-blue-500" />
          Opportunity Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Radar className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-600">Radar scanning for opportunities...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topOpportunities.map((opp, index) => (
              <div
                key={opp.id}
                className="relative p-4 rounded-xl bg-gradient-to-r from-white to-slate-50 border border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">#{index + 1}</span>
                      <h4 className="font-semibold text-slate-800 text-sm">{opp.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      {opp.industry} • {opp.value}
                    </p>
                  </div>
                  {opp.priority && (
                    <Badge className={`text-xs ${getPriorityColor(opp.priority)}`}>
                      {opp.priority}
                    </Badge>
                  )}
                </div>
                
                {opp.confidence && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Confidence Score</span>
                      <span className="text-xs font-medium text-slate-700">{opp.confidence}%</span>
                    </div>
                    <Progress value={opp.confidence} className="h-1.5" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            ))}
            
            {opportunities.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  +{opportunities.length - 3} more opportunities detected
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
