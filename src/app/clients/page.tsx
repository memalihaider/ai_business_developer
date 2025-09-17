"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRealTimeClients, useRealTimeClientStats } from "@/hooks/useRealTimeData";
import { useDebounce, usePerformanceMonitor, useMemoizedFilter } from "@/lib/performance";
import { 
  Plus, 
  Search,
  AlertCircle, 
  Users, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  Edit, 
  Trash2, 
  MoreVertical,
  Filter,
  Download,
  Upload,
  Eye,
  UserPlus,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  Globe,
  Star,
  Heart,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  industry?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    name: string;
    status: string;
  };
}

interface NewClient {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  industry: string;
  notes: string;
  tags: string[];
  leadId?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Consulting",
  "Media",
  "Other"
];

const ClientCard = memo(({ client, onEdit, onDelete }: { 
  client: Client; 
  onEdit: (client: Client) => void; 
  onDelete: (id: string) => void; 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group h-full"
    >
      <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden h-full flex flex-col bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 overflow-hidden">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={`/avatar.jpg`} alt={client.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate leading-tight" title={client.name}>
                  {client.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 flex items-start mt-1.5 flex-wrap">
                  <Mail className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-500 mt-0.5" />
                  <span className="font-medium break-all" title={client.email}>{client.email}</span>
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-100 transition-all duration-200 hover:bg-gray-100 focus:bg-gray-100 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(client)} className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(client.id)} className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-grow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-2.5">
              {client.company && (
                <div className="flex items-center text-sm text-gray-700 min-w-0 py-0.5">
                  <Building className="h-3.5 w-3.5 mr-2.5 flex-shrink-0 text-blue-500" />
                  <span className="truncate font-medium" title={client.company}>{client.company}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-sm text-gray-700 min-w-0 py-0.5">
                  <Phone className="h-3.5 w-3.5 mr-2.5 flex-shrink-0 text-green-500" />
                  <span className="truncate font-medium" title={client.phone}>{client.phone}</span>
                </div>
              )}
              {client.industry && (
                <div className="flex items-center text-sm text-gray-700 min-w-0 py-0.5">
                  <Briefcase className="h-3.5 w-3.5 mr-2.5 flex-shrink-0 text-purple-500" />
                  <span className="truncate font-medium" title={client.industry}>{client.industry}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center text-sm text-gray-700 min-w-0 py-0.5">
                  <MapPin className="h-3.5 w-3.5 mr-2.5 flex-shrink-0 text-red-500" />
                  <span className="truncate font-medium" title={client.address}>{client.address}</span>
                </div>
              )}
            </div>
            
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {client.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap hover:bg-blue-100 transition-colors" title={tag}>
                    {tag.length > 12 ? `${tag.substring(0, 12)}...` : tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex-shrink-0 font-medium">
              Created {new Date(client.createdAt).toLocaleDateString()}
            </div>
            {client.lead && (
              <Badge variant="outline" className="text-xs whitespace-nowrap max-w-full hover:bg-blue-50 transition-colors" title={`From Lead: ${client.lead.name}`}>
                <span className="truncate">From Lead: {client.lead.name}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

ClientCard.displayName = 'ClientCard';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newClient, setNewClient] = useState<NewClient>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    industry: '',
    notes: '',
    tags: []
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: statsResponse, loading: statsLoading } = useRealTimeClientStats();
  const stats = statsResponse?.stats;
  
  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  // Search clients
  useEffect(() => {
    if (debouncedSearchTerm) {
      const searchClients = async () => {
        try {
          const response = await fetch(`/api/clients?q=${encodeURIComponent(debouncedSearchTerm)}`);
          if (!response.ok) throw new Error('Search failed');
          const data = await response.json();
          setClients(data.clients || []);
        } catch (error) {
          console.error('Search error:', error);
        }
      };
      searchClients();
    } else {
      fetchClients();
    }
  }, [debouncedSearchTerm, fetchClients]);
  
  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (selectedIndustry !== 'all' && client.industry !== selectedIndustry) {
        return false;
      }
      return true;
    });
  }, [clients, selectedIndustry]);
  
  // Validate form
  const validateForm = (data: NewClient): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    return newErrors;
  };
  
  // Handle create client
  const handleCreateClient = async () => {
    const formErrors = validateForm(newClient);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }
      
      toast.success('Client created successfully!');
      setIsCreateDialogOpen(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        industry: '',
        notes: '',
        tags: []
      });
      setTagInput('');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit client
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      industry: client.industry || '',
      notes: client.notes || '',
      tags: client.tags || []
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle update client
  const handleUpdateClient = async () => {
    if (!editingClient) return;
    
    const formErrors = validateForm(newClient);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }
      
      toast.success('Client updated successfully!');
      setIsEditDialogOpen(false);
      setEditingClient(null);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        industry: '',
        notes: '',
        tags: []
      });
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete client
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }
      
      toast.success('Client deleted successfully!');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  // Handle add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !newClient.tags.includes(tagInput.trim())) {
      setNewClient(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewClient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Client Management</h1>
              <p className="text-gray-600">Manage your clients and track their information</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Add a new client to your database
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={newClient.company}
                        onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={newClient.industry} onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newClient.notes}
                      onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {newClient.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateClient} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Create Client
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Clients</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalClients || clients.length}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Active client relationships
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">From Leads</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.clientsWithLeads || 0}
              </div>
              <p className="text-xs text-green-600 mt-1">
                Converted from leads
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Industries</CardTitle>
              <Briefcase className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalIndustries || 0}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Different sectors
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Recent</CardTitle>
              <Activity className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.recentClients || 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Added this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients by name, email, company, or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchClients}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No clients match your search criteria.' : 'Get started by adding your first client.'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-fr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update client information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company">Company</Label>
                  <Input
                    id="edit-company"
                    value={newClient.company}
                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-industry">Industry</Label>
                <Select value={newClient.industry} onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newClient.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateClient} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Client
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}