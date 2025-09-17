import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ContentIdea {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category: string;
  platform?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
  aiPrompt?: string;
  aiModel?: string;
  userId?: string;
  isPublic: boolean;
  isFavorite: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  _count?: {
    analytics: number;
  };
}

export interface ContentIdeaFilters {
  category?: string;
  platform?: string;
  status?: string;
  userId?: string;
  search?: string;
  isFavorite?: boolean;
}

export interface GenerateIdeaParams {
  prompt: string;
  category?: string;
  platform?: string;
  count?: number;
  tone?: 'professional' | 'casual' | 'creative' | 'informative' | 'engaging';
  targetAudience?: string;
  keywords?: string[];
  userId?: string;
  saveToDatabase?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UseContentIdeasReturn {
  // State
  ideas: ContentIdea[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  generating: boolean;
  
  // Actions
  fetchIdeas: (filters?: ContentIdeaFilters, page?: number, limit?: number) => Promise<void>;
  createIdea: (idea: Partial<ContentIdea>) => Promise<ContentIdea | null>;
  updateIdea: (id: string, updates: Partial<ContentIdea>) => Promise<ContentIdea | null>;
  deleteIdea: (id: string) => Promise<boolean>;
  generateIdeas: (params: GenerateIdeaParams) => Promise<ContentIdea[] | null>;
  toggleFavorite: (id: string) => Promise<void>;
  duplicateIdea: (id: string) => Promise<ContentIdea | null>;
  
  // Utility functions
  clearError: () => void;
  refreshIdeas: () => Promise<void>;
}

const API_BASE = '/api/content-ideas';

export function useContentIdeas(initialFilters?: ContentIdeaFilters): UseContentIdeasReturn {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [currentFilters, setCurrentFilters] = useState<ContentIdeaFilters>(initialFilters || {});

  const { token, isAuthenticated } = useAuth();
  
  const getAuthHeaders = useCallback(() => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchIdeas = useCallback(async (
    filters: ContentIdeaFilters = {},
    page: number = 1,
    limit: number = 10
  ) => {
    if (!isAuthenticated || !token) {
      setIdeas([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE}?${searchParams}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        toast.error('Please log in to access your content ideas');
        return;
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content ideas');
      }

      setIdeas(data.data);
      setPagination(data.pagination);
      setCurrentFilters(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, getAuthHeaders]);

  const createIdea = useCallback(async (ideaData: Partial<ContentIdea>): Promise<ContentIdea | null> => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to create content ideas');
      return null;
    }
    
    try {
      setError(null);
      
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ideaData),
      });
      
      if (response.status === 401) {
        toast.error('Please log in to create content ideas');
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create content idea');
      }

      const newIdea = data.data;
      setIdeas(prev => [newIdea, ...prev]);
      toast.success('Content idea created successfully!');
      
      return newIdea;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [isAuthenticated, token, getAuthHeaders]);

  const updateIdea = useCallback(async (id: string, updates: Partial<ContentIdea>): Promise<ContentIdea | null> => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to update content ideas');
      return null;
    }
    
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (response.status === 401) {
        toast.error('Please log in to update content ideas');
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update content idea');
      }

      const updatedIdea = data.data;
      setIdeas(prev => prev.map(idea => idea.id === id ? updatedIdea : idea));
      toast.success('Content idea updated successfully!');
      
      return updatedIdea;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [isAuthenticated, token, getAuthHeaders]);

  const deleteIdea = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to delete content ideas');
      return false;
    }
    
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        toast.error('Please log in to delete content ideas');
        return false;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete content idea');
      }

      setIdeas(prev => prev.filter(idea => idea.id !== id));
      toast.success('Content idea deleted successfully!');
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isAuthenticated, token, getAuthHeaders]);

  const generateIdeas = useCallback(async (params: GenerateIdeaParams): Promise<ContentIdea[] | null> => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to generate content ideas');
      return null;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      });
      
      if (response.status === 401) {
        toast.error('Please log in to generate content ideas');
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content ideas');
      }

      const generatedIdeas = data.data;
      
      if (params.saveToDatabase !== false) {
        setIdeas(prev => [...generatedIdeas, ...prev]);
      }
      
      toast.success(`Generated ${generatedIdeas.length} content idea${generatedIdeas.length > 1 ? 's' : ''}!`);
      
      return generatedIdeas;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, [isAuthenticated, token, getAuthHeaders]);

  const toggleFavorite = useCallback(async (id: string) => {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;

    await updateIdea(id, { isFavorite: !idea.isFavorite });
  }, [ideas, updateIdea]);

  const duplicateIdea = useCallback(async (id: string): Promise<ContentIdea | null> => {
    const idea = ideas.find(i => i.id === id);
    if (!idea) {
      toast.error('Content idea not found');
      return null;
    }

    const duplicatedIdea = {
      title: `${idea.title} (Copy)`,
      description: idea.description,
      content: idea.content,
      category: idea.category,
      platform: idea.platform,
      tags: idea.tags,
      priority: idea.priority,
      userId: idea.userId,
    };

    return await createIdea(duplicatedIdea);
  }, [ideas, createIdea]);

  const refreshIdeas = useCallback(async () => {
    await fetchIdeas(currentFilters, pagination.page, pagination.limit);
  }, [fetchIdeas, currentFilters, pagination.page, pagination.limit]);

  // Initial fetch and when authentication changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchIdeas(initialFilters);
    }
  }, [isAuthenticated, token]);

  return {
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
  };
}