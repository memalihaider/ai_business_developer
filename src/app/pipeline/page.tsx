'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { 
  Plus, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Types
interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  industry?: string;
  location?: string;
  tags?: string[];
  status: string;
  leadScore: number;
  createdAt: string;
  updatedAt: string;
  deals?: Deal[];
  _count?: {
    deals: number;
  };
}

interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  contactId?: string;
  leadId?: string;
  contact?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
  lead?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  activities?: DealActivity[];
  createdAt: string;
  updatedAt: string;
}

interface DealActivity {
  id: string;
  type: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  avgDealSize: number;
  conversionRate: number;
  stageStats: Record<string, { count: number; value: number }>;
}

const DEFAULT_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

const STAGE_LABELS = {
  'lead': 'Lead',
  'qualified': 'Qualified',
  'proposal': 'Proposal',
  'negotiation': 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost'
};

const STAGE_COLORS = {
  'lead': 'bg-gray-100 text-gray-800 border-gray-200',
  'qualified': 'bg-blue-100 text-blue-800 border-blue-200',
  'proposal': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
  'closed-won': 'bg-green-100 text-green-800 border-green-200',
  'closed-lost': 'bg-red-100 text-red-800 border-red-200'
};

const PRIORITY_COLORS = {
  'low': 'bg-gray-100 text-gray-700',
  'medium': 'bg-blue-100 text-blue-700',
  'high': 'bg-orange-100 text-orange-700',
  'urgent': 'bg-red-100 text-red-700'
};

