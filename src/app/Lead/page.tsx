"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadContext';
import { Plus, Search, Trash2, Upload, Download, Filter, MoreVertical, Mail, Phone, Building, DollarSign, Calendar, Tag, User, Star, ArrowUpDown, ArrowUp, ArrowDown, X, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// API helper functions
const createApiHelpers = (token: string | null) => ({
  async getLeads(query?: string) {
    const url = query ? `/api/leads?q=${encodeURIComponent(query)}` : '/api/leads';
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch leads');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch leads');
    }
    return data.leads;
  },

  async createLead(leadData: any) {
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData),
    });
    if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lead');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create lead');
      }
      return data.lead;
  },

  async updateLead(id: string, leadData: any) {
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData),
    });
    if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update lead');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update lead');
      }
      return data.lead;
  },

  async deleteLead(id: string) {
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lead');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete lead');
    }
  },
});

// Add Lead Form Component
function AddLeadForm({ onAddLead, onClose }: { onAddLead: (leadData: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    value: "",
    status: "New",
    owner: "",
    priority: "Medium",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields (Name and Email)");
      return;
    }

    setIsSubmitting(true);
    try {
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        value: formData.value.trim() || undefined,
        status: formData.status,
        owner: formData.owner.trim() || undefined,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
      };
      
      await onAddLead(leadData);
      
      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        value: "",
        status: "New",
        owner: "",
        priority: "Medium",
        notes: ""
      });
      onClose();
    } catch (error: any) {
      console.error("Error adding lead:", error);
      alert(error.message || "Failed to add lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="form-name" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <User className="w-4 h-4 mr-2 text-blue-600" />
            Full Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="form-name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-email" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <Mail className="w-4 h-4 mr-2 text-blue-600" />
            Email Address <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="form-email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
            required
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-phone" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <Phone className="w-4 h-4 mr-2 text-blue-600" />
            Phone Number
          </Label>
          <Input
            id="form-phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-company" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <Building className="w-4 h-4 mr-2 text-blue-600" />
            Company
          </Label>
          <Input
            id="form-company"
            placeholder="Enter company name"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-value" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
            Deal Value
          </Label>
          <Input
            id="form-value"
            placeholder="Enter deal value (e.g., $10,000)"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-owner" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <User className="w-4 h-4 mr-2 text-blue-600" />
            Lead Owner
          </Label>
          <Input
            id="form-owner"
            placeholder="Assign to team member"
            value={formData.owner}
            onChange={(e) => setFormData({...formData, owner: e.target.value})}
            className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-status" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <Tag className="w-4 h-4 mr-2 text-blue-600" />
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Closed Won">Closed Won</SelectItem>
              <SelectItem value="Closed Lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label htmlFor="form-priority" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
            <Star className="w-4 h-4 mr-2 text-blue-600" />
            Priority
          </Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-3">
        <Label htmlFor="form-notes" className="text-sm font-semibold text-black flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
          Notes
        </Label>
        <Textarea
          id="form-notes"
          placeholder="Add any additional notes, comments, or important details about this lead..."
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg resize-none"
          rows={4}
        />
      </div>
      
      <Separator className="my-6" />
      
      <div className="flex justify-end gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          disabled={isSubmitting} 
          onClick={onClose}
          className="px-6 py-2.5 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            "Add Lead"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function LeadsModule() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, token } = useAuth();
  
  // Create API helpers with the current token
  const api = createApiHelpers(token);
  
  const { leads, setLeads, addLead: contextAddLead, updateLead: contextUpdateLead, deleteLead: contextDeleteLead, refreshLeads, loading, setLoading } = useLeads();
  const [search, setSearch] = useState("");

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
        <Search className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  const [selected, setSelected] = useState<any | null>(null);
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Advanced filtering states
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Only refresh leads if we have a token
    if (token) {
      refreshLeads();
    }
  }, [refreshLeads, token]);

  const loadLeadsData = async () => {
    try {
      setError(null);
      await refreshLeads();
    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError(err.message || 'Failed to load leads');
    }
  };

  const addLead = async (leadData: any) => {
    try {
      const newLead = await api.createLead(leadData);
      contextAddLead(newLead);
      setSelected(newLead);
    } catch (err: any) {
      throw err; // Re-throw to be handled by the form
    }
  };

  const updateLead = async (field: string, value: any) => {
    if (!selected) return;
    try {
      const updatedLead = await api.updateLead(selected.id, { [field]: value });
      contextUpdateLead(selected.id, updatedLead);
      setSelected(updatedLead);
    } catch (err: any) {
      console.error('Error updating lead:', err);
      alert(err.message || 'Failed to update lead');
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await api.deleteLead(id);
      contextDeleteLead(id);
      if (selected?.id === id) setSelected(null);
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      alert(err.message || 'Failed to delete lead');
    }
  };

  // Advanced filtering and sorting logic
  const filteredLeads = leads
    .filter((lead) => {
      // Text search across multiple fields
      const searchMatch = search === '' || [
        lead.name,
        lead.email,
        lead.company,
        lead.owner,
        lead.phone,
        lead.notes
      ].some((field) => 
        field?.toLowerCase().includes(search.toLowerCase())
      );
      
      // Status filter
      const statusMatch = filters.status === 'All' || lead.status === filters.status;
      
      // Priority filter
      const priorityMatch = filters.priority === 'All' || lead.priority === filters.priority;
      
      return searchMatch && statusMatch && priorityMatch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'company':
          aValue = a.company?.toLowerCase() || '';
          bValue = b.company?.toLowerCase() || '';
          break;
        case 'value':
          aValue = parseFloat(a.value?.replace(/[^\d.-]/g, '') || '0');
          bValue = parseFloat(b.value?.replace(/[^\d.-]/g, '') || '0');
          break;
        case 'priority':
          const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Filter update functions
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({ 
      ...prev, 
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
    }));
  };

  // Enhanced CSV Export with proper escaping and error handling
  const exportCSV = () => {
    try {
      if (!leads || leads.length === 0) {
        alert('No leads available to export');
        return;
      }
      
      // Helper function to escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      // Create CSV header
      const headers = ["Name", "Email", "Phone", "Company", "Value", "Status", "Owner", "Priority", "Notes", "Created Date"];
      
      // Create CSV rows with proper escaping
      const csvRows = [
        headers.join(','),
        ...leads.map((lead) => [
          escapeCSV(lead.name),
          escapeCSV(lead.email),
          escapeCSV(lead.phone || ''),
          escapeCSV(lead.company || ''),
          escapeCSV(lead.value || ''),
          escapeCSV(lead.status || ''),
          escapeCSV(lead.owner || ''),
          escapeCSV(lead.priority || ''),
          escapeCSV(lead.notes || ''),
          escapeCSV(lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '')
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `leads-export-${timestamp}.csv`;
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      // Show success message
      alert(`Successfully exported ${leads.length} leads to ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // CSV Import with enhanced error handling and user feedback
  const [importProgress, setImportProgress] = useState({ isImporting: false, progress: 0, total: 0, errors: [] as string[] });
  
  const importCSV = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file must contain at least a header row and one data row');
          return;
        }
        
        // Validate CSV header
        const header = lines[0].toLowerCase();
        const requiredFields = ['name', 'email'];
        const hasRequiredFields = requiredFields.every(field => 
          header.includes(field)
        );
        
        if (!hasRequiredFields) {
          alert('CSV must contain at least "name" and "email" columns');
          return;
        }
        
        const dataRows = lines.slice(1).filter(row => row.trim());
        setImportProgress({ isImporting: true, progress: 0, total: dataRows.length, errors: [] });
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          try {
            // Handle CSV parsing with proper quote handling
            const parseCSVRow = (row: string): string[] => {
              const result: string[] = [];
              let current = '';
              let inQuotes = false;
              let i = 0;
              
              while (i < row.length) {
                const char = row[i];
                const nextChar = row[i + 1];
                
                if (char === '"') {
                  if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                  } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                  }
                } else if (char === ',' && !inQuotes) {
                  // Field separator
                  result.push(current.trim());
                  current = '';
                  i++;
                } else {
                  current += char;
                  i++;
                }
              }
              
              // Add the last field
              result.push(current.trim());
              return result;
            };
            
            const cleanColumns = parseCSVRow(row);
            
            const [name, email, phone, company, value, status, owner] = cleanColumns;
            
            // Validate required fields
            if (!name || !email) {
              errors.push(`Row ${i + 2}: Missing required fields (name or email)`);
              errorCount++;
              continue;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${i + 2}: Invalid email format (${email})`);
              errorCount++;
              continue;
            }
            
            const leadData = {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone?.trim() || undefined,
              company: company?.trim() || undefined,
              value: value?.trim() || undefined,
              status: status?.trim() || "New",
              owner: owner?.trim() || undefined,
              priority: "Medium",
              notes: `Imported from CSV on ${new Date().toLocaleDateString()}`,
            };
            
            await api.createLead(leadData);
            successCount++;
          } catch (error: any) {
            errorCount++;
            const errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('email already exists')) {
              errors.push(`Row ${i + 2}: Email already exists (${cleanColumns[1] || 'unknown'})`);
            } else {
              errors.push(`Row ${i + 2}: ${errorMsg}`);
            }
          }
          
          // Update progress
          setImportProgress(prev => ({ ...prev, progress: i + 1, errors }));
          
          // Add small delay to prevent overwhelming the API
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Show results with better user feedback
        if (successCount > 0) {
          setError(null);
          const successMessage = `🎉 Successfully imported ${successCount} lead${successCount > 1 ? 's' : ''}!`;
          
          if (errorCount === 0) {
            // Perfect import
            alert(`${successMessage}\n\nAll leads were imported successfully.`);
          } else {
            // Partial success
            const errorSummary = errors.reduce((acc, error) => {
              if (error.includes('email already exists')) acc.duplicates++;
              else if (error.includes('Invalid email format')) acc.invalidEmails++;
              else if (error.includes('Missing required fields')) acc.missingFields++;
              else acc.other++;
              return acc;
            }, { duplicates: 0, invalidEmails: 0, missingFields: 0, other: 0 });
            
            let errorDetails = [];
            if (errorSummary.duplicates > 0) errorDetails.push(`${errorSummary.duplicates} duplicate email${errorSummary.duplicates > 1 ? 's' : ''}`);
            if (errorSummary.invalidEmails > 0) errorDetails.push(`${errorSummary.invalidEmails} invalid email format${errorSummary.invalidEmails > 1 ? 's' : ''}`);
            if (errorSummary.missingFields > 0) errorDetails.push(`${errorSummary.missingFields} missing required field${errorSummary.missingFields > 1 ? 's' : ''}`);
            if (errorSummary.other > 0) errorDetails.push(`${errorSummary.other} other error${errorSummary.other > 1 ? 's' : ''}`);
            
            alert(`${successMessage}\n\n⚠️ ${errorCount} lead${errorCount > 1 ? 's' : ''} could not be imported:\n• ${errorDetails.join('\n• ')}\n\nCheck the console for detailed error information.`);
            console.group('📋 CSV Import Detailed Errors');
            errors.forEach((error, index) => {
              console.log(`${index + 1}. ${error}`);
            });
            console.groupEnd();
          }
        } else {
          // No successful imports
          setError('❌ No leads could be imported. Please check your CSV file format and data.');
          alert(`Import failed!\n\n❌ No leads could be imported.\n\nCommon issues:\n• Missing required columns (name, email)\n• Invalid email formats\n• All emails already exist in database\n\nPlease check your CSV file and try again.`);
          console.group('📋 CSV Import Errors');
          errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
          });
          console.groupEnd();
        }
        
        // Reload leads after import
        await loadLeadsData();
        
      } catch (error) {
        console.error('CSV import error:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to process CSV file.';
        let errorDetails = '';
        
        if (error.message?.includes('Unexpected token')) {
          errorMessage = 'Invalid CSV file format detected.';
          errorDetails = 'Please ensure your file is a valid CSV with proper formatting.';
        } else if (error.message?.includes('Network')) {
          errorMessage = 'Network connection error.';
          errorDetails = 'Please check your internet connection and try again.';
        } else if (error.message?.includes('401')) {
          errorMessage = 'Authentication error.';
          errorDetails = 'Please refresh the page and log in again.';
        } else if (error.message?.includes('413')) {
          errorMessage = 'File too large.';
          errorDetails = 'Please try with a smaller CSV file (recommended: under 1000 rows).';
        } else if (error.message?.includes('429')) {
          errorMessage = 'Too many requests.';
          errorDetails = 'Please wait a moment and try again.';
        } else {
          errorDetails = 'Please check the file format and try again.';
        }
        
        setError(`${errorMessage} ${errorDetails}`);
        alert(`${errorMessage}\n\n${errorDetails}\n\nIf the problem persists, please contact support.`);
      } finally {
        setImportProgress({ isImporting: false, progress: 0, total: 0, errors: [] });
        // Reset file input
        e.target.value = '';
      }
    };
    
    reader.onerror = (event) => {
      console.error('File reading error:', event);
      const errorMessage = 'Failed to read the selected file.';
      const errorDetails = 'This could be due to file corruption, insufficient permissions, or an unsupported file format. Please ensure the file is a valid CSV and try again.';
      
      setError(`${errorMessage} ${errorDetails}`);
      alert(`${errorMessage}\n\n${errorDetails}`);
      setImportProgress({ isImporting: false, progress: 0, total: 0, errors: [] });
    };
    
    reader.readAsText(file);
  };

  // Keyboard shortcuts
  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("searchBox")?.focus();
      }
      if (e.key.toLowerCase() === "k") {
        setView((v) => (v === "table" ? "pipeline" : "table"));
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [handleKeys]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Leads</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadLeadsData} className="bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6" style={{fontFamily: 'Poppins, Comfortaa, sans-serif'}}>
      <div className="max-w-7xl mx-auto px-2 sm:px-0">
        {/* Header Section */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <div className="space-y-2 md:space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black leading-tight" style={{fontFamily: 'Comfortaa, Poppins, sans-serif'}}>
                Lead Management
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-black font-medium tracking-wide" style={{fontFamily: 'Poppins, sans-serif'}}>Manage and track your sales leads efficiently</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Badge variant="secondary" className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200">
                {leads.length} Total Leads
              </Badge>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add New Lead</span>
                    <span className="sm:hidden">Add Lead</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-3 pb-6">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                      Add New Lead
                    </DialogTitle>
                    <DialogDescription className="text-base text-gray-600 leading-relaxed">
                      Enter the details for your new lead. All fields marked with <span className="text-red-500 font-semibold">*</span> are required.
                    </DialogDescription>
                  </DialogHeader>
                  <AddLeadForm onAddLead={addLead} onClose={() => setShowAddForm(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Enhanced Search and Filter Bar */}
          <Card className="mb-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 w-full lg:w-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="searchBox"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, company, phone, notes..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white text-black placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                    style={{fontFamily: 'Poppins, sans-serif'}}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Filter Controls */}
                 <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
                   {/* Advanced Filters Toggle */}
                   <Popover open={showFilters} onOpenChange={setShowFilters}>
                     <PopoverTrigger asChild>
                       <Button 
                         variant="outline" 
                         className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm text-sm sm:text-base"
                       >
                         <SlidersHorizontal className="w-4 h-4 mr-1 sm:mr-2" />
                         <span className="hidden sm:inline">Filters</span>
                         <span className="sm:hidden">Filter</span>
                         {(filters.status !== 'All' || filters.priority !== 'All') && (
                           <Badge className="ml-1 sm:ml-2 bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">Active</Badge>
                         )}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-72 sm:w-80 p-4 sm:p-6 bg-white border-0 shadow-xl rounded-2xl" align="end">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-black" style={{fontFamily: 'Comfortaa, sans-serif'}}>Advanced Filters</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setFilters({ status: 'All', priority: 'All', sortBy: 'createdAt', sortOrder: 'desc' });
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Reset
                          </Button>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-black">Status</Label>
                          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                            <SelectTrigger className="w-full rounded-xl border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Status</SelectItem>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Contacted">Contacted</SelectItem>
                              <SelectItem value="Qualified">Qualified</SelectItem>
                              <SelectItem value="Proposal">Proposal</SelectItem>
                              <SelectItem value="Won">Won</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Priority Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-black">Priority</Label>
                          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                            <SelectTrigger className="w-full rounded-xl border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Priorities</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Sort Options */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-black">Sort By</Label>
                          <div className="flex gap-2">
                            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                              <SelectTrigger className="flex-1 rounded-xl border-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="createdAt">Date Created</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="value">Amount</SelectItem>
                                <SelectItem value="priority">Priority</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleSortOrder}
                              className="px-3 rounded-xl border-2"
                            >
                              {filters.sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Quick Sort Buttons */}
                   <div className="hidden lg:flex items-center gap-2">
                     <Button 
                       variant={filters.sortBy === 'name' ? 'default' : 'outline'} 
                       size="sm"
                       onClick={() => updateFilter('sortBy', 'name')}
                       className="rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                     >
                       Name
                     </Button>
                     <Button 
                       variant={filters.sortBy === 'value' ? 'default' : 'outline'} 
                       size="sm"
                       onClick={() => updateFilter('sortBy', 'value')}
                       className="rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                     >
                       Amount
                     </Button>
                   </div>
                  
                  {/* Export/Import Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-2 relative"
                        disabled={importProgress.isImporting}
                      >
                        {importProgress.isImporting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs">{Math.round((importProgress.progress / importProgress.total) * 100)}%</span>
                          </div>
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={exportCSV} disabled={importProgress.isImporting}>
                        <Download className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                          <span>Export CSV</span>
                          <span className="text-xs text-gray-500">Download all leads as CSV</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={importProgress.isImporting}>
                        <Upload className="w-4 h-4 mr-2" />
                        <div className="flex flex-col flex-1">
                          <label className="cursor-pointer flex flex-col">
                            <span>Import CSV</span>
                            <span className="text-xs text-gray-500">Upload leads from CSV file</span>
                            <input 
                              type="file" 
                              hidden 
                              onChange={importCSV}
                              accept=".csv"
                              disabled={importProgress.isImporting}
                            />
                          </label>
                        </div>
                      </DropdownMenuItem>
                      {importProgress.isImporting && (
                        <DropdownMenuItem disabled>
                          <div className="flex flex-col w-full space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Importing...</span>
                              <span>{importProgress.progress}/{importProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(importProgress.progress / importProgress.total) * 100}%` }}
                              ></div>
                            </div>
                            {importProgress.errors.length > 0 && (
                              <div className="text-xs text-red-600">
                                {importProgress.errors.length} error(s) encountered
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Leads List */}
          <div className="xl:col-span-1">
            <Card className="min-h-[300px] sm:min-h-[400px] max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-220px)] h-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0 px-4 pt-4">
                <CardTitle className="text-base sm:text-lg text-black" style={{fontFamily: 'Comfortaa, sans-serif'}}>Leads ({filteredLeads.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 px-1">

                  {filteredLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className={`p-3 sm:p-4 mx-2 mb-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg hover:shadow-sm ${
                        selected?.id === l.id ? "bg-emerald-50 border-l-4 border-l-emerald-500 shadow-sm" : "hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                              {(l.name || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-black text-sm sm:text-base truncate" style={{fontFamily: 'Poppins, sans-serif'}}>{l.name || "Untitled Lead"}</div>
                            <div className="text-xs sm:text-sm text-black flex items-center gap-1 truncate" style={{fontFamily: 'Poppins, sans-serif'}}>
                              <Building className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{l.company || "No company"}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-black flex items-center gap-1 mt-1 truncate" style={{fontFamily: 'Poppins, sans-serif'}}>
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{l.email || "No email"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge 
                            variant={l.status === "Won" ? "default" : l.status === "Lost" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {l.status}
                          </Badge>
                          {l.value && (
                            <div className="text-sm font-semibold text-emerald-600 mt-1">
                              ${l.value}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="flex-1 flex items-center justify-center p-8 text-center text-black" style={{fontFamily: 'Poppins, sans-serif'}}>
                      <div>
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No leads found</p>
                        <p className="text-sm text-gray-600 mt-1">Try adjusting your search or add a new lead</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Details */}
          <div className="xl:col-span-2">
            {selected ? (
              <div className="space-y-4 md:space-y-6">
                {/* Lead Header */}
                <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg sm:text-xl">
                            {(selected.name || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-2xl text-black truncate" style={{fontFamily: 'Comfortaa, sans-serif'}}>{selected.name || "Untitled Lead"}</CardTitle>
                          <CardDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
                            <span className="flex items-center gap-1 text-black" style={{fontFamily: 'Poppins, sans-serif'}}>
                              <Building className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{selected.company || "No company"}</span>
                            </span>
                            <Badge 
                              variant={selected.status === "Won" ? "default" : selected.status === "Lost" ? "destructive" : "secondary"}
                              className="text-xs sm:text-sm"
                            >
                              {selected.status}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLead(selected.id)}
                        className="w-full sm:w-auto text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Contact Information */}
                <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-black" style={{fontFamily: 'Comfortaa, sans-serif'}}>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter full name"
                          value={selected.name}
                          onChange={(e) => updateLead("name", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={selected.email}
                          onChange={(e) => updateLead("email", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="Enter phone number"
                          value={selected.phone}
                          onChange={(e) => updateLead("phone", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Company</Label>
                        <Input
                          id="company"
                          placeholder="Enter company name"
                          value={selected.company}
                          onChange={(e) => updateLead("company", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deal Information */}
                <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-black" style={{fontFamily: 'Comfortaa, sans-serif'}}>Deal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="value" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Deal Value</Label>
                        <Input
                          id="value"
                          placeholder="Enter deal value"
                          value={selected.value}
                          onChange={(e) => updateLead("value", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Status</Label>
                        <Select value={selected.status} onValueChange={(value) => updateLead("status", value)}>
                          <SelectTrigger className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black" style={{fontFamily: 'Poppins, sans-serif'}}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Won">Won</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Lead Owner</Label>
                        <Input
                          id="owner"
                          placeholder="Assign to team member"
                          value={selected.owner}
                          onChange={(e) => updateLead("owner", e.target.value)}
                          className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black"
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium text-black" style={{fontFamily: 'Poppins, sans-serif'}}>Priority</Label>
                        <Select value={selected.priority} onValueChange={(value) => updateLead("priority", value)}>
                          <SelectTrigger className="rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black" style={{fontFamily: 'Poppins, sans-serif'}}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-black" style={{fontFamily: 'Comfortaa, sans-serif'}}>Notes & Comments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Textarea
                      placeholder="Add notes about this lead..."
                      value={selected.notes}
                      onChange={(e) => updateLead("notes", e.target.value)}
                      className="min-h-[120px] rounded-xl border-2 focus:ring-2 focus:ring-blue-500/30 text-black resize-none"
                      style={{fontFamily: 'Poppins, sans-serif'}}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-[300px] sm:h-[400px] flex items-center justify-center shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <div className="text-center text-black px-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                  <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2" style={{fontFamily: 'Comfortaa, sans-serif'}}>No Lead Selected</h3>
                  <p className="text-sm sm:text-base">Select a lead from the list to view and edit details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
