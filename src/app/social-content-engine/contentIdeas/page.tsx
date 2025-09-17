"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Search,
  X,
  Copy,
  Sparkles,
  Trash2,
  Plus,
  Filter,
  Heart,
  HeartOff,
  Edit,
  MoreVertical,
  Eye,
  Calendar,
  Tag,
  Wand2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useContentIdeas, ContentIdea, ContentIdeaFilters, GenerateIdeaParams } from "@/hooks/useContentIdeas";
import { toast } from "sonner";

export default function ContentIdeasPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const {
    ideas,
    loading,
    error,
    pagination,
    generating,
    fetchIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    generateIdeas,
    toggleFavorite,
    duplicateIdea,
    clearError,
    refreshIdeas,
  } = useContentIdeas();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ContentIdeaFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form States
  const [newIdea, setNewIdea] = useState<Partial<ContentIdea>>({
    title: '',
    description: '',
    content: '',
    category: 'general',
    platform: '',
    tags: [],
    priority: 'medium',
    status: 'draft',
  });

  const [generateParams, setGenerateParams] = useState<GenerateIdeaParams>({
    prompt: '',
    category: 'general',
    platform: '',
    count: 3,
    tone: 'engaging',
    targetAudience: '',
    keywords: [],
    saveToDatabase: true,
  });

  const primaryColor = "#7A8063";
  const hoverColor = "#7A8055";

  // Handlers
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const newFilters = { ...filters, search: query || undefined };
    setFilters(newFilters);
    await fetchIdeas(newFilters, 1);
  };

  const handleFilterChange = async (newFilters: ContentIdeaFilters) => {
    setFilters(newFilters);
    await fetchIdeas(newFilters, 1);
  };

  const handleCopy = async (idea: ContentIdea) => {
    try {
      await navigator.clipboard.writeText(idea.title);
      setCopiedId(idea.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCreateIdea = async () => {
    if (!newIdea.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    const created = await createIdea({
      ...newIdea,
      userId: user?.id || 'demo-user',
    });

    if (created) {
      setShowCreateDialog(false);
      setNewIdea({
        title: '',
        description: '',
        content: '',
        category: 'general',
        platform: '',
        tags: [],
        priority: 'medium',
        status: 'draft',
      });
    }
  };

  const handleGenerateIdeas = async () => {
    if (!generateParams.prompt?.trim()) {
      toast.error('Prompt is required');
      return;
    }

    const generated = await generateIdeas({
      ...generateParams,
      userId: user?.id || 'demo-user',
    });

    if (generated) {
      setShowGenerateDialog(false);
      setGenerateParams({
        prompt: '',
        category: 'general',
        platform: '',
        count: 3,
        tone: 'engaging',
        targetAudience: '',
        keywords: [],
        saveToDatabase: true,
      });
    }
  };

  const handleDeleteIdea = async () => {
    if (!ideaToDelete) return;
    
    const success = await deleteIdea(ideaToDelete);
    if (success) {
      setShowDeleteDialog(false);
      setIdeaToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setIdeaToDelete(id);
    setShowDeleteDialog(true);
  };

  const handlePageChange = (page: number) => {
    fetchIdeas(filters, page, pagination.limit);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Content Ideas
            </h1>
            <p className="text-gray-600">
              Generate, manage, and organize your content ideas with AI assistance
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} />
                  Create Idea
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Wand2 size={16} />
                  )}
                  AI Generate
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button
              variant="outline"
              onClick={refreshIdeas}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search content ideas..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="category-filter">Category</Label>
                    <Select
                      value={filters.category || 'all'}
                      onValueChange={(value) => handleFilterChange({ ...filters, category: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="platform-filter">Platform</Label>
                    <Select
                      value={filters.platform || 'all'}
                      onValueChange={(value) => handleFilterChange({ ...filters, platform: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) => handleFilterChange({ ...filters, status: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({});
                        setSearchQuery('');
                        fetchIdeas({}, 1);
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <X size={16} />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  <X size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : ideas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {ideas.map((idea, index) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200 group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {idea.title}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedIdea(idea)}>
                                <Eye size={14} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateIdea(idea.id)}>
                                <Copy size={14} className="mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleFavorite(idea.id)}>
                                {idea.isFavorite ? (
                                  <HeartOff size={14} className="mr-2" />
                                ) : (
                                  <Heart size={14} className="mr-2" />
                                )}
                                {idea.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(idea.id)}
                                className="text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {idea.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {idea.description}
                          </p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {idea.category}
                          </Badge>
                          {idea.platform && (
                            <Badge variant="outline" className="text-xs">
                              {idea.platform}
                            </Badge>
                          )}
                          {idea.aiGenerated && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              <Sparkles size={10} className="mr-1" />
                              AI
                            </Badge>
                          )}
                          {idea.isFavorite && (
                            <Badge className="text-xs bg-red-100 text-red-700">
                              <Heart size={10} className="mr-1" />
                              Favorite
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(idea)}
                              className="text-xs"
                            >
                              {copiedId === idea.id ? 'Copied!' : 'Copy'}
                              <Copy size={12} className="ml-1" />
                            </Button>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={pagination.page === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No content ideas yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first content idea or generating some with AI.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} className="mr-2" />
                  Create Idea
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(true)}
                >
                  <Wand2 size={16} className="mr-2" />
                  AI Generate
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Idea Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Content Idea</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newIdea.title || ''}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                placeholder="Enter idea title..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIdea.description || ''}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                placeholder="Describe your content idea..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newIdea.category}
                  onValueChange={(value) => setNewIdea({ ...newIdea, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={newIdea.platform || ''}
                  onValueChange={(value) => setNewIdea({ ...newIdea, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newIdea.content || ''}
                onChange={(e) => setNewIdea({ ...newIdea, content: e.target.value })}
                placeholder="Write your content here..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewIdea({
                  title: '',
                  description: '',
                  content: '',
                  category: 'general',
                  platform: '',
                  tags: [],
                  priority: 'medium',
                  status: 'draft',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateIdea}
              disabled={!newIdea.title}
              style={{ backgroundColor: primaryColor }}
            >
              Create Idea
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Ideas Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Content Ideas with AI</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt *</Label>
              <Textarea
                id="prompt"
                value={generateParams.prompt}
                onChange={(e) => setGenerateParams({ ...generateParams, prompt: e.target.value })}
                placeholder="Describe what kind of content ideas you want to generate..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="gen-category">Category</Label>
              <Select
                value={generateParams.category}
                onValueChange={(value) => setGenerateParams({ ...generateParams, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social-media">Social Media</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="gen-platform">Target Platform</Label>
              <Select
                value={generateParams.platform || ''}
                onValueChange={(value) => setGenerateParams({ ...generateParams, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="count">Number of Ideas</Label>
              <Select
                value={generateParams.count.toString()}
                onValueChange={(value) => setGenerateParams({ ...generateParams, count: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 ideas</SelectItem>
                  <SelectItem value="5">5 ideas</SelectItem>
                  <SelectItem value="10">10 ideas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateDialog(false);
                setGenerateParams({
                  prompt: '',
                  category: 'general',
                  platform: '',
                  count: 3,
                  tone: 'engaging',
                  targetAudience: '',
                  keywords: [],
                  saveToDatabase: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateIdeas}
              disabled={!generateParams.prompt || generating}
              style={{ backgroundColor: primaryColor }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Ideas'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Idea Details Dialog */}
      {selectedIdea && (
        <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedIdea.title}
                {selectedIdea.aiGenerated && (
                  <Badge className="bg-purple-100 text-purple-700">
                    <Sparkles size={12} className="mr-1" />
                    AI Generated
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedIdea.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedIdea.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{selectedIdea.category}</p>
                </div>
                {selectedIdea.platform && (
                  <div>
                    <Label>Platform</Label>
                    <p className="text-sm text-gray-600 mt-1 capitalize">{selectedIdea.platform}</p>
                  </div>
                )}
              </div>
              
              {selectedIdea.content && (
                <div>
                  <Label>Content</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedIdea.content}</p>
                  </div>
                </div>
              )}
              
              {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedIdea.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                Created: {new Date(selectedIdea.createdAt).toLocaleString()}
                {selectedIdea.updatedAt !== selectedIdea.createdAt && (
                  <span className="ml-4">
                    Updated: {new Date(selectedIdea.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedIdea)}
              >
                <Copy size={16} className="mr-2" />
                Copy Content
              </Button>
              <Button
                variant="outline"
                onClick={() => duplicateIdea(selectedIdea.id)}
              >
                <Copy size={16} className="mr-2" />
                Duplicate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Idea</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content idea? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIdea}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