export default function PipelinePage() {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages] = useState<string[]>(DEFAULT_STAGES);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isDealsLoading, setIsDealsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [newDeal, setNewDeal] = useState<Partial<Deal>>({});
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  // API Functions
  const fetchDeals = useCallback(async () => {
    try {
      setIsDealsLoading(true);
      setError(null);
      const response = await fetch('/api/deals');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch deals`);
      }
      const data = await response.json();
      setDeals(Array.isArray(data.deals) ? data.deals : []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load deals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDealsLoading(false);
    }
  }, []);

  // Optimistic deal creation
  const createDealOptimistic = async (dealData: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticDeal = {
      id: tempId,
      ...dealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contact: dealData.contactId ? contacts.find(c => c.id === dealData.contactId) : null,
      lead: null,
      activities: []
    };

    // Add optimistically
    setDeals(prev => [...prev, optimisticDeal]);
    toast.success('Deal created!');

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData)
      });

      if (!response.ok) throw new Error('Failed to create deal');
      const data = await response.json();
      const newDeal = data.deal;
      
      // Replace optimistic deal with real deal
      setDeals(prev => prev.map(deal => 
        deal.id === tempId ? newDeal : deal
      ));
    } catch (error) {
      // Remove optimistic deal on error
      setDeals(prev => prev.filter(deal => deal.id !== tempId));
      toast.error('Failed to create deal');
      console.error('Error creating deal:', error);
    }
  };

  // Optimistic deal update
  const updateDealOptimistic = async (dealId: string, updates: any) => {
    const originalDeal = deals.find(d => d.id === dealId);
    if (!originalDeal) return;

    // Update optimistically
    setDeals(prev => prev.map(deal => 
      deal.id === dealId 
        ? { ...deal, ...updates, updatedAt: new Date().toISOString() }
        : deal
    ));
    toast.success('Deal updated!');

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update deal');
      const data = await response.json();
      const updatedDeal = data.deal;
      
      // Replace with server response
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? updatedDeal : deal
      ));
    } catch (error) {
      // Revert on error
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? originalDeal : deal
      ));
      toast.error('Failed to update deal');
      console.error('Error updating deal:', error);
    }
  };

  // Optimistic deal deletion
  const deleteDealOptimistic = async (dealId: string) => {
    const dealToDelete = deals.find(d => d.id === dealId);
    if (!dealToDelete) return;

    // Remove optimistically
    setDeals(prev => prev.filter(deal => deal.id !== dealId));
    toast.success('Deal deleted!');

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete deal');
    } catch (error) {
      // Restore on error
      setDeals(prev => [...prev, dealToDelete]);
      toast.error('Failed to delete deal');
      console.error('Error deleting deal:', error);
    }
  };

  const fetchContacts = useCallback(async () => {
    try {
      setIsContactsLoading(true);
      setError(null);
      const response = await fetch('/api/contacts');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch contacts`);
      }
      const data = await response.json();
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsContactsLoading(false);
    }
  }, []);

  const createDeal = async (dealData: Partial<Deal>) => {
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });
      if (!response.ok) throw new Error('Failed to create deal');
      const data = await response.json();
      setDeals(prev => [data.deal, ...prev]);
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
      return data.deal;
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create deal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateDeal = async (dealId: string, dealData: Partial<Deal>) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });
      if (!response.ok) throw new Error('Failed to update deal');
      const data = await response.json();
      setDeals(prev => prev.map(deal => deal.id === dealId ? data.deal : deal));
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
      return data.deal;
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update deal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createContact = async (contactData: Partial<Contact>) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to create contact';
        throw new Error(errorMessage);
      }
      
      const contact = await response.json();
      setContacts(prev => [contact, ...prev]);
      toast.success('Contact created successfully');
      return contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDeals(), fetchContacts()]);
      setIsLoading(false);
    };
    loadData();

    // Set up real-time polling for updates
    const interval = setInterval(() => {
      fetchDeals();
      fetchContacts();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchDeals, fetchContacts]);

  // Auto-refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchDeals();
      fetchContacts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDeals, fetchContacts]);

  // Calculate stats
  useEffect(() => {
    if (deals.length > 0) {
      const totalDeals = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
      const avgDealSize = totalValue / totalDeals;
      const closedWonDeals = deals.filter(deal => deal.stage === 'closed-won').length;
      const conversionRate = (closedWonDeals / totalDeals) * 100;
      
      const stageStats = stages.reduce((acc, stage) => {
        const stageDeals = deals.filter(deal => deal.stage === stage);
        acc[stage] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      setStats({
        totalDeals,
        totalValue,
        avgDealSize,
        conversionRate,
        stageStats
      });
    }
  }, [deals, stages]);

  // Drag and drop handler
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const deal = deals.find(d => d.id === draggableId);
    if (!deal) return;

    const newStage = destination.droppableId;
    
    await updateDealOptimistic(deal.id, { stage: newStage });
  };

  // Form validation
  const validateDealForm = (deal: any) => {
    const errors: string[] = [];
    
    if (!deal.title?.trim()) errors.push('Deal title is required');
    if (!deal.contactId) errors.push('Contact selection is required');
    if (deal.value && (isNaN(deal.value) || deal.value < 0)) errors.push('Deal value must be a positive number');
    if (deal.probability && (isNaN(deal.probability) || deal.probability < 0 || deal.probability > 100)) {
      errors.push('Probability must be between 0 and 100');
    }
    if (deal.title && deal.title.length > 100) errors.push('Deal title must be less than 100 characters');
    if (deal.description && deal.description.length > 500) errors.push('Description must be less than 500 characters');
    
    return errors;
  };

  const validateContactForm = (contact: any) => {
    const errors: string[] = [];
    
    if (!contact.firstName?.trim()) errors.push('First name is required');
    if (!contact.lastName?.trim()) errors.push('Last name is required');
    if (!contact.email?.trim()) errors.push('Email is required');
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.push('Please enter a valid email address');
    }
    if (contact.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(contact.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    return errors;
  };

  // Form handlers with validation
  const handleCreateDeal = async () => {
    const validationErrors = validateDealForm(newDeal);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    const dealData = {
      ...newDeal,
      stage: newDeal.stage || 'lead',
      priority: newDeal.priority || 'medium',
      value: newDeal.value || 0,
      currency: newDeal.currency || 'USD',
      probability: newDeal.probability || 0,
    };

    await createDealOptimistic(dealData);
    setNewDeal({});
    setIsDealDialogOpen(false);
  };

  const handleCreateContact = async () => {
    const validationErrors = validateContactForm(newContact);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      await createContact({
        ...newContact,
        status: newContact.status || 'active',
        leadScore: newContact.leadScore || 0,
      });
      setNewContact({});
      setIsContactDialogOpen(false);
    } catch (error) {
      // Error handled in createContact
    }
  };

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchQuery || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contact?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contact?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contact?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || deal.priority === selectedPriority;
    const matchesSource = selectedSource === 'all' || deal.source === selectedSource;
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    
    const matchesValueRange = (() => {
      const min = minValue ? parseFloat(minValue) : 0;
      const max = maxValue ? parseFloat(maxValue) : Infinity;
      return deal.value >= min && deal.value <= max;
    })();
    
    const matchesDateRange = (() => {
      if (dateRange === 'all') return true;
      const dealDate = new Date(deal.createdAt);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          return dealDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return dealDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return dealDate >= monthAgo;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return dealDate >= quarterAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesPriority && matchesSource && matchesStage && matchesValueRange && matchesDateRange;
  });

  const getContactName = (contact?: { firstName?: string; lastName?: string; email: string }) => {
    if (!contact) return 'Unknown';
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.email;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-12" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-32" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">Manage your deals and track progress</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Users className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Create a new contact for your pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newContact.firstName || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newContact.lastName || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newContact.phone || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newContact.company || ''}
                      onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={newContact.jobTitle || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContact} disabled={isContactsLoading}>
                  {isContactsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Deal</DialogTitle>
                <DialogDescription>
                  Create a new deal in your pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Deal Title *</Label>
                  <Input
                    id="title"
                    value={newDeal.title || ''}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDeal.description || ''}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newDeal.value || ''}
                      onChange={(e) => setNewDeal(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={newDeal.probability || ''}
                      onChange={(e) => setNewDeal(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={newDeal.stage || 'lead'} onValueChange={(value) => setNewDeal(prev => ({ ...prev, stage: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map(stage => (
                          <SelectItem key={stage} value={stage}>
                            {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newDeal.priority || 'medium'} onValueChange={(value) => setNewDeal(prev => ({ ...prev, priority: value as Deal['priority'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="contactId">Contact</Label>
                  <Select value={newDeal.contactId || ''} onValueChange={(value) => setNewDeal(prev => ({ ...prev, contactId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {getContactName(contact)} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={newDeal.expectedCloseDate || ''}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeal} disabled={isDealsLoading}>
                  {isDealsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Deal'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => {
                setError(null);
                fetchDeals();
                fetchContacts();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(stats.avgDealSize).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deals by title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed-won">Closed Won</SelectItem>
              <SelectItem value="closed-lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="cold_call">Cold Call</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Min value"
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-24"
            />
            <span className="text-gray-400">-</span>
            <Input
              placeholder="Max value"
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-24"
            />
          </div>
          
          {/* Clear Filters Button */}
          {(searchQuery || selectedStage !== 'all' || selectedPriority !== 'all' || selectedSource !== 'all' || dateRange !== 'all' || minValue || maxValue) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedStage('all');
                setSelectedPriority('all');
                setSelectedSource('all');
                setDateRange('all');
                setMinValue('');
                setMaxValue('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col">
              <div className="p-3 rounded-t-lg border-b-2 bg-gray-100">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-6" />
                </div>
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
              <div className="flex-1 p-2 min-h-[200px] bg-gray-50 rounded-b-lg">
                {Array.from({ length: 2 }).map((_, cardIndex) => (
                  <div key={cardIndex} className="mb-2 p-3 bg-white rounded-lg border">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stages.map((stage) => {
              const stageDeals = filteredDeals.filter(deal => deal.stage === stage);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
              
              return (
                <div key={stage} className="flex flex-col">
                  <div className={cn(
                    "p-3 rounded-t-lg border-b-2",
                    STAGE_COLORS[stage as keyof typeof STAGE_COLORS]
                  )}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <p className="text-xs mt-1 opacity-75">
                      ${stageValue.toLocaleString()}
                    </p>
                  </div>
                
                  <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-2 min-h-[200px] bg-gray-50 rounded-b-lg transition-colors",
                        snapshot.isDraggingOver && "bg-blue-50"
                      )}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "mb-2 cursor-move transition-shadow hover:shadow-md",
                                snapshot.isDragging && "shadow-lg rotate-2"
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm line-clamp-2">
                                    {deal.title}
                                  </h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => deleteDealOptimistic(deal.id)}
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-green-600">
                                      ${deal.value.toLocaleString()}
                                    </span>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-xs",
                                        PRIORITY_COLORS[deal.priority]
                                      )}
                                    >
                                      {deal.priority}
                                    </Badge>
                                  </div>
                                  
                                  {deal.contact && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">
                                          {getContactName(deal.contact).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {getContactName(deal.contact)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {deal.contact?.company && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Building className="h-3 w-3" />
                                      <span className="truncate">{deal.contact.company}</span>
                                    </div>
                                  )}
                                  
                                  {deal.expectedCloseDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  
                                  {deal.probability > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Target className="h-3 w-3" />
                                      <span>{deal.probability}% probability</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

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
