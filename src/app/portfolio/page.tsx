"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image as ImageIcon,
  Tag,
  X,
  Sparkles,
  Grid3X3,
  List,
  Calendar,
  TrendingUp,
  Users,
  Award,
  ExternalLink,
  Copy,
  Mail,
  ChevronDown,
  Table,
  Database,
  Code,
  Share2,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type CaseStudy = {
  id: string;
  title: string;
  client: string;
  industry: string;
  date: string;
  summary: string;
  cover?: string;
  tags: string[];
  metrics?: { label: string; value: string }[];
  draft?: boolean;
  problem?: string;
  solution?: string;
  results?: string;
  techStack?: string;
  media?: string[];
  isMock?: boolean;
};

const MOCK: CaseStudy[] = [
  {
    id: "1",
    isMock: true,
    title: "B2B Lead Engine for Acme Co.",
    client: "Acme Co.",
    industry: "SaaS",
    date: "2025-07-10",
    summary:
      "Set up AI-driven lead scoring and automated follow-ups; reduced response time by 62%.",
    cover: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    tags: ["Lead Gen", "Email", "Automation"],
    metrics: [
      { label: "Reply Rate", value: "+38%" },
      { label: "Time Saved", value: "12h/wk" },
      { label: "Conversion Rate", value: "+62%" },
      { label: "Lead Quality", value: "+45%" },
    ],
    problem: "Acme Co. was struggling with manual lead qualification processes that resulted in low conversion rates and high customer acquisition costs. Their sales team was spending 60% of their time on unqualified leads, leading to missed opportunities and revenue loss.",
    solution: "We implemented an AI-powered lead scoring system with automated email sequences, behavioral tracking, and predictive analytics. The solution included custom integrations with their CRM, automated follow-up workflows, and real-time lead qualification dashboards.",
    results: "Within 3 months, Acme Co. achieved a 62% reduction in response time, 38% increase in reply rates, and 45% improvement in lead quality. The automated system now handles 80% of initial lead interactions, allowing the sales team to focus on high-value prospects.",
    techStack: "Python, TensorFlow, Salesforce API, Zapier, HubSpot, AWS Lambda",
    media: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop"
    ],
  },
  {
    id: "2",
    isMock: true,
    title: "Proposal Win-Rate Uplift",
    client: "Bright Studio",
    industry: "Design",
    date: "2025-06-15",
    summary:
      "Interactive proposals with tracking increased acceptance rate significantly.",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    tags: ["Proposals", "Quotation"],
    metrics: [
      { label: "Win Rate", value: "31% → 47%" },
      { label: "Turnaround", value: "−40%" },
      { label: "Client Satisfaction", value: "+55%" },
      { label: "Revenue Growth", value: "+28%" },
    ],
    problem: "Bright Studio's traditional PDF proposals had low engagement rates and lengthy approval cycles. Clients often didn't review proposals thoroughly, leading to miscommunication and project delays.",
    solution: "We created an interactive proposal platform with real-time collaboration features, embedded videos, interactive pricing calculators, and detailed project timelines. The system includes client feedback loops and automated approval workflows.",
    results: "The new proposal system increased win rates from 31% to 47%, reduced turnaround time by 40%, and improved client satisfaction scores by 55%. The interactive elements led to 3x higher engagement rates and faster decision-making.",
    techStack: "React, Node.js, MongoDB, Stripe API, SendGrid, Figma API",
    media: [
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
    ],
  },
];

