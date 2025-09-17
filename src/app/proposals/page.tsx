'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, FileText, Eye, Edit, Trash2, Send, Download, Share2, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  description: string;
  status: string;
  type: string;
  budget?: string;
  timeline?: string;
  content?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  template?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    title: string;
  };
}

interface AnalyticsSummary {
  totalProposals: number;
  sentProposals: number;
  acceptedProposals: number;
  viewedProposals: number;
  conversionRate: number;
  viewRate: number;
}

export default function ProposalsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Clock className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  const [search, setSearch] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchProposals();
    fetchAnalytics();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/summary');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProposals(proposals.filter(p => p.id !== id));
        setSelectedProposal(null);
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const getStatusBadge = (proposal: Proposal) => {
    if (proposal.isDraft) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    
    switch (proposal.status) {
      case 'sent':
        return <Badge variant="outline">Sent</Badge>;
      case 'viewed':
        return <Badge variant="default">Viewed</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{proposal.status}</Badge>;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(search.toLowerCase()) ||
      proposal.clientName.toLowerCase().includes(search.toLowerCase()) ||
      proposal.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'drafts' && proposal.isDraft) ||
      (activeTab === 'sent' && !proposal.isDraft && proposal.status === 'sent') ||
      (activeTab === 'accepted' && proposal.status === 'accepted') ||
      (activeTab === 'rejected' && proposal.status === 'rejected');
    
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAF9] p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF9] p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-600 mt-1">Manage and track your business proposals</p>
          </div>
          <Link href="/proposals/builder">
            <Button className="bg-[#7A8063] hover:bg-[#6B7059] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </Link>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProposals}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent Proposals</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.sentProposals}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">View Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.viewRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Proposals Table */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({proposals.length})</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({proposals.filter(p => p.isDraft).length})</TabsTrigger>
                <TabsTrigger value="sent">Sent ({proposals.filter(p => !p.isDraft && p.status === 'sent').length})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({proposals.filter(p => p.status === 'accepted').length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({proposals.filter(p => p.status === 'rejected').length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Budget</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.length > 0 ? (
                    filteredProposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{proposal.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {proposal.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{proposal.clientName}</div>
                            {proposal.clientEmail && (
                              <div className="text-sm text-gray-500">{proposal.clientEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(proposal)}
                        </td>
                        <td className="p-3">
                          {proposal.budget ? `$${proposal.budget}` : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {formatDate(proposal.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProposal(proposal)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Link href={`/proposals/builder?edit=${proposal.id}`}>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProposal(proposal.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No proposals found</p>
                        <p className="text-sm">Create your first proposal to get started</p>
                        <Link href="/proposals/builder" className="inline-block mt-4">
                          <Button className="bg-[#7A8063] hover:bg-[#6B7059] text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Proposal
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Details Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedProposal?.title}</span>
              <div className="flex items-center gap-2">
                {selectedProposal && getStatusBadge(selectedProposal)}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-6">
              {/* Proposal Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Client:</span>
                  <p>{selectedProposal.clientName}</p>
                  {selectedProposal.clientEmail && (
                    <p className="text-gray-500">{selectedProposal.clientEmail}</p>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Budget:</span>
                  <p>{selectedProposal.budget ? `$${selectedProposal.budget}` : 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Timeline:</span>
                  <p>{selectedProposal.timeline || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="capitalize">{selectedProposal.type}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Proposal Content */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Description</h4>
                <p className="text-sm text-gray-600 mb-4">{selectedProposal.description}</p>
                
                {selectedProposal.content && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Generated Content</h4>
                    <ScrollArea className="h-64 w-full border rounded-lg p-4">
                      <div className="prose max-w-none text-sm">
                        <div 
                          className="whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: selectedProposal.content }}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created: {formatDate(selectedProposal.createdAt)}
                  {selectedProposal.sentAt && (
                    <span className="ml-4">Sent: {formatDate(selectedProposal.sentAt)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Link href={`/proposals/builder?edit=${selectedProposal.id}`}>
                    <Button size="sm" className="bg-[#7A8063] hover:bg-[#6B7059] text-white">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}