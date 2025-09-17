'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Shield,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Globe,
  Mail,
  Settings,
  Trash2,
  Plus,
  Save,
  Download,
  Upload,
  Share,
  Lock,
  Unlock,
  Star,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Wifi,
  WifiOff,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

// Smart Send-Time Optimization Types
interface SendTimeData {
  hour: number;
  day: string;
  openRate: number;
  clickRate: number;
  replyRate: number;
  timezone: string;
}

interface SendTimeOptimization {
  id: string;
  name: string;
  isEnabled: boolean;
  strategy: 'highest_open' | 'highest_click' | 'highest_engagement' | 'custom';
  customRules?: {
    preferredHours: number[];
    excludedDays: string[];
    timezoneHandling: 'recipient' | 'sender' | 'auto';
  };
  performance: {
    improvement: number;
    emailsSent: number;
    avgOpenRate: number;
  };
}

// Spam Analysis Types
interface SpamAnalysis {
  id: string;
  emailId: string;
  subject: string;
  content: string;
  score: number;
  status: 'safe' | 'warning' | 'high_risk';
  issues: SpamIssue[];
  suggestions: string[];
  lastChecked: string;
}

interface SpamIssue {
  type: 'subject' | 'content' | 'links' | 'images' | 'formatting';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}



interface AdvancedFeaturesProps {
  onSave?: (data: any) => void;
  isLoading?: boolean;
}

