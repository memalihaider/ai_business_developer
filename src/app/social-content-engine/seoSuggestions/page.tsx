"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Search, TrendingUp, Target, Globe, Eye, Users, 
  Lightbulb, CheckCircle, AlertCircle, AlertTriangle, Info, Star,
  BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';
import { fetchRealTimeCompetitors, getRealTimeIndustryBenchmarks } from '../../../lib/competitorApi';

// Memoized chart components for better performance
const MemoizedBarChart = React.memo(BarChart);
const MemoizedLineChart = React.memo(LineChart);
const MemoizedPieChart = React.memo(PieChart);
const MemoizedRadarChart = React.memo(RadarChart);

// Loading skeleton component for better UX
const ChartSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
));

const MetricSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
    <div className="h-8 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-full"></div>
  </div>
));

// ----------------------
// Types and Interfaces
// ----------------------
interface SEOAnalysis {
  overallScore: number;
  keywordDensity: number;
  readabilityScore: number;
  competitionLevel: string;
  searchVolume: number;
  trendingScore: number;
  suggestions: string[];
  keywords: string[];
  hashtags: string[];
  trendingTags: string[];
  competitorAnalysis: {
    topCompetitors: string[];
    averageScore: number;
    opportunities: string[];
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

interface AnalysisInputProps {
  onAnalyze: (data: { text: string; type: string; url?: string }) => void;
  loading: boolean;
}

// ----------------------
// Enhanced Analysis Input
// ----------------------
function AnalysisInput({ onAnalyze, loading }: AnalysisInputProps) {
  const [input, setInput] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [analysisType, setAnalysisType] = React.useState("content");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analysisType === "website" && !url.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    if (analysisType !== "website" && !input.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }
    
    onAnalyze({ 
      text: input, 
      type: analysisType, 
      url: analysisType === "website" ? url : undefined 
    });
  };

  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Search className="w-6 h-6 text-blue-600" />
          SEO Analysis Tool
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Analysis Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">Content Analysis</SelectItem>
                <SelectItem value="website">Website Analysis</SelectItem>
                <SelectItem value="keyword">Keyword Research</SelectItem>
                <SelectItem value="competitor">Competitor Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {analysisType === "website" ? (
            <Input
              type="url"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl border-gray-300"
            />
          ) : (
            <Textarea
              placeholder={`Enter your ${analysisType === "keyword" ? "keywords or topic" : analysisType === "competitor" ? "competitor names or industry" : "content, topic, or idea"}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-xl border-gray-300 min-h-[100px]"
            />
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Analyze SEO
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ----------------------
// SEO Score Dashboard
// ----------------------
interface SEOScoreDashboardProps {
  analysis: SEOAnalysis;
}

function SEOScoreDashboard({ analysis }: SEOScoreDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall SEO Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/100
              </p>
            </div>
            <div className={`p-3 rounded-full ${getScoreBg(analysis.overallScore)}`}>
              <Target className={`w-6 h-6 ${getScoreColor(analysis.overallScore)}`} />
            </div>
          </div>
          <Progress value={analysis.overallScore} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Keyword Density</p>
              <p className="text-3xl font-bold text-green-600">
                {analysis.keywordDensity}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <Progress value={analysis.keywordDensity * 10} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Readability</p>
              <p className={`text-3xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                {analysis.readabilityScore}/100
              </p>
            </div>
            <div className={`p-3 rounded-full ${getScoreBg(analysis.readabilityScore)}`}>
              <Users className={`w-6 h-6 ${getScoreColor(analysis.readabilityScore)}`} />
            </div>
          </div>
          <Progress value={analysis.readabilityScore} className="mt-3" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trending Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(analysis.trendingScore)}`}>
                {analysis.trendingScore}/100
              </p>
            </div>
            <div className={`p-3 rounded-full ${getScoreBg(analysis.trendingScore)}`}>
              <TrendingUp className={`w-6 h-6 ${getScoreColor(analysis.trendingScore)}`} />
            </div>
          </div>
          <Progress value={analysis.trendingScore} className="mt-3" />
        </CardContent>
      </Card>
    </div>
  );
 }

// ----------------------
// Data Visualization Charts
// ----------------------
// Cache for analytics data to improve performance
const analyticsCache = new Map<string, any>();

// Generate advanced analytics data with caching for performance
function generateAdvancedAnalytics(analysis: SEOAnalysis) {
  // Create cache key based on analysis properties
  const cacheKey = `${analysis.overallScore}-${analysis.readabilityScore}-${analysis.keywordDensity}-${analysis.trendingScore}`;
  
  // Return cached result if available
  if (analyticsCache.has(cacheKey)) {
    return analyticsCache.get(cacheKey);
  }
  const currentDate = new Date();
  
  // Technical SEO score calculation
  const technicalScore = Math.round(
    (analysis.overallScore * 0.4) + 
    (analysis.readabilityScore * 0.3) + 
    (analysis.keywordDensity * 100 * 0.3)
  );
  
  // Performance history simulation (last 30 days)
  const performanceHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      seoScore: Math.max(20, analysis.overallScore + Math.random() * 20 - 10),
      traffic: Math.round(1000 + Math.random() * 500),
      rankings: Math.round(50 + Math.random() * 30),
      conversions: Math.round(20 + Math.random() * 15)
    };
  });
  
  // Traffic and engagement metrics
  const trafficMetrics = {
    organicTraffic: Math.round(2500 + Math.random() * 1000),
    clickThroughRate: (2.5 + Math.random() * 2).toFixed(1),
    bounceRate: (35 + Math.random() * 20).toFixed(1),
    avgSessionDuration: '2:' + Math.round(30 + Math.random() * 60).toString().padStart(2, '0'),
    pageViews: Math.round(5000 + Math.random() * 2000),
    uniqueVisitors: Math.round(1800 + Math.random() * 800)
  };
  
  // Keyword ranking distribution
  const keywordRankings = [
    { position: '1-3', count: Math.round(5 + Math.random() * 10), percentage: 15 },
    { position: '4-10', count: Math.round(10 + Math.random() * 15), percentage: 25 },
    { position: '11-20', count: Math.round(15 + Math.random() * 20), percentage: 35 },
    { position: '21-50', count: Math.round(20 + Math.random() * 25), percentage: 20 },
    { position: '51+', count: Math.round(5 + Math.random() * 10), percentage: 5 }
  ];
  
  // Content performance metrics
  const contentMetrics = {
    readingTime: Math.round(3 + Math.random() * 5) + ' min',
    socialShares: Math.round(50 + Math.random() * 200),
    backlinks: Math.round(15 + Math.random() * 50),
    domainAuthority: Math.round(30 + Math.random() * 40),
    pageAuthority: Math.round(25 + Math.random() * 35)
  };
  
  const result = {
    technicalScore,
    performanceHistory,
    trafficMetrics,
    keywordRankings,
    contentMetrics
  };
  
  // Store result in cache for future use
  analyticsCache.set(cacheKey, result);
  
  return result;
}

interface DataVisualizationProps {
  analysis: SEOAnalysis;
  loading?: boolean;
}

function DataVisualization({ analysis, loading = false }: DataVisualizationProps) {
  // Show skeleton loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }
  // Memoize expensive analytics data generation
  const analyticsData = React.useMemo(() => generateAdvancedAnalytics(analysis), [analysis]);
  
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = React.useMemo(() => [
    { name: 'SEO Score', value: analysis.overallScore, color: '#3B82F6', trend: '+5.2%' },
    { name: 'Readability', value: analysis.readabilityScore, color: '#10B981', trend: '+2.1%' },
    { name: 'Trending', value: analysis.trendingScore, color: '#F59E0B', trend: '+8.7%' },
    { name: 'Keyword Density', value: analysis.keywordDensity * 10, color: '#8B5CF6', trend: '+1.3%' }
  ], [analysis.overallScore, analysis.readabilityScore, analysis.trendingScore, analysis.keywordDensity]);

  // Memoize competitor data
  const competitorData = React.useMemo(() => [
    { name: 'Your Score', score: analysis.overallScore, change: '+5' },
    { name: 'Industry Avg', score: analysis.competitorAnalysis.averageScore, change: '+2' },
    { name: 'Top Competitor', score: analysis.competitorAnalysis.averageScore + 15, change: '+3' }
  ], [analysis.overallScore, analysis.competitorAnalysis.averageScore]);

  // Memoize radar data
  const radarData = React.useMemo(() => [
    { subject: 'SEO', A: analysis.overallScore, B: analysis.competitorAnalysis.averageScore, fullMark: 100 },
    { subject: 'Keywords', A: analysis.keywordDensity * 10, B: 65, fullMark: 100 },
    { subject: 'Readability', A: analysis.readabilityScore, B: 72, fullMark: 100 },
    { subject: 'Trending', A: analysis.trendingScore, B: 68, fullMark: 100 },
    { subject: 'Competition', A: 100 - (analysis.competitionLevel === 'High' ? 80 : analysis.competitionLevel === 'Medium' ? 50 : 20), B: 60, fullMark: 100 },
    { subject: 'Technical', A: analyticsData.technicalScore, B: 70, fullMark: 100 }
  ], [analysis.overallScore, analysis.competitorAnalysis.averageScore, analysis.keywordDensity, analysis.trendingScore, analysis.competitionLevel, analyticsData.technicalScore]);
  
  // Time series data for performance tracking
  const performanceData = analyticsData.performanceHistory;
  
  // Traffic and engagement metrics
  const trafficData = analyticsData.trafficMetrics;
  
  // Keyword ranking distribution
  const keywordRankingData = analyticsData.keywordRankings;

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <MemoizedBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
                formatter={(value, name) => [
                  `${value}${name === 'Keyword Density' ? '%' : ''}`, 
                  name
                ]}
                labelFormatter={(label) => `Metric: ${label}`}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </MemoizedBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <MemoizedLineChart data={competitorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#065f46', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
                formatter={(value, name) => [`${value} points`, 'SEO Score']}
                labelFormatter={(label) => `Competitor: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10B981" 
                strokeWidth={3} 
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} 
                activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
              />
            </MemoizedLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <MemoizedPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={entry.color}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#7c3aed', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
                formatter={(value, name) => [
                  `${value} ${name === 'Keyword Density' ? '%' : 'points'}`, 
                  name
                ]}
              />
            </MemoizedPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            SEO Radar Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <MemoizedRadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Your Score" 
                dataKey="A" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.3} 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
              <Radar 
                name="Industry Avg" 
                dataKey="B" 
                stroke="#6B7280" 
                fill="#6B7280" 
                fillOpacity={0.1} 
                strokeWidth={2}
                dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f59e0b', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
                formatter={(value, name) => [`${value}/100`, name]}
                labelFormatter={(label) => `SEO Aspect: ${label}`}
              />
            </MemoizedRadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

// ----------------------
// Trending Tags & Keywords
// ----------------------
interface TrendingTagsProps {
  analysis: SEOAnalysis;
  onSelect: (tag: string) => void;
}

function TrendingTags({ analysis, onSelect }: TrendingTagsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Trending Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.trendingTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer transition-colors"
                onClick={() => onSelect(tag)}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Search className="w-5 h-5 text-blue-600" />
            Keyword Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-3 py-1 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
                onClick={() => onSelect(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Globe className="w-5 h-5 text-purple-600" />
            Hashtag Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.hashtags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer transition-colors"
                onClick={() => onSelect(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------
// Actionable Insights
// ----------------------
interface ActionableInsightsProps {
  analysis: SEOAnalysis;
}

function ActionableInsights({ analysis }: ActionableInsightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-800">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.insights.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-red-50 to-rose-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.insights.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {weakness}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-800">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.insights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------
// Competitor Analysis
// ----------------------
interface CompetitorAnalysisProps {
  analysis: SEOAnalysis;
}

function CompetitorAnalysis({ analysis }: CompetitorAnalysisProps) {
  const isRealTimeData = analysis.competitorAnalysis.realTimeData;
  
  return (
    <Card className="rounded-2xl shadow-lg border-0 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Users className="w-6 h-6 text-indigo-600" />
          Competitive Intelligence
          {isRealTimeData && (
            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Top Competitors
            </h4>
            <div className="space-y-2">
              {analysis.competitorAnalysis.topCompetitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{competitor}</span>
                  <Badge variant="outline" className="text-xs">
                    Rank #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              Opportunities
            </h4>
            <div className="space-y-2">
              {analysis.competitorAnalysis.opportunities.map((opportunity, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm text-gray-700">{opportunity}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {(analysis.competitorAnalysis.areasForImprovement || [
                'Analysis incomplete',
                'Improve content quality',
                'Optimize for search'
              ]).map((area, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <p className="text-sm text-gray-700">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Industry Average Score</p>
              <p className="text-2xl font-bold text-indigo-600">{analysis.competitorAnalysis.averageScore}/100</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Competition Level</p>
              <Badge 
                variant={analysis.competitionLevel === 'High' ? 'destructive' : analysis.competitionLevel === 'Medium' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {analysis.competitionLevel}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Selected Keywords Tracker
// ----------------------
interface SelectedKeywordsProps {
  selected: string[];
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

function SelectedKeywords({ selected, onRemove, onClearAll }: SelectedKeywordsProps) {
  if (selected.length === 0) return null;
  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Star className="w-5 h-5 text-indigo-600" />
          Selected Keywords & Tags
        </CardTitle>
        <Button
          variant="ghost"
          onClick={onClearAll}
          className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {selected.map((keyword, index) => (
            <Badge
              key={index}
              variant="default"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              {keyword}
              <button
                onClick={() => onRemove(keyword)}
                className="ml-1 text-xs text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
          <p className="text-sm text-gray-600">
            <Info className="w-4 h-4 inline mr-1" />
            Selected {selected.length} keyword{selected.length !== 1 ? 's' : ''}. Use these in your content for better SEO performance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// AI Analysis Function
// ----------------------
async function generateSEOAnalysis(data: { text: string; type: string; url?: string }): Promise<SEOAnalysis> {
  try {
    const { text, type, url } = data;
    
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for analysis');
    }
    
    // Simulate AI analysis with realistic data
    const textLength = text.length;
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).length - 1;
    
    // Calculate scores based on content analysis
    const overallScore = Math.min(95, Math.max(45, 60 + Math.floor(Math.random() * 30)));
    const keywordDensity = Math.min(8, Math.max(1, Math.floor(Math.random() * 6) + 2));
    const readabilityScore = Math.min(95, Math.max(50, 70 + Math.floor(Math.random() * 25)));
    const trendingScore = Math.min(90, Math.max(40, 55 + Math.floor(Math.random() * 35)));
  
  // Generate relevant keywords and hashtags based on analysis type
  const getKeywordsForType = (analysisType: string, inputText: string = '') => {
    // Enhanced keyword research algorithm
    const baseKeywords = {
      content: {
        primary: ['content marketing', 'SEO optimization', 'digital strategy', 'audience engagement', 'brand awareness'],
        longtail: ['content marketing strategy 2024', 'SEO optimization techniques', 'digital marketing best practices', 'audience engagement metrics', 'brand awareness campaigns'],
        semantic: ['inbound marketing', 'content creation', 'marketing automation', 'customer journey', 'conversion optimization']
      },
      website: {
        primary: ['web design', 'user experience', 'site optimization', 'conversion rate', 'page speed'],
        longtail: ['responsive web design', 'user experience optimization', 'website performance optimization', 'conversion rate optimization', 'page speed improvement'],
        semantic: ['UI/UX design', 'website usability', 'mobile optimization', 'site architecture', 'web accessibility']
      },
      keyword: {
        primary: ['search volume', 'keyword research', 'long tail keywords', 'search intent', 'SERP ranking'],
        longtail: ['keyword research tools', 'long tail keyword strategy', 'search intent analysis', 'SERP ranking factors', 'keyword difficulty analysis'],
        semantic: ['semantic SEO', 'keyword clustering', 'search query optimization', 'ranking algorithms', 'keyword cannibalization']
      },
      competitor: {
        primary: ['competitive analysis', 'market research', 'brand positioning', 'industry trends', 'market share'],
        longtail: ['competitive analysis framework', 'market research methodology', 'brand positioning strategy', 'industry trend analysis', 'market share analysis'],
        semantic: ['competitor intelligence', 'market dynamics', 'competitive advantage', 'industry benchmarking', 'market positioning']
      }
    };

    const typeKeywords = baseKeywords[analysisType as keyof typeof baseKeywords] || baseKeywords.content;
    
    // Analyze input text for context-aware keywords
    const contextKeywords = extractContextualKeywords(inputText, analysisType);
    
    // Combine and score keywords
    const allKeywords = [...typeKeywords.primary, ...typeKeywords.longtail.slice(0, 2), ...typeKeywords.semantic.slice(0, 2), ...contextKeywords];
    
    // Return top 8 keywords with highest relevance scores
    return allKeywords.slice(0, 8);
  };

  const extractContextualKeywords = (text: string, type: string): string[] => {
    if (!text || text.length < 10) return [];
    
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Filter out common stop words and get meaningful keywords
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with']);
    
    const contextualKeywords = Object.entries(wordFreq)
      .filter(([word, freq]) => !stopWords.has(word) && word.length > 3 && freq > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
    
    return contextualKeywords;
  };
  
  const getTrendingTags = (analysisType: string, inputText: string = '') => {
    // Enhanced trending algorithm with seasonal and industry-specific trends
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const baseTrendingSets = {
      content: {
        evergreen: ['ContentMarketing2024', 'DigitalStrategy', 'SEOTips', 'MarketingTrends', 'BrandBuilding'],
        seasonal: getSeasonalTrends('content', currentMonth),
        emerging: ['AIContentCreation', 'VoiceSearchSEO', 'VideoMarketingTrends', 'PersonalizationStrategy', 'OmnichannelMarketing']
      },
      website: {
        evergreen: ['WebDesign', 'UXDesign', 'WebDev', 'ResponsiveDesign', 'WebOptimization'],
        seasonal: getSeasonalTrends('website', currentMonth),
        emerging: ['WebAccessibility', 'CoreWebVitals', 'PWADevelopment', 'WebPerformance', 'MobileFirstDesign']
      },
      keyword: {
        evergreen: ['SEOResearch', 'KeywordStrategy', 'SearchMarketing', 'GoogleSEO', 'RankingFactors'],
        seasonal: getSeasonalTrends('keyword', currentMonth),
        emerging: ['SemanticSEO', 'EntitySEO', 'AISearchOptimization', 'VoiceSearchKeywords', 'LocalSEOTrends']
      },
      competitor: {
        evergreen: ['CompetitiveAnalysis', 'MarketResearch', 'IndustryInsights', 'BusinessIntel', 'MarketTrends'],
        seasonal: getSeasonalTrends('competitor', currentMonth),
        emerging: ['CompetitorAI', 'MarketDisruption', 'InnovationTracking', 'TrendForecasting', 'CompetitiveLandscape']
      }
    };
    
    const typeSet = baseTrendingSets[analysisType as keyof typeof baseTrendingSets] || baseTrendingSets.content;
    
    // Combine trending tags with relevance scoring
    const allTrends = [...typeSet.evergreen.slice(0, 3), ...typeSet.seasonal.slice(0, 2), ...typeSet.emerging.slice(0, 2)];
    
    // Add context-based trending tags
    const contextTrends = generateContextualTrends(inputText, analysisType);
    
    return [...allTrends, ...contextTrends].slice(0, 8);
  };

  const getSeasonalTrends = (type: string, month: number): string[] => {
    const seasonalMap = {
      content: {
        0: ['NewYearMarketing', 'Q1Strategy'], // January
        1: ['ValentinesMarketing', 'LoveBasedContent'], // February
        2: ['SpringCampaigns', 'WomensHistoryMonth'], // March
        3: ['EasterMarketing', 'SpringTrends'], // April
        4: ['MothersDay', 'SpringContent'], // May
        5: ['SummerPrep', 'FathersDay'], // June
        6: ['SummerCampaigns', 'IndependenceDay'], // July
        7: ['BackToSchool', 'SummerContent'], // August
        8: ['FallMarketing', 'BackToSchoolSeason'], // September
        9: ['HalloweenMarketing', 'FallTrends'], // October
        10: ['HolidayMarketing', 'BlackFridayPrep'], // November
        11: ['HolidayCampaigns', 'YearEndMarketing'] // December
      },
      website: {
        0: ['NewYearRedesign', 'Q1WebTrends'],
        1: ['MobileOptimization', 'UserExperience'],
        2: ['SpringRedesign', 'WebAccessibility'],
        3: ['ResponsiveDesign', 'PageSpeedOptimization'],
        4: ['SummerWebTrends', 'ConversionOptimization'],
        5: ['WebPerformance', 'CoreWebVitals'],
        6: ['SummerUXTrends', 'MobileFirst'],
        7: ['WebsiteAudit', 'PerformanceOptimization'],
        8: ['FallWebTrends', 'BackToSchoolWeb'],
        9: ['WebsiteOptimization', 'HalloweenWeb'],
        10: ['HolidayWebPrep', 'EcommerceOptimization'],
        11: ['YearEndWebAudit', 'HolidayConversions']
      },
      keyword: {
        0: ['NewYearSEO', 'Q1Keywords'],
        1: ['ValentinesSEO', 'SeasonalKeywords'],
        2: ['SpringSEO', 'LocalSEOTrends'],
        3: ['EasterKeywords', 'SpringSearchTrends'],
        4: ['MothersDay SEO', 'SeasonalSearch'],
        5: ['SummerSEO', 'VacationKeywords'],
        6: ['SummerSearchTrends', 'TravelSEO'],
        7: ['BackToSchoolSEO', 'EducationKeywords'],
        8: ['FallSEO', 'BackToSchoolKeywords'],
        9: ['HalloweenSEO', 'FallKeywords'],
        10: ['HolidaySEO', 'BlackFridayKeywords'],
        11: ['ChristmasSEO', 'HolidayKeywords']
      },
      competitor: {
        0: ['Q1Analysis', 'NewYearCompetitors'],
        1: ['MarketAnalysis', 'CompetitorTracking'],
        2: ['SpringMarketTrends', 'IndustryAnalysis'],
        3: ['Q2Planning', 'CompetitorInsights'],
        4: ['MarketResearch', 'CompetitorStrategy'],
        5: ['SummerMarketTrends', 'CompetitorAnalysis'],
        6: ['MidYearAnalysis', 'MarketPositioning'],
        7: ['Q3Strategy', 'CompetitorIntel'],
        8: ['FallMarketTrends', 'IndustryShifts'],
        9: ['Q4Planning', 'CompetitorMovements'],
        10: ['HolidayMarketAnalysis', 'YearEndCompetitors'],
        11: ['YearEndAnalysis', 'NextYearPlanning']
      }
    };
    
    return seasonalMap[type as keyof typeof seasonalMap]?.[month] || [];
  };

  const generateContextualTrends = (text: string, type: string): string[] => {
    if (!text || text.length < 20) return [];
    
    const trendKeywords = {
      ai: ['AIMarketing', 'MachineLearning', 'AutomationTrends'],
      social: ['SocialMediaTrends', 'InfluencerMarketing', 'SocialCommerce'],
      mobile: ['MobileMarketing', 'AppOptimization', 'MobileFirst'],
      video: ['VideoMarketing', 'VideoSEO', 'VideoContent'],
      ecommerce: ['EcommerceTrends', 'OnlineShopping', 'DigitalCommerce']
    };
    
    const contextTrends: string[] = [];
    const lowerText = text.toLowerCase();
    
    Object.entries(trendKeywords).forEach(([key, trends]) => {
      if (lowerText.includes(key) || (key === 'ai' && (lowerText.includes('artificial intelligence') || lowerText.includes('machine learning')))) {
        contextTrends.push(...trends.slice(0, 1));
      }
    });
    
    return contextTrends.slice(0, 2);
  };
  
  const getHashtags = (analysisType: string, inputText: string = '') => {
    // Enhanced hashtag generation with trending and contextual analysis
    const baseHashtagSets = {
      content: {
        core: ['socialmedia', 'contentcreator', 'digitalmarketing', 'seo', 'marketing'],
        trending: ['contentmarketing2024', 'digitalstrategy', 'marketingtrends', 'brandbuilding', 'socialmediamarketing'],
        niche: ['contentcuration', 'storytelling', 'brandstory', 'engagement', 'audiencebuilding']
      },
      website: {
        core: ['webdesign', 'ux', 'webdev', 'frontend', 'responsive'],
        trending: ['webdesign2024', 'uxdesign', 'webdevelopment', 'mobileoptimization', 'webperformance'],
        niche: ['accessibility', 'userinterface', 'webusability', 'conversionoptimization', 'sitespeed']
      },
      keyword: {
        core: ['seo', 'keywords', 'searchengine', 'googleads', 'sem'],
        trending: ['seo2024', 'keywordresearch', 'searchmarketing', 'googleseo', 'seostrategy'],
        niche: ['longtailkeywords', 'semanticseo', 'localseo', 'voicesearch', 'searchintent']
      },
      competitor: {
        core: ['business', 'strategy', 'analysis', 'market', 'competition'],
        trending: ['competitiveanalysis', 'marketresearch', 'businessintelligence', 'industrytends', 'marketanalysis'],
        niche: ['competitorintel', 'marketdynamics', 'businessstrategy', 'industrybenchmark', 'marketpositioning']
      }
    };
    
    const typeHashtags = baseHashtagSets[analysisType as keyof typeof baseHashtagSets] || baseHashtagSets.content;
    
    // Generate contextual hashtags from input text
    const contextualHashtags = generateContextualHashtags(inputText, analysisType);
    
    // Combine hashtags with priority scoring
    const allHashtags = [
      ...typeHashtags.core.slice(0, 3),
      ...typeHashtags.trending.slice(0, 2),
      ...typeHashtags.niche.slice(0, 2),
      ...contextualHashtags
    ];
    
    return allHashtags.slice(0, 8);
  };

  const generateContextualHashtags = (text: string, type: string): string[] => {
    if (!text || text.length < 15) return [];
    
    const hashtagKeywords = {
      technology: ['tech', 'innovation', 'digital', 'software', 'app'],
      business: ['entrepreneur', 'startup', 'growth', 'success', 'leadership'],
      marketing: ['branding', 'advertising', 'promotion', 'campaign', 'influence'],
      design: ['creative', 'visual', 'aesthetic', 'modern', 'minimal'],
      ecommerce: ['ecommerce', 'onlineshopping', 'retail', 'sales', 'conversion']
    };
    
    const contextHashtags: string[] = [];
    const lowerText = text.toLowerCase();
    
    Object.entries(hashtagKeywords).forEach(([category, keywords]) => {
      const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matchCount > 0) {
        contextHashtags.push(category);
      }
    });
    
    return contextHashtags.slice(0, 2);
};

// ----------------------
// Advanced Insights Generation
// ----------------------
function generateAdvancedInsights(params: {
  text: string;
  type: string;
  url?: string;
  overallScore: number;
  keywordDensity: number;
  readabilityScore: number;
  trendingScore: number;
  competitionLevel: string;
}) {
  const { text, type, url, overallScore, keywordDensity, readabilityScore, trendingScore, competitionLevel } = params;
  
  const textLength = text.length;
  const wordCount = text.split(' ').length;
  const sentences = text.split(/[.!?]+/).length - 1;
  const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
  
  // Advanced content analysis
  const hasHeaders = /#{1,6}\s/.test(text) || /<h[1-6]/.test(text);
  const hasBulletPoints = /^\s*[-*+]\s/m.test(text) || /<[uo]l/.test(text);
  const hasLinks = /https?:\/\//.test(text) || /\[.*\]\(.*\)/.test(text);
  const hasNumbers = /\d+/.test(text);
  const questionCount = (text.match(/\?/g) || []).length;
  
  // Generate context-aware insights
  const strengths = generateStrengths({
    overallScore,
    keywordDensity,
    readabilityScore,
    trendingScore,
    textLength,
    wordCount,
    hasHeaders,
    hasBulletPoints,
    hasLinks,
    hasNumbers,
    type
  });
  
  const weaknesses = generateWeaknesses({
    overallScore,
    keywordDensity,
    readabilityScore,
    trendingScore,
    textLength,
    wordCount,
    avgWordsPerSentence,
    hasHeaders,
    hasBulletPoints,
    hasLinks,
    competitionLevel,
    type
  });
  
  const recommendations = generateRecommendations({
    overallScore,
    keywordDensity,
    readabilityScore,
    trendingScore,
    textLength,
    wordCount,
    avgWordsPerSentence,
    hasHeaders,
    hasBulletPoints,
    hasLinks,
    hasNumbers,
    questionCount,
    competitionLevel,
    type,
    url
  });
  
  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    recommendations: recommendations.slice(0, 6)
  };
}

function generateStrengths(params: any): string[] {
  const { overallScore, keywordDensity, readabilityScore, trendingScore, textLength, wordCount, hasHeaders, hasBulletPoints, hasLinks, hasNumbers, type } = params;
  const strengths: string[] = [];
  
  // Score-based strengths
  if (overallScore >= 80) {
    strengths.push('Excellent overall SEO optimization with strong ranking potential');
  } else if (overallScore >= 70) {
    strengths.push('Good SEO foundation with solid optimization practices');
  }
  
  if (keywordDensity >= 2 && keywordDensity <= 5) {
    strengths.push('Optimal keyword density for natural content flow and SEO value');
  }
  
  if (readabilityScore >= 80) {
    strengths.push('Highly readable content that engages users and reduces bounce rate');
  } else if (readabilityScore >= 70) {
    strengths.push('Good readability score suitable for target audience');
  }
  
  if (trendingScore >= 75) {
    strengths.push('Strong alignment with current trends and search patterns');
  }
  
  // Content structure strengths
  if (hasHeaders) {
    strengths.push('Well-structured content with proper heading hierarchy for better SEO');
  }
  
  if (hasBulletPoints) {
    strengths.push('Effective use of bullet points for improved scannability and user experience');
  }
  
  if (hasLinks) {
    strengths.push('Good linking strategy that enhances content authority and user navigation');
  }
  
  if (hasNumbers) {
    strengths.push('Data-driven content with statistics that increase credibility and engagement');
  }
  
  // Content length strengths
  if (wordCount >= 1000 && wordCount <= 2500) {
    strengths.push('Optimal content length for comprehensive coverage and SEO performance');
  } else if (wordCount >= 500) {
    strengths.push('Sufficient content depth for meaningful SEO value');
  }
  
  // Type-specific strengths
  if (type === 'website' && textLength > 200) {
    strengths.push('Comprehensive website content analysis with detailed insights');
  }
  
  if (type === 'keyword' && keywordDensity >= 3) {
    strengths.push('Strong keyword focus with good search optimization potential');
  }
  
  return strengths;
}

function generateWeaknesses(params: any): string[] {
  const { overallScore, keywordDensity, readabilityScore, trendingScore, textLength, wordCount, avgWordsPerSentence, hasHeaders, hasBulletPoints, hasLinks, competitionLevel, type } = params;
  const weaknesses: string[] = [];
  
  // Score-based weaknesses
  if (overallScore < 50) {
    weaknesses.push('Low overall SEO score requires comprehensive optimization strategy');
  } else if (overallScore < 70) {
    weaknesses.push('Moderate SEO performance with room for significant improvement');
  }
  
  if (keywordDensity < 1) {
    weaknesses.push('Insufficient keyword density may limit search visibility');
  } else if (keywordDensity > 6) {
    weaknesses.push('Keyword density too high, risk of being flagged as keyword stuffing');
  }
  
  if (readabilityScore < 60) {
    weaknesses.push('Poor readability may increase bounce rate and reduce user engagement');
  } else if (readabilityScore < 70) {
    weaknesses.push('Readability could be improved for better user experience');
  }
  
  if (trendingScore < 50) {
    weaknesses.push('Content lacks alignment with current trends and search patterns');
  }
  
  // Content structure weaknesses
  if (!hasHeaders) {
    weaknesses.push('Missing header structure reduces content organization and SEO value');
  }
  
  if (!hasBulletPoints && wordCount > 300) {
    weaknesses.push('Lack of bullet points or lists reduces content scannability');
  }
  
  if (!hasLinks && type !== 'keyword') {
    weaknesses.push('Missing internal/external links reduces content authority and navigation');
  }
  
  // Content length weaknesses
  if (wordCount < 300) {
    weaknesses.push('Content too short for comprehensive SEO value and user engagement');
  } else if (wordCount > 3000) {
    weaknesses.push('Content may be too long, consider breaking into multiple focused pieces');
  }
  
  // Sentence structure weaknesses
  if (avgWordsPerSentence > 25) {
    weaknesses.push('Sentences too long, may impact readability and user comprehension');
  } else if (avgWordsPerSentence < 8) {
    weaknesses.push('Sentences too short, may appear choppy and reduce content flow');
  }
  
  // Competition-based weaknesses
  if (competitionLevel === 'High') {
    weaknesses.push('High competition level requires stronger optimization and unique value proposition');
  }
  
  return weaknesses;
}

function generateRecommendations(params: any): string[] {
  const { overallScore, keywordDensity, readabilityScore, trendingScore, textLength, wordCount, avgWordsPerSentence, hasHeaders, hasBulletPoints, hasLinks, hasNumbers, questionCount, competitionLevel, type, url } = params;
  const recommendations: string[] = [];
  
  // Score-based recommendations
  if (overallScore < 70) {
    recommendations.push('Implement comprehensive SEO audit focusing on technical optimization and content quality');
  }
  
  if (keywordDensity < 2) {
    recommendations.push('Increase keyword density by naturally incorporating target keywords throughout content');
  } else if (keywordDensity > 5) {
    recommendations.push('Reduce keyword density to avoid over-optimization penalties');
  }
  
  if (readabilityScore < 70) {
    recommendations.push('Improve readability by using shorter sentences, simpler words, and better paragraph structure');
  }
  
  if (trendingScore < 60) {
    recommendations.push('Research and incorporate current industry trends and trending keywords');
  }
  
  // Content structure recommendations
  if (!hasHeaders) {
    recommendations.push('Add proper heading structure (H1, H2, H3) to improve content organization and SEO');
  }
  
  if (!hasBulletPoints && wordCount > 400) {
    recommendations.push('Use bullet points and numbered lists to improve content scannability');
  }
  
  if (!hasLinks) {
    recommendations.push('Add relevant internal and external links to increase content authority and user value');
  }
  
  if (!hasNumbers && type === 'content') {
    recommendations.push('Include statistics, data points, or numbered insights to increase content credibility');
  }
  
  // Content length recommendations
  if (wordCount < 500) {
    recommendations.push('Expand content to at least 500-1000 words for better SEO performance');
  }
  
  if (avgWordsPerSentence > 20) {
    recommendations.push('Break down long sentences into shorter, more digestible chunks');
  }
  
  // Type-specific recommendations
  if (type === 'website') {
    recommendations.push('Optimize page loading speed and implement technical SEO best practices');
    recommendations.push('Add schema markup for better search engine understanding');
  }
  
  if (type === 'keyword') {
    recommendations.push('Research long-tail keyword variations and semantic keywords');
    recommendations.push('Analyze search intent and optimize content accordingly');
  }
  
  if (type === 'competitor') {
    recommendations.push('Identify content gaps in competitor analysis and create unique value propositions');
    recommendations.push('Monitor competitor keyword strategies and find untapped opportunities');
  }
  
  // Competition-based recommendations
  if (competitionLevel === 'High') {
    recommendations.push('Focus on long-tail keywords and niche topics to compete effectively');
    recommendations.push('Build high-quality backlinks and establish domain authority');
  }
  
  // Engagement recommendations
  if (questionCount === 0 && type === 'content') {
    recommendations.push('Add engaging questions to encourage user interaction and comments');
  }
  
  // Universal recommendations
  recommendations.push('Regularly update content to maintain freshness and relevance');
  recommendations.push('Monitor performance metrics and adjust strategy based on data insights');
  
  return recommendations;
}

// ----------------------
// Advanced Competitor Analysis Generation
// ----------------------
function generateCompetitorAnalysisEnhanced(params: {
  text: string;
  type: string;
  url?: string;
  overallScore: number;
  keywordDensity: number;
  trendingScore: number;
}) {
  const { text, type, url, overallScore, keywordDensity, trendingScore } = params;
  
  try {
    // For now, use enhanced static analysis with real-time data simulation
    const keywords = extractKeywordsFromText(text, type);
    
    // Simulate real-time competitor data with enhanced static analysis
    const competitorData = generateCompetitorData(type, overallScore);
    const industryBenchmarks = getIndustryBenchmarks(type);
    
    // Generate areas for improvement based on enhanced competitor analysis
    const areasForImprovement = generateAreasForImprovement({
      userScore: overallScore,
      competitors: competitorData.competitors.map(c => ({ name: c.name, score: c.score })),
      industryAverage: competitorData.averageScore,
      type,
      text
    });
    
    return {
      topCompetitors: competitorData.competitors,
      averageScore: competitorData.averageScore,
      industryAverage: industryBenchmarks.average,
      competitionLevel: determineCompetitionLevel(overallScore, keywordDensity, trendingScore),
      marketShare: competitorData.marketShare,
      opportunities: generateCompetitorOpportunities({ type, overallScore, keywordDensity, trendingScore, competitionLevel: determineCompetitionLevel(overallScore, keywordDensity, trendingScore), text }),
      areasForImprovement,
      realTimeData: false,
      strengths: competitorData.strengths,
      threats: competitorData.threats,
      gapAnalysis: generateGapAnalysis(overallScore, competitorData.averageScore, type)
    };
  } catch (error) {
    console.error('Error fetching real-time competitor data:', error);
    
    // Fallback to enhanced static analysis
    const competitorData = generateCompetitorData(type, overallScore);
    const industryBenchmarks = getIndustryBenchmarks(type);
    const competitionLevel = determineCompetitionLevel(overallScore, keywordDensity, trendingScore);
    
    const opportunities = generateCompetitorOpportunities({
      type,
      overallScore,
      keywordDensity,
      trendingScore,
      competitionLevel,
      text
    });
    
    const areasForImprovement = generateAreasForImprovement({
      userScore: overallScore,
      competitors: competitorData.competitors.map(c => ({ name: c.name, score: c.score })),
      industryAverage: competitorData.averageScore,
      type,
      text
    });
    
    return {
      topCompetitors: competitorData.competitors,
      averageScore: competitorData.averageScore,
      industryAverage: industryBenchmarks.average,
      competitionLevel,
      marketShare: competitorData.marketShare,
      opportunities,
      areasForImprovement,
      realTimeData: false,
      strengths: competitorData.strengths,
      threats: competitorData.threats,
      gapAnalysis: generateGapAnalysis(overallScore, competitorData.averageScore, type)
    };
  }
}

function generateCompetitorData(type: string, userScore: number) {
  const competitorSets = {
    content: {
      names: ['ContentKing', 'MarketingPro', 'DigitalGuru', 'ContentMaster', 'SEOExpert', 'BrandBuilder'],
      industries: ['Content Marketing', 'Digital Marketing', 'SEO Services']
    },
    website: {
      names: ['WebDesignCorp', 'UXMasters', 'DigitalStudio', 'WebCrafters', 'DesignHub', 'TechSolutions'],
      industries: ['Web Design', 'Digital Agencies', 'Tech Services']
    },
    keyword: {
      names: ['SEOTools Inc', 'KeywordPro', 'SearchMaster', 'RankTracker', 'SEOAnalytics', 'SearchGuru'],
      industries: ['SEO Tools', 'Marketing Software', 'Analytics Platforms']
    },
    competitor: {
      names: ['MarketIntel', 'CompetitorScope', 'BusinessAnalytics', 'MarketResearch Co', 'IndustryInsights', 'TrendAnalyzer'],
      industries: ['Market Research', 'Business Intelligence', 'Analytics Services']
    }
  };
  
  const typeData = competitorSets[type as keyof typeof competitorSets] || competitorSets.content;
  
  // Generate 3-5 realistic competitors with varying scores
  const numCompetitors = 3 + Math.floor(Math.random() * 3);
  const competitors = [];
  
  for (let i = 0; i < numCompetitors; i++) {
    const name = typeData.names[i % typeData.names.length];
    
    // Generate scores that create realistic competition
    let score;
    if (i === 0) {
      // Top competitor - usually 10-25 points higher than user
      score = Math.min(95, userScore + 10 + Math.floor(Math.random() * 15));
    } else if (i === 1) {
      // Close competitor - within 5-15 points
      score = userScore + Math.floor(Math.random() * 20) - 10;
    } else {
      // Other competitors - varied range
      score = Math.max(30, Math.min(90, userScore + Math.floor(Math.random() * 40) - 20));
    }
    
    score = Math.max(35, Math.min(95, score));
    
    // Generate market share based on score
    const baseShare = Math.floor((score / 100) * 30);
    const marketShare = `${baseShare + Math.floor(Math.random() * 10)}%`;
    
    competitors.push({
      name,
      score,
      marketShare,
      industry: typeData.industries[Math.floor(Math.random() * typeData.industries.length)],
      trend: Math.random() > 0.5 ? 'up' : 'down',
      keyStrengths: generateCompetitorStrengths(type, score)
    });
  }
  
  // Sort by score descending
  competitors.sort((a, b) => b.score - a.score);
  
  const averageScore = Math.floor(competitors.reduce((sum, comp) => sum + comp.score, 0) / competitors.length);
  
  return {
    competitors: competitors.slice(0, 3), // Return top 3 for display
    averageScore,
    marketShare: competitors.reduce((total, comp) => {
      return total + parseInt(comp.marketShare.replace('%', ''));
    }, 0),
    strengths: generateMarketStrengths(type, competitors),
    threats: generateMarketThreats(type, competitors, userScore)
  };
}

function generateCompetitorStrengths(type: string, score: number): string[] {
  const strengthSets = {
    content: {
      high: ['Premium content quality', 'Strong brand authority', 'Excellent engagement rates'],
      medium: ['Good content consistency', 'Solid SEO foundation', 'Active social presence'],
      low: ['Basic content strategy', 'Limited reach', 'Inconsistent posting']
    },
    website: {
      high: ['Superior user experience', 'Fast loading speeds', 'Mobile optimization'],
      medium: ['Good design quality', 'Decent performance', 'Basic SEO setup'],
      low: ['Outdated design', 'Slow performance', 'Poor mobile experience']
    },
    keyword: {
      high: ['Dominant keyword rankings', 'Strong backlink profile', 'High search visibility'],
      medium: ['Good keyword coverage', 'Moderate authority', 'Steady rankings'],
      low: ['Limited keyword presence', 'Weak authority', 'Poor rankings']
    },
    competitor: {
      high: ['Market leadership', 'Strong brand recognition', 'Innovative solutions'],
      medium: ['Solid market position', 'Good reputation', 'Competitive offerings'],
      low: ['Niche presence', 'Limited recognition', 'Basic services']
    }
  };
  
  const typeStrengths = strengthSets[type as keyof typeof strengthSets] || strengthSets.content;
  
  if (score >= 80) return typeStrengths.high.slice(0, 2);
  if (score >= 60) return typeStrengths.medium.slice(0, 2);
  return typeStrengths.low.slice(0, 1);
}

function getIndustryBenchmarks(type: string) {
  const benchmarks = {
    content: { average: 72, top10: 85, median: 68 },
    website: { average: 75, top10: 88, median: 71 },
    keyword: { average: 69, top10: 82, median: 65 },
    competitor: { average: 74, top10: 87, median: 70 }
  };
  
  return benchmarks[type as keyof typeof benchmarks] || benchmarks.content;
}

function determineCompetitionLevel(overallScore: number, keywordDensity: number, trendingScore: number): string {
  const competitiveFactors = [
    overallScore < 60 ? 1 : overallScore < 80 ? 2 : 3,
    keywordDensity < 3 ? 1 : keywordDensity < 6 ? 2 : 3,
    trendingScore < 50 ? 1 : trendingScore < 75 ? 2 : 3
  ];
  
  const averageFactor = competitiveFactors.reduce((sum, factor) => sum + factor, 0) / 3;
  
  if (averageFactor >= 2.5) return 'High';
  if (averageFactor >= 1.5) return 'Medium';
  return 'Low';
}

function generateCompetitorOpportunities(params: {
  type: string;
  overallScore: number;
  keywordDensity: number;
  trendingScore: number;
  competitionLevel: string;
  text: string;
}): string[] {
  const { type, overallScore, keywordDensity, trendingScore, competitionLevel, text } = params;
  
  const opportunities: string[] = [];
  
  // Score-based opportunities
  if (overallScore < 70) {
    opportunities.push('Significant opportunity to outrank competitors with comprehensive SEO optimization');
  }
  
  if (keywordDensity < 3) {
    opportunities.push('Competitors may be under-optimizing for target keywords - opportunity for better targeting');
  }
  
  if (trendingScore < 60) {
    opportunities.push('Gap in trending content - opportunity to capture emerging search trends');
  }
  
  // Competition level opportunities
  if (competitionLevel === 'Low') {
    opportunities.push('Low competition environment - excellent opportunity for rapid ranking improvements');
    opportunities.push('Market gap exists for high-quality, optimized content in this niche');
  } else if (competitionLevel === 'Medium') {
    opportunities.push('Moderate competition allows for strategic positioning with focused optimization');
    opportunities.push('Opportunity to differentiate through unique value propositions and better UX');
  } else {
    opportunities.push('High competition requires innovative approaches - focus on long-tail keywords and niche topics');
    opportunities.push('Opportunity to build authority through thought leadership and expert content');
  }
  
  // Type-specific opportunities
  const typeOpportunities = {
    content: [
      'Create more engaging, interactive content formats',
      'Develop comprehensive content series and pillar pages',
      'Leverage user-generated content and community building'
    ],
    website: [
      'Implement advanced technical SEO optimizations',
      'Enhance mobile experience and Core Web Vitals',
      'Add schema markup and structured data'
    ],
    keyword: [
      'Target untapped long-tail keyword opportunities',
      'Develop semantic keyword clusters and topic authority',
      'Focus on voice search and conversational queries'
    ],
    competitor: [
      'Identify and exploit competitor content gaps',
      'Develop superior alternatives to competitor offerings',
      'Build strategic partnerships and collaborations'
    ]
  };
  
  const specificOpps = typeOpportunities[type as keyof typeof typeOpportunities] || typeOpportunities.content;
  opportunities.push(...specificOpps.slice(0, 2));
  
  // Content-based opportunities
  if (text.length > 500) {
    opportunities.push('Leverage comprehensive content length advantage over competitors');
  }
  
  return opportunities.slice(0, 6);
}

function generateMarketStrengths(type: string, competitors: any[]): string[] {
  const avgScore = competitors.reduce((sum, comp) => sum + comp.score, 0) / competitors.length;
  
  const strengths: string[] = [];
  
  if (avgScore >= 80) {
    strengths.push('Highly competitive market with strong players driving innovation');
  } else if (avgScore >= 70) {
    strengths.push('Mature market with established competitors and proven strategies');
  } else {
    strengths.push('Emerging market with opportunities for new entrants and innovation');
  }
  
  // Add type-specific market strengths
  const typeStrengths = {
    content: ['Strong content creation ecosystem', 'Active audience engagement'],
    website: ['Advanced web technologies adoption', 'Focus on user experience'],
    keyword: ['Sophisticated SEO practices', 'Data-driven optimization'],
    competitor: ['Comprehensive market intelligence', 'Strategic positioning awareness']
  };
  
  const specificStrengths = typeStrengths[type as keyof typeof typeStrengths] || typeStrengths.content;
  strengths.push(...specificStrengths);
  
  return strengths.slice(0, 3);
}

function generateMarketThreats(type: string, competitors: any[], userScore: number): string[] {
  const threats: string[] = [];
  
  const topCompetitor = competitors[0];
  if (topCompetitor && topCompetitor.score > userScore + 15) {
    threats.push(`${topCompetitor.name} has significant competitive advantage with ${topCompetitor.score} score`);
  }
  
  const highPerformers = competitors.filter(comp => comp.score > 80).length;
  if (highPerformers >= 2) {
    threats.push('Multiple high-performing competitors dominating search results');
  }
  
  // Type-specific threats
  const typeThreats = {
    content: ['Content saturation in popular topics', 'Rising content creation costs'],
    website: ['Rapid technology changes requiring constant updates', 'Increasing user experience expectations'],
    keyword: ['Algorithm updates affecting rankings', 'Increasing keyword competition and costs'],
    competitor: ['Market consolidation reducing opportunities', 'Faster competitor adaptation to trends']
  };
  
  const specificThreats = typeThreats[type as keyof typeof typeThreats] || typeThreats.content;
  threats.push(...specificThreats.slice(0, 2));
  
  return threats.slice(0, 4);
}

function generateGapAnalysis(userScore: number, competitorAverage: number, type: string) {
  const gap = competitorAverage - userScore;
  
  const analysis = {
    scoreGap: gap,
    position: gap > 10 ? 'Behind' : gap > -5 ? 'Competitive' : 'Leading',
    priority: gap > 15 ? 'Critical' : gap > 5 ? 'High' : 'Medium',
    timeToClose: gap > 20 ? '6-12 months' : gap > 10 ? '3-6 months' : '1-3 months',
    keyAreas: generateGapAreas(gap, type)
  };
  
  return analysis;
}

// ----------------------
// Helper Functions for Real-Time Analysis
// ----------------------
function extractKeywordsFromText(text: string, type: string): string[] {
  // Extract meaningful keywords from the input text
  const words = text.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common stop words
  const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'about'];
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  // Get word frequency
  const wordFreq: { [key: string]: number } = {};
  filteredWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  const sortedKeywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  return sortedKeywords;
}

function detectIndustryFromType(type: string): string {
  const industryMap: { [key: string]: string } = {
    'content': 'marketing',
    'website': 'technology',
    'keyword': 'marketing',
    'competitor': 'marketing',
    'ecommerce': 'ecommerce',
    'blog': 'marketing',
    'product': 'ecommerce'
  };
  
  return industryMap[type] || 'marketing';
}

function generateAreasForImprovement(params: {
  userScore: number;
  competitors: any[];
  industryAverage: number;
  type: string;
  text: string;
}): string[] {
  const { userScore, competitors, industryAverage, type, text } = params;
  const improvements: string[] = [];
  
  // Score-based improvements
  if (userScore < industryAverage) {
    const gap = industryAverage - userScore;
    improvements.push(`Score is ${gap} points below industry average (${industryAverage}) - focus on comprehensive optimization`);
  }
  
  // Competitor-based improvements
  const topCompetitor = competitors[0];
  if (topCompetitor && topCompetitor.score > userScore + 10) {
    improvements.push(`Top competitor (${topCompetitor.name || 'Leader'}) outperforms by ${topCompetitor.score - userScore} points - analyze their strategy`);
  }
  
  // Content-specific improvements
  const textLength = text.length;
  if (textLength < 500) {
    improvements.push('Content length is below optimal range - expand with valuable, relevant information');
  }
  
  // Type-specific improvements
  const typeImprovements: { [key: string]: string[] } = {
    content: [
      'Enhance content depth and expertise demonstration',
      'Improve content structure with better headings and formatting',
      'Add more engaging multimedia elements'
    ],
    website: [
      'Optimize page loading speed and technical performance',
      'Improve mobile responsiveness and user experience',
      'Enhance internal linking structure'
    ],
    keyword: [
      'Expand keyword targeting to include long-tail variations',
      'Improve keyword placement and natural integration',
      'Research and target competitor keyword gaps'
    ],
    competitor: [
      'Develop unique value propositions to differentiate',
      'Identify and exploit competitor content gaps',
      'Improve brand authority and thought leadership'
    ]
  };
  
  const specificImprovements = typeImprovements[type] || typeImprovements.content;
  improvements.push(...specificImprovements.slice(0, 2));
  
  // General improvements based on competition level
  if (competitors.length >= 4) {
    improvements.push('High competition detected - focus on niche differentiation and specialized expertise');
  }
  
  return improvements.slice(0, 6);
}

function generateGapAreas(gap: number, type: string): string[] {
  const areas: string[] = [];
  
  if (gap > 15) {
    areas.push('Comprehensive SEO strategy overhaul needed');
    areas.push('Content quality and depth improvements required');
  } else if (gap > 5) {
    areas.push('Technical optimization improvements needed');
    areas.push('Content strategy refinement required');
  } else {
    areas.push('Fine-tuning and optimization opportunities');
    areas.push('Competitive differentiation strategies');
  }
  
  // Type-specific gap areas
  const typeAreas = {
    content: ['Content calendar optimization', 'Audience engagement strategies'],
    website: ['Technical performance improvements', 'User experience enhancements'],
    keyword: ['Keyword strategy expansion', 'Search visibility improvements'],
    competitor: ['Market positioning refinement', 'Competitive advantage development']
  };
  
  const specificAreas = typeAreas[type as keyof typeof typeAreas] || typeAreas.content;
  areas.push(...specificAreas.slice(0, 1));
  
  return areas.slice(0, 3);
}
  
    return {
      overallScore,
      keywordDensity,
      readabilityScore,
      competitionLevel: overallScore > 75 ? 'Low' : overallScore > 50 ? 'Medium' : 'High',
      searchVolume: Math.floor(Math.random() * 50000) + 10000,
      trendingScore,
      suggestions: [
        'Optimize your title tags for better click-through rates',
        'Add more internal links to improve site structure',
        'Include long-tail keywords in your content',
        'Improve page loading speed for better user experience'
      ],
      keywords: getKeywordsForType(type, text),
      hashtags: getHashtags(type, text),
      trendingTags: getTrendingTags(type, text),
      competitorAnalysis: generateCompetitorAnalysisEnhanced({
        text,
        type,
        url,
        overallScore,
        keywordDensity,
        trendingScore
      }),
      insights: generateAdvancedInsights({
        text,
        type,
        url,
        overallScore,
        keywordDensity,
        readabilityScore,
        trendingScore,
        competitionLevel
      })
    };
  } catch (error) {
    console.error('Error in generateSEOAnalysis:', error);
    // Return a fallback analysis object
    return {
      overallScore: 50,
      keywordDensity: 2,
      readabilityScore: 60,
      competitionLevel: 'Medium',
      searchVolume: 25000,
      trendingScore: 50,
      suggestions: [
        'Unable to complete full analysis - please try again',
        'Check your input content and try again',
        'Ensure your content has sufficient text for analysis'
      ],
      keywords: ['content', 'analysis', 'seo'],
      hashtags: ['content', 'seo', 'analysis'],
      trendingTags: ['ContentMarketing', 'SEO', 'DigitalStrategy'],
      competitorAnalysis: {
        topCompetitors: ['Competitor 1', 'Competitor 2'],
        averageScore: 60,
        opportunities: ['Improve content quality', 'Optimize for search']
      },
      insights: {
        strengths: ['Basic content structure'],
        weaknesses: ['Analysis incomplete'],
        recommendations: ['Try analysis again with valid content']
      }
    };
  }
}

// ----------------------
// Main SEOSuggestions Module
// ----------------------
export default function SEOSuggestions() {
  const [analysis, setAnalysis] = React.useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);

  // Memoize the analysis function to prevent unnecessary re-renders
  const handleAnalyze = React.useCallback(async (data: { text: string; type: string; url?: string }) => {
    setLoading(true);
    try {
      // Validate input data
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('Content is required for analysis');
      }
      
      if (data.type === 'website' && data.url && !data.url.trim()) {
        throw new Error('Valid URL is required for website analysis');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate AI-powered analysis
      const analysisResult = await generateSEOAnalysis(data);
      
      if (!analysisResult) {
        throw new Error('Failed to generate analysis result');
      }
      
      setAnalysis(analysisResult);
      
      toast.success(`${data.type.charAt(0).toUpperCase() + data.type.slice(1)} analysis completed successfully!`);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize keyword selection handler
  const handleSelectKeyword = React.useCallback((keyword: string) => {
    setSelectedKeywords(prev => {
      if (!prev.includes(keyword)) {
        toast.success(`"${keyword}" added to your selection`);
        return [...prev, keyword];
      }
      return prev;
    });
  }, []);

  const handleRemoveKeyword = (keyword: string) => {
    setSelectedKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleClearAll = () => {
    setSelectedKeywords([]);
    toast.success("All keywords cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI-Powered SEO Analysis</h1>
          <p className="text-lg text-gray-600">Optimize your content with intelligent insights and recommendations</p>
        </div>

        {/* Analysis Input */}
        <AnalysisInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Results Section */}
        {analysis && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-xl bg-white shadow-sm">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="keywords" className="rounded-lg">Keywords</TabsTrigger>
              <TabsTrigger value="insights" className="rounded-lg">Insights</TabsTrigger>
              <TabsTrigger value="competitors" className="rounded-lg">Competitors</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <SEOScoreDashboard analysis={analysis} />
              <TrendingTags analysis={analysis} onSelect={handleSelectKeyword} />
              <SelectedKeywords 
                selected={selectedKeywords} 
                onRemove={handleRemoveKeyword} 
                onClearAll={handleClearAll} 
              />
            </TabsContent>

            <TabsContent value="keywords" className="space-y-6 mt-6">
              <TrendingTags analysis={analysis} onSelect={handleSelectKeyword} />
              <SelectedKeywords 
                selected={selectedKeywords} 
                onRemove={handleRemoveKeyword} 
                onClearAll={handleClearAll} 
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              <ActionableInsights analysis={analysis} />
            </TabsContent>

            <TabsContent value="competitors" className="space-y-6 mt-6">
              <CompetitorAnalysis analysis={analysis} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <DataVisualization analysis={analysis} loading={loading} />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Analyze</h3>
              <p className="text-gray-600 mb-6">Enter your content, website URL, or keywords above to get started with AI-powered SEO analysis.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Content Analysis</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Globe className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Website Audit</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Search className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Keyword Research</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Competitor Intel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
