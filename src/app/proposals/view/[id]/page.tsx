'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Copy, Share2, Calendar, DollarSign, User, Mail, Phone } from 'lucide-react';
import jsPDF from 'jspdf';

interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  timeline?: string;
  budget?: string;
  type: string;
  content?: string;
  status: string;
  createdAt: string;
  template?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    title: string;
  };
}

export default function ProposalViewPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (params.id) {
      fetchProposal(params.id as string);
    }
  }, [params.id]);

  const fetchProposal = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data);
      } else {
        setError('Proposal not found');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setError('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!proposal) return;

    try {
      const doc = new jsPDF();
      
      // Set up the document
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(proposal.title || 'Business Proposal', 20, 30);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Client: ${proposal.clientName}`, 20, 50);
      if (proposal.clientEmail) doc.text(`Email: ${proposal.clientEmail}`, 20, 60);
      if (proposal.budget) doc.text(`Budget: $${proposal.budget}`, 20, 70);
      if (proposal.timeline) doc.text(`Timeline: ${proposal.timeline}`, 20, 80);
      
      // Add proposal content
      doc.setFontSize(10);
      const content = proposal.content || proposal.description;
      const splitText = doc.splitTextToSize(content, 170);
      doc.text(splitText, 20, 100);
      
      // Save the PDF
      const fileName = `${proposal.title || 'proposal'}_${proposal.clientName || 'client'}.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(fileName);
      
      setMessage({ text: 'PDF exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setMessage({ text: 'Failed to export PDF', type: 'error' });
    }
  };

  const handleCopyText = async () => {
    if (!proposal) return;

    try {
      const proposalText = `${proposal.title}\n\nClient: ${proposal.clientName}\n${proposal.clientEmail ? `Email: ${proposal.clientEmail}\n` : ''}${proposal.budget ? `Budget: $${proposal.budget}\n` : ''}${proposal.timeline ? `Timeline: ${proposal.timeline}\n` : ''}\n${proposal.description}\n\n${proposal.content || ''}`;
      
      await navigator.clipboard.writeText(proposalText);
      setMessage({ text: 'Proposal copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Error copying text:', error);
      setMessage({ text: 'Failed to copy text', type: 'error' });
    }
  };

  const handleShareLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setMessage({ text: 'Share link copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Error copying share link:', error);
      setMessage({ text: 'Failed to copy share link', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      sent: { label: 'Sent', variant: 'default' as const },
      viewed: { label: 'Viewed', variant: 'outline' as const },
      accepted: { label: 'Accepted', variant: 'default' as const },
      rejected: { label: 'Rejected', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">{error || 'Proposal not found'}</p>
          <p className="text-gray-500">The proposal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                {proposal.title}
              </h1>
              <p className="text-gray-600 mt-2">
                Created on {formatDate(proposal.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(proposal.status)}
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Content</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded-lg p-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-line text-sm">
                      {proposal.content || proposal.description}
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyText}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareLink}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{proposal.clientName}</p>
                </div>
                {proposal.clientEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {proposal.clientEmail}
                  </div>
                )}
                {proposal.clientPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {proposal.clientPhone}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-600 capitalize">{proposal.type}</p>
                </div>
                {proposal.budget && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </p>
                    <p className="text-sm text-gray-600">${proposal.budget}</p>
                  </div>
                )}
                {proposal.timeline && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </p>
                    <p className="text-sm text-gray-600">{proposal.timeline}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            {(proposal.template || proposal.lead) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {proposal.template && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Template Used</p>
                      <p className="text-sm text-gray-600">{proposal.template.name}</p>
                    </div>
                  )}
                  {proposal.lead && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Related Lead</p>
                      <p className="text-sm text-gray-600">{proposal.lead.title}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}