export default function PortfolioPage() {
  const [data, setData] = useState<CaseStudy[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openBuilder, setOpenBuilder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    client: '',
    industry: '',
    date: '',
    summary: '',
    cover: '',
    tags: '',
    problem: '',
    solution: '',
    results: '',
    techStack: '',
    googleDocLink: ''
  });
  const [openDetail, setOpenDetail] = useState<CaseStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingItem, setEditingItem] = useState<CaseStudy | null>(null);
  const [shareItem, setShareItem] = useState<CaseStudy | null>(null);

  useEffect(() => {
    loadCaseStudies();
  }, []);

  const loadCaseStudies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/case-studies');
      if (!response.ok) {
        throw new Error('Failed to fetch case studies');
      }
      const { caseStudies } = await response.json();
      // If no data in database, use mock data as fallback
      setData(caseStudies.length > 0 ? caseStudies : MOCK);
    } catch (err) {
      console.error('Error loading case studies:', err);
      setError('Failed to load case studies');
      // Use mock data as fallback on error
      setData(MOCK);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = !search || 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.client.toLowerCase().includes(search.toLowerCase()) ||
        item.industry.toLowerCase().includes(search.toLowerCase()) ||
        item.summary.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesFilter = filter === "all" || item.industry.toLowerCase() === filter.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  const handleDelete = async (id: string) => {
    if (deletingId) return; // Prevent multiple simultaneous deletes
    
    const caseStudy = data.find(item => item.id === id);
    
    // Handle mock data deletion (no API call needed)
    if (caseStudy?.isMock) {
      setDeletingId(id);
      // Simulate a brief delay for UX consistency
      setTimeout(() => {
        setData(prev => prev.filter(item => item.id !== id));
        setNotification({ type: 'success', message: 'Case study deleted successfully' });
        setTimeout(() => setNotification(null), 3000);
        setDeletingId(null);
      }, 500);
      return;
    }
    
    setDeletingId(id);
    try {
      const response = await fetch(`/api/case-studies/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete case study');
      }
      
      // Remove from local state
      setData(prev => prev.filter(item => item.id !== id));
      setNotification({ type: 'success', message: 'Case study deleted successfully' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting case study:', err);
      setNotification({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to delete case study. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: CaseStudy) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      // Get form values
      const title = (document.getElementById('edit-title') as HTMLInputElement)?.value || editingItem.title;
      const client = (document.getElementById('edit-client') as HTMLInputElement)?.value || editingItem.client;
      const industry = (document.getElementById('edit-industry') as HTMLInputElement)?.value || editingItem.industry;
      const date = (document.getElementById('edit-date') as HTMLInputElement)?.value || editingItem.date;
      const summary = (document.getElementById('edit-summary') as HTMLTextAreaElement)?.value || editingItem.summary;
      const cover = (document.getElementById('edit-cover') as HTMLInputElement)?.value || editingItem.cover;
      const tags = (document.getElementById('edit-tags') as HTMLInputElement)?.value?.split(',').map(tag => tag.trim()) || editingItem.tags;
      const problem = (document.getElementById('edit-problem') as HTMLTextAreaElement)?.value || editingItem.problem;
      const solution = (document.getElementById('edit-solution') as HTMLTextAreaElement)?.value || editingItem.solution;
      const results = (document.getElementById('edit-results') as HTMLTextAreaElement)?.value || editingItem.results;

      // Handle mock data editing (no API call needed)
      if (editingItem.isMock) {
        const updatedItem = {
          ...editingItem,
          title,
          client,
          industry,
          date,
          summary,
          cover,
          tags,
          problem,
          solution,
          results,
        };
        
        // Update local state
        setData(prev => prev.map(cs => cs.id === editingItem.id ? updatedItem : cs));
        setNotification({ type: 'success', message: 'Case study updated successfully!' });
        setEditingItem(null);
        return;
      }

      const response = await fetch(`/api/case-studies/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          client,
          industry,
          date,
          summary,
          cover,
          tags,
          problem,
          solution,
          results,
        }),
      });

      if (response.ok) {
        const { caseStudy } = await response.json();
        // Update the local state
        setData(prev => prev.map(cs => cs.id === editingItem.id ? caseStudy : cs));
        setNotification({ type: 'success', message: 'Case study updated successfully!' });
        setEditingItem(null);
        // Reload case studies to get fresh data
        loadCaseStudies();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update case study');
      }
    } catch (error) {
      console.error('Error updating case study:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to update case study. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const validateGoogleDocUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid (optional field)
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'docs.google.com' && 
             (url.includes('/document/') || url.includes('/spreadsheets/') || url.includes('/presentation/'));
    } catch {
      return false;
    }
  };

  const handleCreateCaseStudy = async () => {
    if (!createForm.title || !createForm.client || !createForm.industry || !createForm.summary) {
      setNotification({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (createForm.googleDocLink && !validateGoogleDocUrl(createForm.googleDocLink)) {
      setNotification({ type: 'error', message: 'Please enter a valid Google Docs link.' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch('/api/case-studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createForm.title,
          client: createForm.client,
          industry: createForm.industry,
          date: createForm.date || new Date().toISOString().split('T')[0],
          summary: createForm.summary,
          cover: createForm.cover || '',
          tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          problem: createForm.problem || '',
          solution: createForm.solution || '',
          results: createForm.results || '',
          techStack: createForm.techStack.split(',').map(tech => tech.trim()).filter(Boolean),
          googleDocLink: createForm.googleDocLink || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create case study');
      }

      const { caseStudy } = await response.json();
      
      // Add the new case study to the list
      setData(prev => [caseStudy, ...prev]);
      
      // Reset form and close dialog
      setCreateForm({
        title: '',
        client: '',
        industry: '',
        date: '',
        summary: '',
        cover: '',
        tags: '',
        problem: '',
        solution: '',
        results: '',
        techStack: '',
        googleDocLink: ''
      });
      setOpenBuilder(false);
      
      setNotification({ type: 'success', message: 'Case study created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating case study:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create case study. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleShare = (item: CaseStudy) => {
    setShareItem(item);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({ type: 'success', message: 'Link copied to clipboard!' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const shareToSocial = (platform: string, item: CaseStudy) => {
    const url = `${window.location.origin}/portfolio/${item.id}`;
    const text = `Check out this case study: ${item.title} - ${item.summary}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const stats = useMemo(() => {
    return {
      total: data.length,
      published: data.filter(item => !item.draft).length,
      drafts: data.filter(item => item.draft).length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 text-white/90 text-sm font-medium shadow-2xl border border-white/20"
            >
              <div className="relative">
                <Award className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              Professional Portfolio
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-black text-white leading-tight"
            >
              Case Studies & 
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                Success Stories
              </motion.span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            >
              Discover how we've helped businesses transform their operations, increase revenue, and achieve remarkable growth through innovative AI-powered solutions.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12"
        >
          <Card className="text-center bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.total}</div>
              <div className="text-sm text-slate-600 font-medium">Total Projects</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.published}</div>
              <div className="text-sm text-slate-600 font-medium">Published</div>
            </CardContent>
          </Card>
          <Card className="text-center bg-gradient-to-br from-amber-50 to-orange-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-amber-600 mb-2">{stats.drafts}</div>
              <div className="text-sm text-slate-600 font-medium">Drafts</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search case studies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48 border-slate-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => setOpenBuilder(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
              aria-label="Create a new case study"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenBuilder(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              New Case Study
            </Button>
          </div>
        </motion.div>

        {search && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-blue-200 bg-blue-50">
              <Search className="w-4 h-4" />
              <AlertDescription>
                Found {filtered.length} case studies matching "{search}"
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Gallery */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" : "space-y-4 sm:space-y-6"}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={loadCaseStudies} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-500 mb-4">
                {search ? `No case studies found matching "${search}"` : "No case studies found"}
              </div>
              {search && (
                <Button onClick={() => setSearch("")} variant="outline">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" : "space-y-4 sm:space-y-6"}
            >
              {filtered.map((item) => (
                viewMode === "grid" ? (
                  <div key={item.id}>
                    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          {item.cover ? (
                            <img
                              src={item.cover}
                              alt={item.title}
                              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-indigo-400 dark:text-indigo-300" />
                            </div>
                          )}
                          {item.isMock && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700 text-xs font-medium">
                                Demo
                              </Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {/* Mobile-friendly action buttons - always visible on mobile */}
                          <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 sm:opacity-100 sm:translate-y-0">
                            <div className="flex gap-1.5 sm:gap-2">
                              <Button
                                size="sm"
                                onClick={() => setOpenDetail(item)}
                                className="bg-white/20 dark:bg-black/20 backdrop-blur-md text-white border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-black/30 flex-1 text-xs sm:text-sm"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden xs:inline">View</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                className="bg-white/20 dark:bg-black/20 backdrop-blur-md text-white border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-black/30 px-2 sm:px-3 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
                                title="Edit Case Study"
                                aria-label={`Edit case study: ${item.title}`}
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(item)}
                                className="bg-white/20 dark:bg-black/20 backdrop-blur-md text-white border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-black/30 px-2 sm:px-3 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
                                title="Share Case Study"
                                aria-label={`Share case study: ${item.title}`}
                              >
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="bg-red-500/20 backdrop-blur-md text-white border-red-300/30 hover:bg-red-500/30 px-2 sm:px-3 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                title="Delete Case Study"
                                aria-label={`Delete case study: ${item.title}`}
                              >
                                {deletingId === item.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white" aria-hidden="true"></div>
                                ) : (
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors duration-300 line-clamp-2">{item.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">{item.client}</span>
                            <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700">{item.industry}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">{item.summary}</p>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs border-indigo-200 text-indigo-700">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          {item.metrics && (
                            <div className="grid grid-cols-2 gap-2 text-center">
                              {item.metrics.slice(0, 2).map((metric) => (
                                <div key={metric.label} className="p-2 rounded bg-slate-50">
                                  <div className="text-sm font-bold text-indigo-600">{metric.value}</div>
                                  <div className="text-xs text-slate-500">{metric.label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div key={item.id}>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-900">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                          <div className="flex-shrink-0">
                            {item.cover ? (
                              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 shadow-sm">
                                <img
                                  src={item.cover}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm">
                                <ImageIcon className="w-8 h-8 text-indigo-400 dark:text-indigo-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300 leading-tight flex-1">{item.title}</h3>
                                  {item.isMock && (
                                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700 text-xs font-medium">
                                      Demo
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    <span className="font-medium">{item.client}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700">{item.industry}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span>{item.date}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">{item.summary}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {item.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs border-indigo-200 text-indigo-700">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {item.metrics && (
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-center mt-4 lg:mt-0">
                                  {item.metrics.slice(0, 2).map((metric) => (
                                    <div key={metric.label} className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-indigo-50 group-hover:to-purple-50 transition-all duration-300 flex-1 sm:flex-none">
                                      <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{metric.value}</div>
                                      <div className="text-xs text-slate-500 font-medium mt-1">{metric.label}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-100 gap-3 sm:gap-0">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setOpenDetail(item)}
                                  className="border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 font-medium w-full sm:w-auto justify-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  className="border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 w-full sm:w-auto justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                                  aria-label={`Edit case study: ${item.title}`}
                                >
                                  <Pencil className="w-4 h-4 mr-1" aria-hidden="true" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleShare(item)}
                                  className="border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 w-full sm:w-auto justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                  aria-label={`Share case study: ${item.title}`}
                                >
                                  <Share2 className="w-4 h-4 mr-1" aria-hidden="true" />
                                  Share
                                </Button>
                              </div>
                              <div className="flex gap-2 justify-center sm:justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => alert("Downloading PDF...")}
                                  className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                  title="Delete Case Study"
                                  aria-label={`Delete case study: ${item.title}`}
                                >
                                  {deletingId === item.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" aria-hidden="true"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <Dialog open={openBuilder} onOpenChange={(open) => {
        setOpenBuilder(open);
        if (!open) {
          setCreateForm({
            title: '',
            client: '',
            industry: '',
            date: '',
            summary: '',
            cover: '',
            tags: '',
            problem: '',
            solution: '',
            results: '',
            techStack: '',
            googleDocLink: ''
          });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Case Study</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-title" className="text-sm font-medium text-slate-700">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter case study title"
                  className="mt-1"
                  required
                  aria-describedby="title-error"
                />
              </div>
              <div>
                <Label htmlFor="create-client" className="text-sm font-medium text-slate-700">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-client"
                  value={createForm.client}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Enter client name"
                  className="mt-1"
                  required
                  aria-describedby="client-error"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-industry" className="text-sm font-medium text-slate-700">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-industry"
                  value={createForm.industry}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., SaaS, E-commerce, Healthcare"
                  className="mt-1"
                  required
                  aria-describedby="industry-error"
                />
              </div>
              <div>
                <Label htmlFor="create-date" className="text-sm font-medium text-slate-700">
                  Date
                </Label>
                <Input
                  id="create-date"
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="create-summary" className="text-sm font-medium text-slate-700">
                Summary <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="create-summary"
                value={createForm.summary}
                onChange={(e) => setCreateForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief description of the project and its impact"
                className="mt-1"
                rows={3}
                required
                aria-describedby="summary-error"
              />
            </div>
            
            <div>
              <Label htmlFor="create-cover" className="text-sm font-medium text-slate-700">
                Cover Image URL
              </Label>
              <Input
                id="create-cover"
                value={createForm.cover}
                onChange={(e) => setCreateForm(prev => ({ ...prev, cover: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
                type="url"
              />
            </div>
            
            <div>
              <Label htmlFor="create-tags" className="text-sm font-medium text-slate-700">
                Tags
              </Label>
              <Input
                id="create-tags"
                value={createForm.tags}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Lead Gen, Email, Automation (comma-separated)"
                className="mt-1"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-problem" className="text-sm font-medium text-slate-700">
                  Problem Statement
                </Label>
                <Textarea
                  id="create-problem"
                  value={createForm.problem}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, problem: e.target.value }))}
                  placeholder="Describe the challenge or problem that needed to be solved"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="create-solution" className="text-sm font-medium text-slate-700">
                  Solution
                </Label>
                <Textarea
                  id="create-solution"
                  value={createForm.solution}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, solution: e.target.value }))}
                  placeholder="Explain the approach and solution implemented"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="create-results" className="text-sm font-medium text-slate-700">
                  Results & Impact
                </Label>
                <Textarea
                  id="create-results"
                  value={createForm.results}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, results: e.target.value }))}
                  placeholder="Describe the outcomes, metrics, and business impact"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="create-techstack" className="text-sm font-medium text-slate-700">
                  Technology Stack
                </Label>
                <Input
                  id="create-techstack"
                  value={createForm.techStack}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, techStack: e.target.value }))}
                  placeholder="React, Node.js, PostgreSQL, etc."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="create-googledoclink" className="text-sm font-medium text-slate-700">
                  Google Doc Link (Optional)
                </Label>
                <Input
                  id="create-googledoclink"
                  value={createForm.googleDocLink}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, googleDocLink: e.target.value }))}
                  placeholder="Paste Google Doc share link here"
                  className="mt-1"
                  type="url"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setOpenBuilder(false)}
                disabled={isCreating}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCaseStudy}
                disabled={isCreating || !createForm.title || !createForm.client || !createForm.industry || !createForm.summary}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Case Study'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {openDetail && (
        <Dialog open={!!openDetail} onOpenChange={() => setOpenDetail(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">{openDetail.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">{openDetail.client}</span>
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700">{openDetail.industry}</Badge>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>{openDetail.date}</span>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-8">
              {/* Cover Image */}
              {openDetail.cover && (
                <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={openDetail.cover}
                    alt={openDetail.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Project Summary</h3>
                <p className="text-slate-700 leading-relaxed">{openDetail.summary}</p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Technologies & Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {openDetail.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-indigo-200 text-indigo-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              {openDetail.metrics && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Results</h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {openDetail.metrics.map((metric) => (
                      <div key={metric.label} className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{metric.value}</div>
                        <div className="text-sm text-slate-600 font-medium mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem, Solution, Results */}
              {(openDetail.problem || openDetail.solution || openDetail.results) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {openDetail.problem && (
                    <div className="p-6 rounded-xl bg-red-50 border border-red-100">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-red-900">Challenge</h4>
                      </div>
                      <p className="text-red-800 text-sm leading-relaxed">{openDetail.problem}</p>
                    </div>
                  )}
                  {openDetail.solution && (
                    <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Solution</h4>
                      </div>
                      <p className="text-blue-800 text-sm leading-relaxed">{openDetail.solution}</p>
                    </div>
                  )}
                  {openDetail.results && (
                    <div className="p-6 rounded-xl bg-green-50 border border-green-100">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">Results</h4>
                      </div>
                      <p className="text-green-800 text-sm leading-relaxed">{openDetail.results}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tech Stack */}
              {openDetail.techStack && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Technology Stack</h3>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-slate-700">{openDetail.techStack}</p>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {openDetail.media && openDetail.media.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Gallery</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {openDetail.media.map((mediaUrl, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={mediaUrl}
                          alt={`${openDetail.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-8">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full justify-between">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(openDetail)}
                    className="border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 w-full sm:w-auto justify-center"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Case Study
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(openDetail)}
                    className="border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50 w-full sm:w-auto justify-center"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                <Button onClick={() => setOpenDetail(null)} className="w-full sm:w-auto justify-center">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Case Study</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" defaultValue={editingItem.title} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="edit-client">Client</Label>
                  <Input id="edit-client" defaultValue={editingItem.client} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Input id="edit-industry" defaultValue={editingItem.industry} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input id="edit-date" type="date" defaultValue={editingItem.date} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-summary">Summary</Label>
                <Textarea id="edit-summary" defaultValue={editingItem.summary} className="mt-1" rows={3} />
              </div>
              <div>
                <Label htmlFor="edit-cover">Cover Image URL</Label>
                <Input id="edit-cover" defaultValue={editingItem.cover || ''} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input id="edit-tags" defaultValue={editingItem.tags.join(', ')} className="mt-1" />
              </div>
              {editingItem.problem && (
                <div>
                  <Label htmlFor="edit-problem">Problem</Label>
                  <Textarea id="edit-problem" defaultValue={editingItem.problem} className="mt-1" rows={3} />
                </div>
              )}
              {editingItem.solution && (
                <div>
                  <Label htmlFor="edit-solution">Solution</Label>
                  <Textarea id="edit-solution" defaultValue={editingItem.solution} className="mt-1" rows={3} />
                </div>
              )}
              {editingItem.results && (
                <div>
                  <Label htmlFor="edit-results">Results</Label>
                  <Textarea id="edit-results" defaultValue={editingItem.results} className="mt-1" rows={3} />
                </div>
              )}
              {editingItem.techStack && (
                <div>
                  <Label htmlFor="edit-techstack">Technology Stack</Label>
                  <Input id="edit-techstack" defaultValue={editingItem.techStack} className="mt-1" />
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                <Button variant="outline" onClick={() => setEditingItem(null)} className="w-full sm:w-auto justify-center">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="w-full sm:w-auto justify-center">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      {shareItem && (
        <Dialog open={!!shareItem} onOpenChange={() => setShareItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Case Study</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">{shareItem.title}</h4>
                <p className="text-sm text-slate-600 line-clamp-2">{shareItem.summary}</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Share Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={`${window.location.origin}/portfolio/${shareItem.id}`} 
                      readOnly 
                      className="text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}/portfolio/${shareItem.id}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Share on Social Media</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => shareToSocial('twitter', shareItem)}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => shareToSocial('linkedin', shareItem)}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => shareToSocial('facebook', shareItem)}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShareItem(null)} className="w-full sm:w-auto justify-center">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}