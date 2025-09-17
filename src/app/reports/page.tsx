'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, Download, FileText, TrendingUp, Users, DollarSign, Mail, 
  RefreshCw, Search, Filter, Plus, Edit, Trash2, Eye, EyeOff, Save,
  BarChart3, PieChart, LineChart, Activity, AlertCircle, CheckCircle,
  Clock, Calendar, Tag, User, Settings, Keyboard, Accessibility, Wifi, WifiOff
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Cell, Area, AreaChart
} from 'recharts';
import { useRealTimeReports } from '@/hooks/useRealTimeReports';

// Types
interface ReportData {
  summary?: any;
  metrics?: any;
  [key: string]: any;
}

interface AnalystNote {
  id: string;
  title: string;
  content: string;
  reportType?: string;
  tags?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReportFilters {
  reportType: string;
  startDate: string;
  endDate: string;
  period: string;
  currency: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportsPage = () => {
  // Real-time data hook
  const {
    data: realTimeData,
    loading: realTimeLoading,
    error: realTimeError,
    lastUpdated,
    refresh: refreshRealTime,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing
  } = useRealTimeReports({
    currency: 'USD',
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true
  });

  // State management
  const [reportData, setReportData] = useState<ReportData>({
    summary: {
      totalLeads: 1234,
      totalDeals: 89,
      totalRevenue: 45231,
      totalInvoices: 156,
      totalInvoiceAmount: 78450,
      totalCampaigns: 23,
      totalContacts: 2456,
      totalPayments: 134,
      totalPaymentAmount: 67890
    },
    metrics: {
      averageDealValue: 508.2,
      averageInvoiceAmount: 502.9,
      emailOpenRate: 24.5,
      emailClickRate: 3.2,
      conversionRate: 7.2
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'overview',
    startDate: '',
    endDate: '',
    period: '30d',
    currency: 'USD'
  });
  const [useRealTime, setUseRealTime] = useState(true);
  
  // Analyst Notes state
  const [notes, setNotes] = useState<AnalystNote[]>([
    {
      id: '1',
      title: 'Q4 Performance Analysis',
      content: 'Strong performance in lead generation with 15% increase over Q3. Email campaigns showing improved engagement rates.',
      reportType: 'overview',
      tags: 'Q4, performance, leads',
      priority: 'high',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { id: '1', name: 'John Analyst', email: 'john@company.com' }
    }
  ]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    reportType: '',
    tags: '',
    priority: 'medium' as const,
    isPublic: false
  });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState({
    title: '',
    content: '',
    reportType: '',
    tags: '',
    priority: 'medium' as const,
    isPublic: false
  });
  const [notesFilter, setNotesFilter] = useState({
    period: 'all',
    search: '',
    reportType: 'all'
  });
  const [notesLoading, setNotesLoading] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  
  // Get current data (real-time or static)
  const getCurrentData = useCallback(() => {
    if (useRealTime && realTimeData) {
      return {
        summary: {
          totalLeads: realTimeData.metrics.totalLeads,
          totalDeals: realTimeData.metrics.totalDeals,
          totalRevenue: realTimeData.metrics.totalRevenue,
          totalInvoices: realTimeData.metrics.totalInvoices,
          totalInvoiceAmount: realTimeData.metrics.totalInvoiceAmount,
          totalCampaigns: realTimeData.metrics.totalCampaigns,
          totalContacts: realTimeData.metrics.totalContacts,
          totalPayments: realTimeData.metrics.totalPayments,
          totalPaymentAmount: realTimeData.metrics.totalPaymentAmount
        },
        metrics: {
          averageDealValue: realTimeData.metrics.averageDealValue,
          averageInvoiceAmount: realTimeData.metrics.averageInvoiceAmount,
          emailOpenRate: realTimeData.metrics.emailOpenRate,
          emailClickRate: realTimeData.metrics.emailClickRate,
          conversionRate: realTimeData.metrics.conversionRate
        }
      };
    }
    return reportData;
  }, [useRealTime, realTimeData, reportData]);

  // Get chart data (real-time trends or mock data)
  const getChartData = useCallback(() => {
    if (useRealTime && realTimeData?.trends) {
      return realTimeData.trends.map(trend => ({
        month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
        sales: trend.deals,
        revenue: trend.revenue,
        leads: trend.leads
      }));
    }
    // Mock chart data fallback
    return [
      { month: 'Jan', sales: 4000, revenue: 2400, leads: 240 },
      { month: 'Feb', sales: 3000, revenue: 1398, leads: 221 },
      { month: 'Mar', sales: 2000, revenue: 9800, leads: 229 },
      { month: 'Apr', sales: 2780, revenue: 3908, leads: 200 },
      { month: 'May', sales: 1890, revenue: 4800, leads: 218 },
      { month: 'Jun', sales: 2390, revenue: 3800, leads: 250 },
    ];
  }, [useRealTime, realTimeData]);

  const currentData = getCurrentData();
  const chartData = getChartData();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            fetchReportData();
            break;
          case 'e':
            e.preventDefault();
            exportReport('csv');
            break;
          case 'p':
            e.preventDefault();
            exportReport('pdf');
            break;
          case 'n':
            e.preventDefault();
            document.getElementById('new-note-title')?.focus();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Fetch report data
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type: filters.reportType,
        period: filters.period,
        currency: filters.currency,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });
      
      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch report data');
      }
      
      setReportData(result.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      // Keep existing mock data on error
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Fetch analyst notes
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    
    try {
      const params = new URLSearchParams({
        period: notesFilter.period,
        ...(notesFilter.search && { search: notesFilter.search }),
        ...(notesFilter.reportType && notesFilter.reportType !== 'all' && { reportType: notesFilter.reportType })
      });
      
      const response = await fetch(`/api/analyst-notes?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setNotes(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [notesFilter]);
  
  // Generate report
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: filters.reportType,
          parameters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            currency: filters.currency,
            period: filters.period
          }
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }
      
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Export report
  const exportReport = async (format: 'csv' | 'pdf' | 'json') => {
    setExportLoading(format);
    
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          reportType: filters.reportType,
          data: reportData,
          parameters: filters
        })
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filters.reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(null);
    }
  };
  
  // Save analyst note
  const saveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    try {
      const response = await fetch('/api/analyst-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNote,
          authorId: 'cmflmnsq70000u6qol9umefqw' // Using actual seeded admin user ID
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNotes(prev => [result.data, ...prev]);
        setNewNote({
          title: '',
          content: '',
          reportType: '',
          tags: '',
          priority: 'medium',
          isPublic: false
        });
      }
    } catch (err) {
      // Add to local state as fallback
      const newNoteWithId = {
        ...newNote,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { id: '1', name: 'Current User', email: 'user@company.com' }
      };
      setNotes(prev => [newNoteWithId, ...prev]);
      setNewNote({
        title: '',
        content: '',
        reportType: '',
        tags: '',
        priority: 'medium',
        isPublic: false
      });
    }
  };

  // Update analyst note
  const updateNote = async (noteId: string) => {
    if (!editedNote.title.trim() || !editedNote.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await fetch('/api/analyst-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          ...editedNote
        })
      });

      const result = await response.json();

      if (result.success) {
        setNotes(prev => prev.map(note => 
          note.id === noteId ? result.data : note
        ));
        setEditingNote(null);
        setEditedNote({
          title: '',
          content: '',
          reportType: '',
          tags: '',
          priority: 'medium',
          isPublic: false
        });
      }
    } catch (err) {
      console.error('Failed to update note:', err);
      setError('Failed to update note');
    }
  };

  // Delete analyst note
  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/analyst-notes?id=${noteId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      }
    } catch (err) {
      // Remove from local state as fallback
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };
  
  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (notesFilter.search && !note.title.toLowerCase().includes(notesFilter.search.toLowerCase()) && 
        !note.content.toLowerCase().includes(notesFilter.search.toLowerCase())) {
      return false;
    }
    if (notesFilter.reportType && notesFilter.reportType !== 'all' && note.reportType !== notesFilter.reportType) {
      return false;
    }
    return true;
  });
  
  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchReportData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchReportData, loading]);
  
  return (
    <div className="container mx-auto p-6 space-y-6" role="main" aria-label="Reports Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and insights</p>
          {/* Real-time status indicator */}
          <div className="flex items-center gap-2 mt-2">
            {useRealTime ? (
              <>
                {isAutoRefreshing ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Live Updates Active</span>
                    {lastUpdated && (
                      <span className="text-xs text-gray-500">
                        • Last updated {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Real-time Paused</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Static Data Mode</span>
              </div>
            )}
            {realTimeError && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Connection Error</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Real-time toggle */}
          <Button
            onClick={() => {
              setUseRealTime(!useRealTime);
              if (!useRealTime) {
                startAutoRefresh();
              } else {
                stopAutoRefresh();
              }
            }}
            variant={useRealTime ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {useRealTime ? (
              <>
                <Wifi className="h-4 w-4" />
                Live Mode
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                Static Mode
              </>
            )}
          </Button>
          {/* Real-time refresh button */}
          {useRealTime && (
            <Button
              onClick={refreshRealTime}
              disabled={realTimeLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Refresh real-time data"
            >
              <RefreshCw className={`h-4 w-4 ${realTimeLoading ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          )}
          {!useRealTime && (
            <Button 
              onClick={() => fetchReportData()} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button 
            onClick={() => exportReport('csv')} 
            variant="outline" 
            size="sm"
            disabled={exportLoading === 'csv'}
            className="flex items-center gap-2"
            aria-label="Export as CSV"
          >
            <Download className="h-4 w-4" />
            {exportLoading === 'csv' ? 'Exporting...' : 'CSV'}
          </Button>
          <Button 
            onClick={() => exportReport('pdf')} 
            variant="outline" 
            size="sm"
            disabled={exportLoading === 'pdf'}
            className="flex items-center gap-2"
            aria-label="Export as PDF"
          >
            <FileText className="h-4 w-4" />
            {exportLoading === 'pdf' ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>
      
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={filters.reportType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Select 
                  value={filters.period} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generateReport} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notes">Analyst Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${currentData.summary?.totalRevenue?.toLocaleString() || '45,231'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentData.summary?.totalLeads?.toLocaleString() || '1,234'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Deals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentData.summary?.totalDeals || '89'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentData.metrics?.emailOpenRate?.toFixed(1) || '24.5'}%
                    </p>
                  </div>
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Deal Value</span>
                    <span className="font-bold">${currentData.metrics?.averageDealValue?.toFixed(2) || '508.20'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="font-bold">{currentData.metrics?.conversionRate?.toFixed(1) || '7.2'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Email Click Rate</span>
                    <span className="font-bold">{currentData.metrics?.emailClickRate?.toFixed(1) || '3.2'}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Campaigns</span>
                    <span className="font-bold">{currentData.summary?.totalCampaigns || '23'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Invoices</span>
                    <span className="font-bold">{currentData.summary?.totalInvoices || '156'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Invoice Amount</span>
                    <span className="font-bold">${currentData.summary?.totalInvoiceAmount?.toLocaleString() || '78,450'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Payments</span>
                    <span className="font-bold">{currentData.summary?.totalPayments || '134'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Payment Amount</span>
                    <span className="font-bold">${currentData.summary?.totalPaymentAmount?.toLocaleString() || '67,890'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales & Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Lead Generation Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-6">
          {/* Notes Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="notesSearch">Search</Label>
                  <Input
                    id="notesSearch"
                    placeholder="Search notes..."
                    value={notesFilter.search}
                    onChange={(e) => setNotesFilter(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notesPeriod">Period</Label>
                  <Select 
                    value={notesFilter.period} 
                    onValueChange={(value) => setNotesFilter(prev => ({ ...prev, period: value }))}
                  >
                    <SelectTrigger id="notesPeriod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="daily">Today</SelectItem>
                      <SelectItem value="weekly">This Week</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notesReportType">Report Type</Label>
                  <Select 
                    value={notesFilter.reportType} 
                    onValueChange={(value) => setNotesFilter(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger id="notesReportType">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="overview">Overview</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Add New Note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-note-title">Title</Label>
                    <Input
                      id="new-note-title"
                      placeholder="Note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-note-type">Report Type</Label>
                    <Select 
                      value={newNote.reportType} 
                      onValueChange={(value) => setNewNote(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger id="new-note-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="pipeline">Pipeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-note-content">Content</Label>
                  <Textarea
                    id="new-note-content"
                    placeholder="Add your analysis notes here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new-note-tags">Tags</Label>
                    <Input
                      id="new-note-tags"
                      placeholder="comma, separated, tags"
                      value={newNote.tags}
                      onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-note-priority">Priority</Label>
                    <Select 
                      value={newNote.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                        setNewNote(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger id="new-note-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={saveNote} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Historical Notes ({filteredNotes.length})</h3>
            {filteredNotes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No notes found matching your criteria.
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={note.priority === 'critical' ? 'destructive' : 
                                        note.priority === 'high' ? 'default' : 'secondary'}>
                            {note.priority}
                          </Badge>
                          {note.reportType && (
                            <Badge variant="outline">{note.reportType}</Badge>
                          )}
                          {note.isPublic ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> Private
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingNote(note.id);
                          setEditedNote({
                            title: note.title,
                            content: note.content,
                            reportType: note.reportType || '',
                            tags: note.tags || '',
                            priority: note.priority,
                            isPublic: note.isPublic
                          });
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingNote === note.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`edit-title-${note.id}`}>Title</Label>
                          <Input
                            id={`edit-title-${note.id}`}
                            value={editedNote.title}
                            onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Note title"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-content-${note.id}`}>Content</Label>
                          <Textarea
                            id={`edit-content-${note.id}`}
                            value={editedNote.content}
                            onChange={(e) => setEditedNote(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Note content"
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`edit-tags-${note.id}`}>Tags</Label>
                            <Input
                              id={`edit-tags-${note.id}`}
                              value={editedNote.tags}
                              onChange={(e) => setEditedNote(prev => ({ ...prev, tags: e.target.value }))}
                              placeholder="comma, separated, tags"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-priority-${note.id}`}>Priority</Label>
                            <Select 
                              value={editedNote.priority} 
                              onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                                setEditedNote(prev => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger id={`edit-priority-${note.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-2">
                            <Button onClick={() => updateNote(note.id)} size="sm" className="flex-1">
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button onClick={() => setEditingNote(null)} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 mb-4">{note.content}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {note.author?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                            {note.tags && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {note.tags}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
