"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Filter, Download, Eye, TrendingUp, TrendingDown, Calendar, DollarSign, FileText, Users, BarChart3, PieChart, Activity, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Toaster } from "sonner";
import jsPDF from "jspdf";
import { useRealTimeProposals } from "@/hooks/useRealTimeProposals";

type Proposal = {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  timeline?: string;
  budget?: string;
  type: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  content?: string;
  sections?: string;
  templateId?: string;
  leadId?: string;
  isDraft: boolean;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type AnalyticsSummary = {
  totalProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  pendingProposals: number;
  conversionRate: number;
  totalValue: number;
  recentActivity: any[];
  monthlyTrends: any[];
};

function StatusBadge({ status }: { status: Proposal["status"] }) {
  const variants = {
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    sent: "bg-blue-100 text-blue-800 border-blue-200",
    draft: "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  return (
    <Badge className={`${variants[status]} capitalize font-medium`}>
      {status}
    </Badge>
  );
}

function MetricCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600"
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center text-sm ${trendColors[trend || 'neutral']}`}>
                {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                {change}
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-full">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleChart({ data, type = "bar" }: { data: any[]; type?: "bar" | "line" }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        <BarChart3 className="w-8 h-8 mr-2" />
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <Progress 
            value={(item.value / maxValue) * 100} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}

export default function ProposalTrackingPage() {
  const { proposals, analytics, loading, error, lastUpdated, refreshData } = useRealTimeProposals();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Proposal] || "";
      const bValue = b[sortBy as keyof Proposal] || "";
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate metrics
  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter(p => p.status === "accepted").length;
  const rejectedProposals = proposals.filter(p => p.status === "rejected").length;
  const sentProposals = proposals.filter(p => p.status === "sent").length;
  const draftProposals = proposals.filter(p => p.status === "draft").length;
  const conversionRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;

  // Generate chart data
  const statusChartData = [
    { label: "Accepted", value: acceptedProposals },
    { label: "Sent", value: sentProposals },
    { label: "Draft", value: draftProposals },
    { label: "Rejected", value: rejectedProposals }
  ];

  const typeChartData = proposals.reduce((acc, p) => {
    const existing = acc.find(item => item.label === p.type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ label: p.type, value: 1 });
    }
    return acc;
  }, [] as { label: string; value: number }[]);

  // Export functions
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Proposal Tracking Report", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    
    // Summary
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Proposals: ${totalProposals}`, 14, 60);
    doc.text(`Accepted: ${acceptedProposals}`, 14, 70);
    doc.text(`Sent: ${sentProposals}`, 14, 80);
    doc.text(`Draft: ${draftProposals}`, 14, 90);
    doc.text(`Rejected: ${rejectedProposals}`, 14, 100);
    doc.text(`Conversion Rate: ${conversionRate}%`, 14, 110);
    
    // Proposals list
    doc.setFont("helvetica", "bold");
    doc.text("Proposals:", 14, 130);
    doc.setFont("helvetica", "normal");
    
    filteredProposals.slice(0, 20).forEach((p, idx) => {
      const y = 145 + idx * 10;
      doc.text(`${p.id} | ${p.clientName} | ${p.title} | ${p.status}`, 14, y);
    });
    
    doc.save("proposal-tracking-report.pdf");
  };

  const downloadCSV = () => {
    const headers = ["ID", "Title", "Client", "Status", "Type", "Created", "Updated"];
    const csvContent = [
      headers.join(","),
      ...filteredProposals.map(p => [
        p.id,
        `"${p.title}"`,
        `"${p.clientName}"`,
        p.status,
        p.type,
        new Date(p.createdAt).toLocaleDateString(),
        new Date(p.updatedAt).toLocaleDateString()
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proposals.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
          <p className="text-gray-600">Loading proposal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Proposal Tracking & Analytics</h1>
            <p className="text-gray-600">Monitor proposal performance and analyze conversion metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={refreshData} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Select onValueChange={downloadPDF}>
              <SelectTrigger className="w-40">
                <Download className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf" onClick={downloadPDF}>PDF Report</SelectItem>
                <SelectItem value="csv" onClick={downloadCSV}>CSV Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Proposals"
            value={totalProposals}
            icon={FileText}
            change="+12% from last month"
            trend="up"
          />
          <MetricCard
            title="Accepted"
            value={acceptedProposals}
            icon={TrendingUp}
            change={`${conversionRate}% conversion rate`}
            trend="up"
          />
          <MetricCard
            title="Pending"
            value={sentProposals}
            icon={Activity}
            change="Awaiting response"
            trend="neutral"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={BarChart3}
            change="+5% from last month"
            trend="up"
          />
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Proposal Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={statusChartData} type="bar" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Proposal Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={typeChartData} type="bar" />
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search proposals by title, client, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="clientName-asc">Client A-Z</SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Proposals ({filteredProposals.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.length > 0 ? (
                    filteredProposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-mono text-sm text-gray-600">{proposal.id.slice(0, 8)}</td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{proposal.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{proposal.description}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{proposal.clientName}</div>
                          {proposal.clientEmail && (
                            <div className="text-sm text-gray-500">{proposal.clientEmail}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="capitalize">{proposal.type}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={proposal.status} />
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProposal(proposal)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No proposals found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Proposal Details Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Proposal Details
            </DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProposal.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client</label>
                    <p className="text-gray-900">{selectedProposal.clientName}</p>
                    {selectedProposal.clientEmail && (
                      <p className="text-sm text-gray-600">{selectedProposal.clientEmail}</p>
                    )}
                    {selectedProposal.clientPhone && (
                      <p className="text-sm text-gray-600">{selectedProposal.clientPhone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <StatusBadge status={selectedProposal.status} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="capitalize">{selectedProposal.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900">{new Date(selectedProposal.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-900">{new Date(selectedProposal.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedProposal.description}</p>
                </div>
              </div>

              {/* Timeline and Budget */}
              {(selectedProposal.timeline || selectedProposal.budget) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedProposal.timeline && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Timeline</label>
                      <p className="text-gray-900 mt-1">{selectedProposal.timeline}</p>
                    </div>
                  )}
                  {selectedProposal.budget && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Budget</label>
                      <p className="text-gray-900 mt-1">{selectedProposal.budget}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Activity Timeline</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Proposal Created</p>
                      <p className="text-xs text-blue-700">{new Date(selectedProposal.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedProposal.sentAt && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Proposal Sent</p>
                        <p className="text-xs text-yellow-700">{new Date(selectedProposal.sentAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.viewedAt && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">Proposal Viewed</p>
                        <p className="text-xs text-purple-700">{new Date(selectedProposal.viewedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.acceptedAt && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Proposal Accepted</p>
                        <p className="text-xs text-green-700">{new Date(selectedProposal.acceptedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.rejectedAt && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-red-900">Proposal Rejected</p>
                        <p className="text-xs text-red-700">{new Date(selectedProposal.rejectedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
       
       {/* Toast Notifications */}
       <Toaster 
         position="top-right" 
         expand={true}
         richColors
         closeButton
       />
     </div>
   );
 }