const AdvancedFeatures: React.FC<AdvancedFeaturesProps> = ({
  onSave,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('send-time');
  
  // Send-Time Optimization State
  const [sendTimeOptimizations, setSendTimeOptimizations] = useState<SendTimeOptimization[]>([
    {
      id: 'opt_1',
      name: 'Global Optimization',
      isEnabled: true,
      strategy: 'highest_engagement',
      performance: {
        improvement: 23.5,
        emailsSent: 15420,
        avgOpenRate: 34.2
      }
    },
    {
      id: 'opt_2',
      name: 'B2B Focused',
      isEnabled: false,
      strategy: 'highest_open',
      customRules: {
        preferredHours: [9, 10, 11, 14, 15, 16],
        excludedDays: ['Saturday', 'Sunday'],
        timezoneHandling: 'recipient'
      },
      performance: {
        improvement: 18.7,
        emailsSent: 8930,
        avgOpenRate: 28.9
      }
    }
  ]);

  const [sendTimeData] = useState<SendTimeData[]>([
    { hour: 9, day: 'Monday', openRate: 32.1, clickRate: 4.2, replyRate: 1.8, timezone: 'EST' },
    { hour: 10, day: 'Monday', openRate: 35.4, clickRate: 5.1, replyRate: 2.1, timezone: 'EST' },
    { hour: 14, day: 'Tuesday', openRate: 28.7, clickRate: 3.9, replyRate: 1.5, timezone: 'EST' },
    { hour: 15, day: 'Wednesday', openRate: 31.2, clickRate: 4.7, replyRate: 2.0, timezone: 'EST' }
  ]);

  // Spam Analysis State
  const [spamAnalyses, setSpamAnalyses] = useState<SpamAnalysis[]>([
    {
      id: 'spam_1',
      emailId: 'email_123',
      subject: 'Limited Time Offer - Act Now!',
      content: 'Get 50% OFF everything! Click here NOW!!!',
      score: 7.2,
      status: 'warning',
      issues: [
        {
          type: 'subject',
          severity: 'medium',
          description: 'Subject contains urgency words',
          suggestion: 'Reduce urgency language like "Act Now"'
        },
        {
          type: 'content',
          severity: 'high',
          description: 'Excessive use of exclamation marks',
          suggestion: 'Limit exclamation marks to 1-2 per email'
        }
      ],
      suggestions: [
        'Replace "Act Now" with "Learn More"',
        'Reduce exclamation marks',
        'Add more descriptive content'
      ],
      lastChecked: '2024-01-15T10:30:00Z'
    },
    {
      id: 'spam_2',
      emailId: 'email_124',
      subject: 'Your Weekly Newsletter',
      content: 'Here are this week\'s updates and insights...',
      score: 2.1,
      status: 'safe',
      issues: [],
      suggestions: [],
      lastChecked: '2024-01-15T11:15:00Z'
    }
  ]);



  // Handlers
  const handleSendTimeToggle = (optimizationId: string) => {
    setSendTimeOptimizations(prev => 
      prev.map(opt => 
        opt.id === optimizationId 
          ? { ...opt, isEnabled: !opt.isEnabled }
          : opt
      )
    );
  };

  const handleSpamRecheck = (analysisId: string) => {
    setSpamAnalyses(prev => 
      prev.map(analysis => 
        analysis.id === analysisId 
          ? { ...analysis, lastChecked: new Date().toISOString() }
          : analysis
      )
    );
  };



  const getSpamStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'high_risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSpamStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'high_risk': return <XCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Advanced Features</h1>
          <p className="text-gray-600 mt-1">Smart optimization, spam analysis, and team collaboration tools</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onSave?.({
            sendTimeOptimizations,
            spamAnalyses
          })} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-6">
            <TabsTrigger value="send-time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Send-Time Optimization
            </TabsTrigger>
            <TabsTrigger value="spam-analysis" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Spam Analysis
            </TabsTrigger>
          </TabsList>

          {/* Send-Time Optimization */}
          <TabsContent value="send-time" className="p-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Improvement</p>
                      <p className="text-2xl font-bold text-green-600">+21.1%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Emails Optimized</p>
                      <p className="text-2xl font-bold">24,350</p>
                    </div>
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Rules</p>
                      <p className="text-2xl font-bold">{sendTimeOptimizations.filter(opt => opt.isEnabled).length}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Rules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Optimization Rules
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendTimeOptimizations.map((optimization) => (
                  <div key={optimization.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={optimization.isEnabled}
                          onCheckedChange={() => handleSendTimeToggle(optimization.id)}
                        />
                        <div>
                          <h4 className="font-medium">{optimization.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            Strategy: {optimization.strategy.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Improvement</p>
                        <p className="font-semibold text-green-600">+{optimization.performance.improvement}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Emails Sent</p>
                        <p className="font-semibold">{optimization.performance.emailsSent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Open Rate</p>
                        <p className="font-semibold">{optimization.performance.avgOpenRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Send Time Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Optimal Send Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sendTimeData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                          {data.day} {data.hour}:00
                        </div>
                        <Badge variant="outline">{data.timezone}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-600">Open</p>
                          <p className="font-semibold">{data.openRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Click</p>
                          <p className="font-semibold">{data.clickRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Reply</p>
                          <p className="font-semibold">{data.replyRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spam Analysis */}
          <TabsContent value="spam-analysis" className="p-6 space-y-6">
            {/* Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Emails Analyzed</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Safe Emails</p>
                      <p className="text-2xl font-bold text-green-600">1,089</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">142</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High Risk</p>
                      <p className="text-2xl font-bold text-red-600">16</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spam Analysis Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Recent Analysis Results
                  </CardTitle>
                  <Button size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {spamAnalyses.map((analysis) => (
                  <div key={analysis.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSpamStatusColor(analysis.status)}>
                            {getSpamStatusIcon(analysis.status)}
                            {analysis.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Score: {analysis.score}/10
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{analysis.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {analysis.content.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          Last checked: {new Date(analysis.lastChecked).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleSpamRecheck(analysis.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {analysis.issues.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Issues Found:</h5>
                        {analysis.issues.map((issue, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Badge variant="outline" className={`text-xs ${
                              issue.severity === 'high' ? 'border-red-300 text-red-600' :
                              issue.severity === 'medium' ? 'border-yellow-300 text-yellow-600' :
                              'border-gray-300 text-gray-600'
                            }`}>
                              {issue.severity}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{issue.description}</p>
                              <p className="text-gray-600">{issue.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium mb-2">Suggestions:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="w-3 h-3 mt-0.5 text-yellow-500" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedFeatures;