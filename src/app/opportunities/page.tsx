"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import OpportunityFilters from "@/components/opportunity-components/filters";
import OpportunityRadar from "@/components/opportunity-components/radar";
import OpportunityAlerts from "@/components/opportunity-components/alerts";
import OpportunityList from "@/components/opportunity-components/list";
import { AnalyticalQuestions } from "@/components/opportunity-components/analytical-questions";
import { Download, RefreshCw, TrendingUp, Target, Zap, BarChart3, Search, Filter } from "lucide-react";

export default function OpportunityPage() {
  const [opportunities, setOpportunities] = React.useState<
    { 
      id: number; 
      title: string; 
      industry: string; 
      value: string;
      priority?: string;
      confidence?: number;
      status?: string;
      dateAdded?: string;
      description?: string;
    }[]
  >([]);
  const [alerts, setAlerts] = React.useState<
    { 
      id: number; 
      message: string; 
      type: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      timestamp?: string;
      source?: string;
      actionable?: boolean;
    }[]
  >([]);
  const [filters, setFilters] = React.useState({ 
    industry: "all", 
    location: "", 
    valueRange: "all",
    priority: "all",
    status: "all",
    dateRange: "all"
  });
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [totalValue, setTotalValue] = React.useState(0);
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<any>(null);

  // AI-powered scanning function with real API integration
  const scanOpportunities = async () => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      // Simulate scanning progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Get industries from current opportunities or use defaults
      const currentIndustries = [...new Set(opportunities.map(opp => opp.industry))];
      const industries = currentIndustries.length > 0 ? currentIndustries : ['Technology', 'Healthcare', 'Finance', 'Energy', 'Retail'];

      // Call AI-powered scan API
      const response = await fetch('/api/opportunities/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industries,
          filters
        })
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update with AI-generated data
        setOpportunities(result.data.opportunities);
        setAlerts(result.data.alerts);
        setTotalValue(result.data.totalValue);

        // Add success alert
        setAlerts(prev => [{
          id: Date.now(),
          message: `🔎 AI scan completed - ${result.data.opportunities.length} opportunities identified with total value of $${result.data.totalValue.toLocaleString()}`,
          type: "success",
          severity: "high" as const,
          timestamp: new Date().toISOString(),
          source: "AI Scanner",
          actionable: true
        }, ...prev]);
      } else {
        throw new Error(result.message || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      // Fallback to mock data on error
      const mockOpportunities = [
        {
          id: Date.now(),
          title: "Enterprise Software Integration",
          industry: "Technology",
          value: "$250,000",
          priority: "High",
          confidence: 85,
          status: "Active",
          dateAdded: new Date().toISOString(),
          description: "Large-scale enterprise software integration project for Fortune 500 company"
        },
        {
          id: Date.now() + 1,
          title: "Healthcare Data Analytics Platform",
          industry: "Healthcare",
          value: "$180,000",
          priority: "Critical",
          confidence: 92,
          status: "Pending",
          dateAdded: new Date().toISOString(),
          description: "AI-powered healthcare analytics platform for patient data insights"
        }
      ];

      setOpportunities(mockOpportunities);
      
      // Calculate total value
      const total = mockOpportunities.reduce((sum, opp) => {
        const value = parseFloat(opp.value.replace(/[^0-9.-]+/g, "")) || 0;
        return sum + value;
      }, 0);
      setTotalValue(total);

      // Add error alert
      setAlerts(prev => [{
        id: Date.now(),
        message: `⚠️ Scan completed with limited data - ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: "warning",
        severity: "medium" as const,
        timestamp: new Date().toISOString(),
        source: "System",
        actionable: false
      }, ...prev]);
    } finally {
      setScanProgress(100);
      setIsScanning(false);
    }
  };

  // Export report to CSV
  const exportReport = () => {
    if (opportunities.length === 0) {
      alert("⚠️ No opportunities to export.");
      return;
    }

    const rows = [["ID", "Title", "Industry", "Value"]];
    opportunities.forEach((o) => {
      rows.push([o.id, o.title, o.industry, o.value]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "opportunity_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock alerts on first load
  React.useEffect(() => {
    setAlerts([
      { 
        id: 1, 
        message: "✨ AI opportunity detected in Tech Industry", 
        type: "opportunity",
        severity: "medium" as const,
        timestamp: new Date().toISOString(),
        source: "AI Monitor",
        actionable: true
      },
      { 
        id: 2, 
        message: "💡 Healthcare funding opportunity spotted", 
        type: "funding",
        severity: "high" as const,
        timestamp: new Date().toISOString(),
        source: "Funding Tracker",
        actionable: true
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Enhanced Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                🎯 Opportunity Intelligence
              </h1>
              <p className="text-slate-600 text-lg">AI-powered market analysis and opportunity discovery</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={scanOpportunities}
                disabled={isScanning}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    AI Scan Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={exportReport}
                className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl px-6 py-3 shadow-sm transition-all hover:scale-105"
              >
                <Download size={16} /> Export Report
              </Button>
            </div>
          </div>
          
          {/* Progress Bar for Scanning */}
          {isScanning && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">AI Analysis Progress</span>
                <span className="text-sm text-slate-500">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Opportunities</p>
                    <p className="text-2xl font-bold text-slate-800">{opportunities.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Value</p>
                    <p className="text-2xl font-bold text-emerald-600">${totalValue}K</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">High Priority</p>
                    <p className="text-2xl font-bold text-orange-600">{opportunities.filter(o => o.priority === 'High' || o.priority === 'Critical').length}</p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">{opportunities.length > 0 ? Math.round(opportunities.reduce((sum, o) => sum + (o.confidence || 0), 0) / opportunities.length) : 0}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              Smart Filters & Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunityFilters filters={filters} setFilters={setFilters} />
          </CardContent>
        </Card>

        {/* Enhanced Radar + Alerts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <OpportunityRadar opportunities={opportunities} />
          <OpportunityAlerts 
            alerts={alerts} 
            onRefresh={() => scanOpportunities()}
            isLoading={isScanning}
          />
        </div>

        {/* Enhanced List Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Opportunity Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showAnalysis ? (
              opportunities.length > 0 ? (
                <OpportunityList 
                  opportunities={opportunities} 
                  onAnalyze={(opportunity) => {
                    setSelectedOpportunity(opportunity);
                    setShowAnalysis(true);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <Search className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Discover Opportunities?</h3>
                  <p className="text-slate-600 mb-4">Use our AI-powered scanner to identify high-value business opportunities in your market.</p>
                  <Button
                    onClick={scanOpportunities}
                    disabled={isScanning}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-6 py-3"
                  >
                    {isScanning ? 'Scanning...' : 'Start AI Scan'}
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAnalysis(false);
                      setSelectedOpportunity(null);
                    }}
                  >
                    ← Back to Opportunities
                  </Button>
                </div>
                
                <AnalyticalQuestions 
                  opportunity={selectedOpportunity}
                  onAnalysisComplete={(result) => {
                    console.log('Analysis completed:', result);
                    // You can add additional logic here to save or process the analysis
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
