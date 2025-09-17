"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  Star, 
  FileText, 
  TrendingUp, 
  Users, 
  Filter,
  Download,
  Upload,
  Copy,
  Heart,
  MoreVertical,
  Grid3X3,
  List,
  Tag,
  Activity,
  RefreshCw,
  Clock,
  FileDown
} from "lucide-react";
import TemplatePreviewModal from "@/components/TemplatePreviewModal";
import jsPDF from 'jspdf';

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  content: string;
  sections: string;
  isPublic: boolean;
  isPopular: boolean;
  isFavorite?: boolean;
  usageCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastUsed?: string;
  rating?: number;
  downloads?: number;
}

interface NewTemplate {
  name: string;
  description: string;
  type: string;
  category: string;
  content: string;
  sections: Array<{ title: string; content: string }>;
  isPublic: boolean;
  tags: string[];
}

interface TemplateStats {
  totalTemplates: number;
  popularTemplates: number;
  publicTemplates: number;
  totalUsage: number;
  averageRating: number;
  recentActivity: number;
}

// Enhanced Metric Card Component with improved design
const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
}) => {
  const colorClasses = {
    blue: "from-blue-500 via-blue-600 to-blue-700",
    green: "from-emerald-500 via-green-600 to-green-700",
    purple: "from-purple-500 via-violet-600 to-purple-700",
    orange: "from-orange-500 via-amber-600 to-orange-700",
    pink: "from-pink-500 via-rose-600 to-pink-700",
    indigo: "from-indigo-500 via-blue-600 to-indigo-700"
  };

  return (
    <div className="group">
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:shadow-blue-500/25">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-95`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <CardContent className="relative p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">{title}</p>
              <p className="text-4xl font-bold tracking-tight">{value}</p>
              {trend && trendValue && (
                <div className="flex items-center space-x-2">
                  {trend === "up" ? (
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                      <TrendingUp className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">{trendValue}</span>
                    </div>
                  ) : trend === "down" ? (
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                      <TrendingUp className="h-3 w-3 text-white rotate-180" />
                      <span className="text-xs font-medium text-white">{trendValue}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                      <Activity className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">{trendValue}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
              <Icon className="h-7 w-7 text-white drop-shadow-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Chart Component
const SimpleChart = ({ data, title }: { data: Array<{ name: string; value: number; color: string }>; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-600">{item.value}</span>
            </div>
            <div 
              className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="h-2 rounded-full transition-all duration-200"
                style={{ 
                  backgroundColor: item.color,
                  opacity: hoveredIndex === index ? 1 : 0.8,
                  width: `${(item.value / maxValue) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Donut Chart Component
const DonutChart = ({ data, title }: { data: Array<{ name: string; value: number; color: string }>; title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  if (!data.length || total === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No data available</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = isNaN(cumulativePercentage) ? 0 : -cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <path
                  key={index}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:stroke-4"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-700">{total}</span>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{item.value}</span>
                  <span className="text-gray-500 ml-1">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default function TemplatesLibrary() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats>({
    totalTemplates: 0,
    popularTemplates: 0,
    publicTemplates: 0,
    totalUsage: 0,
    averageRating: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [usageRange, setUsageRange] = useState({ min: 0, max: 1000 });
  const [ratingFilter, setRatingFilter] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    name: '',
    description: '',
    type: 'business',
    category: 'proposal',
    content: '',
    sections: [],
    isPublic: false,
    tags: []
  });

  useEffect(() => {
    fetchTemplates();
    fetchStats();
    loadFavorites();
    
    const interval = setInterval(() => {
      fetchTemplates(true);
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAvailableTags();
  }, [templates]);

  const fetchTemplates = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        if (silent) {
          toast.success('Templates updated successfully');
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/templates/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalTemplates: data.totalTemplates || 0,
          popularTemplates: data.popularTemplates || 0,
          publicTemplates: data.publicTemplates || 0,
          totalUsage: data.totalUsage || 0,
          averageRating: data.averageRating || 0,
          recentActivity: data.recentActivity || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('template-favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (templateId: string) => {
    const newFavorites = favorites.includes(templateId)
      ? favorites.filter(id => id !== templateId)
      : [...favorites, templateId];
    
    setFavorites(newFavorites);
    localStorage.setItem('template-favorites', JSON.stringify(newFavorites));
    toast.success(favorites.includes(templateId) ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTemplate,
          sections: JSON.stringify(newTemplate.sections)
        }),
      });
      
      if (response.ok) {
        const createdTemplate = await response.json();
        setTemplates([createdTemplate, ...templates]);
        setShowCreateDialog(false);
        setNewTemplate({
          name: '',
          description: '',
          type: 'business',
          category: 'proposal',
          content: '',
          sections: [],
          isPublic: false,
          tags: []
        });
        toast.success('Template created successfully!');
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        setSelectedTemplate(null);
        toast.success('Template deleted successfully');
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copy)`,
          id: undefined
        }),
      });
      
      if (response.ok) {
        const duplicatedTemplate = await response.json();
        setTemplates([duplicatedTemplate, ...templates]);
        toast.success('Template duplicated successfully!');
        fetchStats();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const loadAvailableTags = () => {
    const allTags = new Set<string>();
    templates.forEach(template => {
      const parsedTags = Array.isArray(template.tags) 
        ? template.tags 
        : (typeof template.tags === 'string' ? JSON.parse(template.tags || '[]') : []);
      parsedTags.forEach(tag => allTags.add(tag));
    });
    setAvailableTags(Array.from(allTags));
  };

  const addNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags([...availableTags, newTag.trim()]);
      setNewTag('');
      toast.success('Tag added successfully!');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAvailableTags(availableTags.filter(tag => tag !== tagToRemove));
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
    toast.success('Tag removed successfully!');
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTemplates.length === 0) {
      toast.error('Please select templates first');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          for (const templateId of selectedTemplates) {
            await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
          }
          setTemplates(templates.filter(t => !selectedTemplates.includes(t.id)));
          toast.success(`${selectedTemplates.length} templates deleted`);
          break;
        case 'favorite':
          const updatedFavorites = [...favorites];
          selectedTemplates.forEach(id => {
            if (!updatedFavorites.includes(id)) {
              updatedFavorites.push(id);
            }
          });
          setFavorites(updatedFavorites);
          localStorage.setItem('template-favorites', JSON.stringify(updatedFavorites));
          toast.success(`${selectedTemplates.length} templates added to favorites`);
          break;
        case 'unfavorite':
          const filteredFavorites = favorites.filter(id => !selectedTemplates.includes(id));
          setFavorites(filteredFavorites);
          localStorage.setItem('template-favorites', JSON.stringify(filteredFavorites));
          toast.success(`${selectedTemplates.length} templates removed from favorites`);
          break;
      }
      setSelectedTemplates([]);
      setBulkAction('');
      fetchStats();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleExportSelectedPDF = () => {
    if (selectedTemplates.length === 0) {
      toast.error('Please select templates to export');
      return;
    }

    try {
      const selectedTemplateData = templates.filter(t => selectedTemplates.includes(t.id));
      
      // Validate selected templates
      if (selectedTemplateData.length === 0) {
        toast.error('Selected templates not found. Please refresh and try again.');
        return;
      }

      // Check for invalid templates
      const invalidTemplates = selectedTemplateData.filter(t => !t.name || !t.content);
      if (invalidTemplates.length > 0) {
        toast.error(`${invalidTemplates.length} template(s) have missing data and will be skipped`);
      }

      const validTemplates = selectedTemplateData.filter(t => t.name && t.content);
      if (validTemplates.length === 0) {
        toast.error('No valid templates found for export');
        return;
      }

      const doc = new jsPDF();
      
      // Title page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Templates Export', 105, 40, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 60, { align: 'center' });
      doc.text(`Total Templates: ${validTemplates.length}`, 105, 75, { align: 'center' });
      
      let yPosition = 100;
      
      validTemplates.forEach((template, index) => {
        try {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
          }
          
          // Template header
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${template.name}`, 20, yPosition);
          yPosition += 15;
          
          // Template details
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Type: ${template.type || 'N/A'} | Category: ${template.category || 'N/A'}`, 20, yPosition);
          yPosition += 10;
          
          const createdDate = template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A';
          doc.text(`Usage: ${template.usageCount || 0} times | Created: ${createdDate}`, 20, yPosition);
          yPosition += 10;
          
          if (template.description) {
            doc.text('Description:', 20, yPosition);
            yPosition += 8;
            const descLines = doc.splitTextToSize(template.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += descLines.length * 6 + 5;
          }
          
          // Template content preview (first 200 chars)
          const contentPreview = template.content.substring(0, 200) + (template.content.length > 200 ? '...' : '');
          doc.text('Content Preview:', 20, yPosition);
          yPosition += 8;
          const contentLines = doc.splitTextToSize(contentPreview, 170);
          doc.text(contentLines, 20, yPosition);
          yPosition += contentLines.length * 6 + 15;
          
          // Add separator line
          if (index < validTemplates.length - 1) {
            doc.line(20, yPosition - 5, 190, yPosition - 5);
            yPosition += 10;
          }
        } catch (templateError) {
          console.warn(`Error processing template ${template.name}:`, templateError);
          // Continue with next template
        }
      });
      
      // Footer on last page
      doc.setFontSize(8);
      doc.text('Generated by AI Business Developer', 105, 280, { align: 'center' });
      
      // Save the PDF with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `templates_export_${timestamp}.pdf`;
      doc.save(fileName);
      
      toast.success(`${validTemplates.length} templates exported to PDF successfully!`);
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Error exporting templates to PDF:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('jsPDF')) {
          toast.error('PDF generation failed. Please try again.');
        } else if (error.message.includes('save')) {
          toast.error('Failed to save PDF file. Check your browser permissions.');
        } else if (error.message.includes('memory') || error.message.includes('size')) {
          toast.error('Too many templates selected. Please select fewer templates and try again.');
        } else {
          toast.error(`Export failed: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred during PDF export');
      }
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.type.toLowerCase().includes(search.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(search.toLowerCase())) ||
      (() => {
        const parsedTags = Array.isArray(template.tags) 
          ? template.tags 
          : (typeof template.tags === 'string' ? JSON.parse(template.tags || '[]') : []);
        return parsedTags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      })() ||
      (template.content && template.content.toLowerCase().includes(search.toLowerCase()));
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'popular' && template.isPopular) ||
      (activeTab === 'public' && template.isPublic) ||
      (activeTab === 'private' && !template.isPublic) ||
      (activeTab === 'favorites' && favorites.includes(template.id));
    
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'popular' && template.isPopular) ||
      (filterStatus === 'public' && template.isPublic) ||
      (filterStatus === 'private' && !template.isPublic) ||
      (filterStatus === 'recent' && new Date(template.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const matchesTags = selectedTags.length === 0 || (() => {
      const parsedTags = Array.isArray(template.tags) 
        ? template.tags 
        : (typeof template.tags === 'string' ? JSON.parse(template.tags || '[]') : []);
      return selectedTags.every(tag => parsedTags.includes(tag));
    })();
    
    const matchesDateRange = 
      (!dateRange.from || new Date(template.createdAt) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(template.createdAt) <= new Date(dateRange.to));
    
    const matchesUsageRange = 
      template.usageCount >= usageRange.min && template.usageCount <= usageRange.max;
    
    const matchesRating = 
      ratingFilter === 0 || (template.rating && template.rating >= ratingFilter);
    
    return matchesSearch && matchesTab && matchesType && matchesCategory && 
           matchesStatus && matchesTags && matchesDateRange && matchesUsageRange && matchesRating;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'recent':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'popular':
        comparison = b.usageCount - a.usageCount;
        break;
      case 'rating':
        comparison = (b.rating || 0) - (a.rating || 0);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const chartData = [
    { name: 'Business', value: templates.filter(t => t.type === 'business').length, color: '#3b82f6' },
    { name: 'Technical', value: templates.filter(t => t.type === 'technical').length, color: '#10b981' },
    { name: 'Marketing', value: templates.filter(t => t.type === 'marketing').length, color: '#f59e0b' },
    { name: 'Legal', value: templates.filter(t => t.type === 'legal').length, color: '#ef4444' }
  ];

  const categoryData = [
    { name: 'Proposals', value: templates.filter(t => t.category === 'proposal').length, color: '#8b5cf6' },
    { name: 'Contracts', value: templates.filter(t => t.category === 'contract').length, color: '#06b6d4' },
    { name: 'Reports', value: templates.filter(t => t.category === 'report').length, color: '#f97316' },
    { name: 'Presentations', value: templates.filter(t => t.category === 'presentation').length, color: '#84cc16' }
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Templates Library
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and organize your proposal templates with advanced filtering and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates()}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a new template for your proposals. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Enter template description"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Enter template content"
                    rows={10}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={newTemplate.isPublic}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isPublic: checked })}
                  />
                  <Label htmlFor="public">Make this template public</Label>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Templates"
          value={stats.totalTemplates}
          icon={FileText}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <MetricCard
          title="Popular Templates"
          value={stats.popularTemplates}
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <MetricCard
          title="Total Usage"
          value={stats.totalUsage}
          icon={Activity}
          trend="up"
          trendValue="+24%"
          color="purple"
        />
        <MetricCard
          title="Avg Rating"
          value={(stats.averageRating || 0).toFixed(1)}
          icon={Star}
          trend="neutral"
          trendValue="4.2/5"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart data={chartData} title="Templates by Type" />
        <DonutChart data={categoryData} title="Templates by Category" />
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates by name, type, description, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagManager(!showTagManager)}
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Tags
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    {viewMode === 'grid' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setViewMode('grid')}>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Grid View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4 mr-2" />
                    List View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sort and filter controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Advanced Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="proposal">Proposals</SelectItem>
                      <SelectItem value="contract">Contracts</SelectItem>
                      <SelectItem value="report">Reports</SelectItem>
                      <SelectItem value="presentation">Presentations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      placeholder="To"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="1">1+ Stars</SelectItem>
                      <SelectItem value="2">2+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterStatus('all');
                    setSelectedTags([]);
                    setDateRange({ from: '', to: '' });
                    setUsageRange({ min: 0, max: 1000 });
                    setRatingFilter(0);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Tag Manager Content */}
          {showTagManager && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Tag Manager</h4>
              
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                />
                <Button onClick={addNewTag} size="sm">
                  Add Tag
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Operations */}
      {selectedTemplates.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplates([])}
              >
                Clear Selection
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelectedPDF}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="favorite">Add to Favorites</SelectItem>
                  <SelectItem value="unfavorite">Remove from Favorites</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => handleBulkAction(bulkAction)}
                disabled={!bulkAction}
                size="sm"
              >
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
          <TabsTrigger value="popular">Popular ({templates.filter(t => t.isPopular).length})</TabsTrigger>
          <TabsTrigger value="public">Public ({templates.filter(t => t.isPublic).length})</TabsTrigger>
          <TabsTrigger value="private">Private ({templates.filter(t => !t.isPublic).length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {sortedTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-gray-300 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-600">No templates found</h3>
                <p className="text-gray-500">
                  {search || selectedTags.length > 0 || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Create your first template to get started'
                  }
                </p>
                {!search && selectedTags.length === 0 && filterType === 'all' && filterCategory === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {sortedTemplates.map((template) => (
                <Card key={template.id} className={`group hover:shadow-lg transition-all duration-200 ${viewMode === 'list' ? 'p-4' : 'overflow-hidden'}`}>
                  {viewMode === 'grid' ? (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                checked={selectedTemplates.includes(template.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTemplates([...selectedTemplates, template.id]);
                                  } else {
                                    setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                                  }
                                }}
                              />
                              <Badge variant={template.isPublic ? "default" : "secondary"}>
                                {template.type}
                              </Badge>
                              {template.isPopular && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {template.name}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="mt-1 line-clamp-2">
                                {template.description}
                              </CardDescription>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedTemplate(template)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleFavorite(template.id)}>
                                <Heart className={`h-4 w-4 mr-2 ${favorites.includes(template.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                {favorites.includes(template.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {template.tags && (() => {
                            const parsedTags = Array.isArray(template.tags) 
                              ? template.tags 
                              : (typeof template.tags === 'string' ? JSON.parse(template.tags || '[]') : []);
                            return parsedTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {parsedTags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {parsedTags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{parsedTags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            );
                          })()}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{template.usageCount}</span>
                              </div>
                              {template.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{(template.rating || 0).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTemplate(template)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(template.id)}
                              className={favorites.includes(template.id) ? 'text-red-500 hover:text-red-600' : ''}
                            >
                              <Heart className={`h-4 w-4 ${favorites.includes(template.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTemplates([...selectedTemplates, template.id]);
                            } else {
                              setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                            }
                          }}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant={template.isPublic ? "default" : "secondary"}>
                              {template.type}
                            </Badge>
                            {template.isPopular && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{template.usageCount} uses</span>
                            </div>
                            {template.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{(template.rating || 0).toFixed(1)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(template.id)}
                          className={favorites.includes(template.id) ? 'text-red-500 hover:text-red-600' : ''}
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(template.id) ? 'fill-current' : ''}`} />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
