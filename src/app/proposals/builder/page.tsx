'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Sparkles, 
  Save, 
  Send, 
  Eye, 
  Download, 
  Share2, 
  Plus, 
  Trash2, 
  Copy,
  Users,
  Clock,
  DollarSign,
  Target,
  Lightbulb,
  Edit,
  Calendar,
  User
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  content: string;
  sections: string;
  isPopular: boolean;
  usageCount: number;
}

interface CustomSection {
  id: string;
  title: string;
  content: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  value?: string;
}

export default function ProposalBuilderPage() {
  // Form state
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState('service');
  
  // New enhanced state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const [statistics, setStatistics] = useState({
    averageTime: '5 min',
    successRate: '87%',
    templateCount: 0
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  // Past Proposals state
  const [pastProposals, setPastProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);

  // Load templates, leads, statistics, and past proposals on component mount
   useEffect(() => {
     loadTemplates();
     loadLeads();
     fetchStatistics();
     loadPastProposals();
     
     // Set up interval to refresh statistics every 30 seconds
     const statsInterval = setInterval(fetchStatistics, 30000);
     
     return () => clearInterval(statsInterval);
   }, []);

  // Update progress based on form completion
  useEffect(() => {
    const fields = [title, clientName, description, timeline, budget];
    const filledFields = fields.filter(field => field.trim() !== '').length;
    setProgress((filledFields / fields.length) * 100);
  }, [title, clientName, description, timeline, budget]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const response = await fetch('/api/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          averageTime: data.averageTime,
          successRate: data.successRate,
          templateCount: data.templateCount
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const loadPastProposals = async () => {
    setLoadingProposals(true);
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setPastProposals(data);
      }
    } catch (error) {
      console.error('Failed to load past proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleEditProposal = (proposal: any) => {
    setEditingProposal(proposal);
    setTitle(proposal.title);
    setClientName(proposal.clientName);
    setClientEmail(proposal.clientEmail || '');
    setClientPhone(proposal.clientPhone || '');
    setDescription(proposal.description);
    setTimeline(proposal.timeline || '');
    setBudget(proposal.budget || '');
    setType(proposal.type);
    setGeneratedProposal(proposal.content || '');
    if (proposal.sections) {
      try {
        const sections = JSON.parse(proposal.sections);
        setCustomSections(sections);
      } catch (e) {
        console.error('Error parsing sections:', e);
      }
    }
  };

  const handleUpdateProposal = async () => {
    if (!editingProposal) return;
    
    try {
      const response = await fetch(`/api/proposals/${editingProposal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          clientName,
          clientEmail,
          clientPhone,
          description,
          timeline,
          budget,
          type,
          content: generatedProposal,
          sections: customSections.filter(s => s.title && s.content),
          isDraft: true
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Proposal updated successfully!', type: 'success' });
        setEditingProposal(null);
        loadPastProposals();
        handleClear();
      } else {
        setMessage({ text: 'Failed to update proposal', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while updating', type: 'error' });
    }
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ text: 'Proposal deleted successfully!', type: 'success' });
        loadPastProposals();
        setShowDeleteDialog(false);
        setProposalToDelete(null);
      } else {
        setMessage({ text: 'Failed to delete proposal', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while deleting', type: 'error' });
    }
  };

  const confirmDelete = (id: string) => {
    setProposalToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleClear = () => {
    setTitle('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setDescription('');
    setTimeline('');
    setBudget('');
    setType('service');
    setSelectedTemplate(null);
    setCustomSections([]);
    setSelectedLead(null);
    setGeneratedProposal('');
    setShowPreview(false);
    setCurrentStep(1);
    setEditingProposal(null);
    setMessage({ text: '', type: '' });
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setClientName(lead.name);
    setClientEmail(lead.email);
    if (lead.company) {
      setTitle(`Proposal for ${lead.company}`);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (!title && template.name) {
      setTitle(`${template.name} - ${clientName || 'Client'}`);
    }
  };

  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: Date.now().toString(),
      title: '',
      content: ''
    };
    setCustomSections([...customSections, newSection]);
  };

  const updateCustomSection = (id: string, field: 'title' | 'content', value: string) => {
    setCustomSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(sections => sections.filter(section => section.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !clientName || !description) {
      setMessage({ text: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/generateProposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          clientName,
          clientEmail,
          clientPhone,
          description,
          timeline,
          budget,
          type,
          templateId: selectedTemplate?.id,
          leadId: selectedLead?.id,
          customSections: customSections.filter(s => s.title && s.content)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedProposal(data.content);
        setMessage({ 
          text: `Proposal generated successfully using ${data.aiProvider}!`, 
          type: 'success' 
        });
        setShowPreview(true);
        setCurrentStep(4);
      } else {
        setMessage({ text: data.error || 'Failed to generate proposal', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while generating the proposal', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          clientName,
          clientEmail,
          clientPhone,
          description,
          timeline,
          budget,
          type,
          content: generatedProposal,
          sections: customSections.filter(s => s.title && s.content),
          templateId: selectedTemplate?.id,
          leadId: selectedLead?.id,
          isDraft: true
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to save draft', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while saving', type: 'error' });
    }
  };

  const handleSendProposal = async () => {
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          clientName,
          clientEmail,
          clientPhone,
          description,
          timeline,
          budget,
          type,
          content: generatedProposal,
          sections: customSections.filter(s => s.title && s.content),
          templateId: selectedTemplate?.id,
          leadId: selectedLead?.id,
          isDraft: false,
          status: 'sent',
          sentAt: new Date()
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Proposal sent successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to send proposal', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while sending', type: 'error' });
    }
  };

  // Export PDF functionality
  const handleExportPDF = () => {
    if (!generatedProposal) {
      setMessage({ text: 'Please generate a proposal first', type: 'error' });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Set up the document
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(title || 'Business Proposal', 20, 30);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Client: ${clientName}`, 20, 50);
      if (clientEmail) doc.text(`Email: ${clientEmail}`, 20, 60);
      if (budget) doc.text(`Budget: ${budget}`, 20, 70);
      if (timeline) doc.text(`Timeline: ${timeline}`, 20, 80);
      
      // Add proposal content
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(generatedProposal, 170);
      doc.text(splitText, 20, 100);
      
      // Save the PDF
      const fileName = `${title || 'proposal'}_${clientName || 'client'}.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(fileName);
      
      setMessage({ text: 'PDF exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setMessage({ text: 'Failed to export PDF', type: 'error' });
    }
  };

  // Copy text functionality
  const handleCopyText = async () => {
    if (!generatedProposal) {
      setMessage({ text: 'Please generate a proposal first', type: 'error' });
      return;
    }

    try {
      const proposalText = `${title}\n\nClient: ${clientName}\n${clientEmail ? `Email: ${clientEmail}\n` : ''}${budget ? `Budget: ${budget}\n` : ''}${timeline ? `Timeline: ${timeline}\n` : ''}\n${description}\n\n${generatedProposal}`;
      
      await navigator.clipboard.writeText(proposalText);
      setMessage({ text: 'Proposal copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Error copying text:', error);
      setMessage({ text: 'Failed to copy text', type: 'error' });
    }
  };

  // Share link functionality
  const handleShareLink = async () => {
    if (!generatedProposal) {
      setMessage({ text: 'Please generate a proposal first', type: 'error' });
      return;
    }

    try {
      // First save as draft to get a shareable ID
      const proposalData = {
        title,
        clientName,
        clientEmail,
        clientPhone,
        description,
        timeline,
        budget,
        type,
        content: generatedProposal,
        sections: customSections.filter(s => s.title && s.content),
        templateId: selectedTemplate?.id,
        leadId: selectedLead?.id,
        isDraft: true
      };

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData)
      });

      if (response.ok) {
        const result = await response.json();
        const shareUrl = `${window.location.origin}/proposals/view/${result.id}`;
        
        await navigator.clipboard.writeText(shareUrl);
        setMessage({ text: 'Share link copied to clipboard!', type: 'success' });
      } else {
        throw new Error('Failed to create shareable link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      setMessage({ text: 'Failed to create share link', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                AI Proposal Builder
              </h1>
              <p className="text-gray-600 mt-2">
                Create professional proposals with AI assistance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                Step {currentStep} of 4
              </Badge>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="1" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="2" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="3" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Customize
                </TabsTrigger>
                <TabsTrigger value="4" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="5" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Past Proposals
                </TabsTrigger>
              </TabsList>

              {/* Step 1: Client Information */}
              <TabsContent value="1" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Client Information
                    </CardTitle>
                    <CardDescription>
                      Select an existing lead or enter new client details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Lead Selection */}
                    {leads.length > 0 && (
                      <div>
                        <Label>Select from existing leads</Label>
                        <Select onValueChange={(value) => {
                          const lead = leads.find(l => l.id === value);
                          if (lead) handleLeadSelect(lead);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a lead" />
                          </SelectTrigger>
                          <SelectContent>
                            {leads.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{lead.name}</span>
                                  {lead.company && (
                                    <span className="text-sm text-gray-500 ml-2">
                                      {lead.company}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientName">Client Name *</Label>
                        <Input
                          id="clientName"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Enter client name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="client@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientPhone">Phone</Label>
                        <Input
                          id="clientPhone"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Proposal Title *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter proposal title"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setCurrentStep(2)}>
                        Next: Project Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Step 2: Project Details */}
              <TabsContent value="2" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Project Details
                    </CardTitle>
                    <CardDescription>
                      Provide comprehensive project information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="description">Project Description *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the project scope, objectives, and deliverables..."
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="timeline">Timeline</Label>
                        <Input
                          id="timeline"
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          placeholder="e.g., 2-3 months"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget">Budget Range</Label>
                        <Input
                          id="budget"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="e.g., $5,000 - $10,000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Proposal Type</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Service Proposal</SelectItem>
                            <SelectItem value="quotation">Quotation</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="consulting">Consulting</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Previous
                      </Button>
                      <Button onClick={() => setCurrentStep(3)}>
                        Next: Customize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Step 3: Customization */}
              <TabsContent value="3" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Customize Your Proposal
                    </CardTitle>
                    <CardDescription>
                      Add custom sections and select templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Template Selection */}
                    {templates.length > 0 && (
                      <div>
                        <Label>Choose a Template (Optional)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {templates.slice(0, 4).map((template) => (
                            <div
                              key={template.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedTemplate?.id === template.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{template.name}</h4>
                                {template.isPopular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              {template.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Custom Sections */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Custom Sections</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addCustomSection}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Section
                        </Button>
                      </div>

                      {customSections.map((section) => (
                        <div key={section.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Input
                              value={section.title}
                              onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                              placeholder="Section title"
                              className="flex-1 mr-2"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={section.content}
                            onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)}
                            placeholder="Section content"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Previous
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Proposal
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Step 4: Preview */}
              <TabsContent value="4" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Proposal Preview
                    </CardTitle>
                    <CardDescription>
                      Review and finalize your proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedProposal ? (
                      <div className="space-y-4">
                        <ScrollArea className="h-96 w-full border rounded-lg p-4">
                          <div className="prose max-w-none">
                            <div className="whitespace-pre-line text-sm">
                              {generatedProposal}
                            </div>
                          </div>
                        </ScrollArea>

                        <div className="flex justify-between items-center pt-4">
                          <div className="flex gap-2">
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
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSaveDraft}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button onClick={handleSendProposal}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Proposal
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Generate your proposal to see the preview
                        </p>
                        <Button 
                          className="mt-4" 
                          onClick={() => setCurrentStep(3)}
                        >
                          Go Back to Generate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Step 5: Past Proposals */}
              <TabsContent value="5" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Past Proposals
                    </CardTitle>
                    <CardDescription>
                      View, edit, and manage your existing proposals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingProposals ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading proposals...</p>
                      </div>
                    ) : pastProposals.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No proposals found</p>
                        <Button onClick={() => setCurrentStep(1)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Proposal
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {pastProposals.length} proposal{pastProposals.length !== 1 ? 's' : ''} found
                          </p>
                          <Button onClick={() => setCurrentStep(1)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Proposal
                          </Button>
                        </div>
                        
                        <div className="grid gap-4">
                          {pastProposals.map((proposal) => (
                            <div key={proposal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{proposal.title}</h3>
                                    <Badge variant={proposal.isDraft ? 'secondary' : 'default'}>
                                      {proposal.isDraft ? 'Draft' : proposal.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>{proposal.clientName}</span>
                                      {proposal.clientEmail && (
                                        <span className="text-gray-400">• {proposal.clientEmail}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>Created {new Date(proposal.createdAt).toLocaleDateString()}</span>
                                      {proposal.budget && (
                                        <span className="text-gray-400">• Budget: {proposal.budget}</span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                    {proposal.description}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditProposal(proposal)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => confirmDelete(proposal.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {editingProposal && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-blue-900">
                                Editing: {editingProposal.title}
                              </h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingProposal(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateProposal}
                                >
                                  Update Proposal
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-blue-700">
                              Switch to other tabs to edit the proposal details, then come back here to save your changes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Form Completion</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${
                      title && clientName ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        title && clientName ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                      Client Information
                    </div>
                    <div className={`flex items-center gap-2 ${
                      description ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        description ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                      Project Details
                    </div>
                    <div className={`flex items-center gap-2 ${
                      generatedProposal ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        generatedProposal ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                      Generated Proposal
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Form
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>

              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Avg. Time</span>
                  </div>
                  <span className="font-medium">{statistics.averageTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Success Rate</span>
                  </div>
                  <span className="font-medium">{statistics.successRate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Templates</span>
                  </div>
                  <span className="font-medium">{statistics.templateCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message Display */}
         {message.text && (
           <div className={`mt-6 p-4 rounded-lg ${
             message.type === 'error' 
               ? 'bg-red-50 border border-red-200 text-red-800'
               : 'bg-green-50 border border-green-200 text-green-800'
           }`}>
             <p className="font-medium">{message.text}</p>
           </div>
         )}
       </div>

       {/* Delete Confirmation Dialog */}
       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Delete Proposal</DialogTitle>
             <DialogDescription>
               Are you sure you want to delete this proposal? This action cannot be undone.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => {
                 setShowDeleteDialog(false);
                 setProposalToDelete(null);
               }}
             >
               Cancel
             </Button>
             <Button
               variant="destructive"
               onClick={() => {
                 if (proposalToDelete) {
                   handleDeleteProposal(proposalToDelete);
                 }
               }}
             >
               Delete
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }
