import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type Proposal = {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  timeline?: string;
  budget?: string;
  type: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  content?: string;
  sections?: string;
  templateId?: string;
  leadId?: string;
  isDraft: boolean;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type AnalyticsSummary = {
  totalProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  pendingProposals: number;
  conversionRate: number;
  totalValue: number;
  recentActivity: any[];
  monthlyTrends: any[];
};

export function useRealTimeProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load data function
  const loadData = useCallback(async (showNotification = false) => {
    try {
      setError(null);
      const [proposalsRes, analyticsRes] = await Promise.all([
        fetch('/api/proposals', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        fetch('/api/analytics/summary', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      ]);
      
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        
        // Check for status changes if we have existing data
        if (proposals.length > 0 && showNotification) {
          const statusChanges = proposalsData.filter((newProposal: Proposal) => {
            const oldProposal = proposals.find(p => p.id === newProposal.id);
            return oldProposal && oldProposal.status !== newProposal.status;
          });
          
          // Show notifications for status changes
          statusChanges.forEach((proposal: Proposal) => {
            const oldStatus = proposals.find(p => p.id === proposal.id)?.status;
            toast.success(
              `Proposal "${proposal.title}" status changed from ${oldStatus} to ${proposal.status}`,
              {
                description: `Client: ${proposal.clientName}`,
                duration: 5000,
              }
            );
          });
          
          // Check for new proposals
          const newProposals = proposalsData.filter((newProposal: Proposal) => 
            !proposals.find(p => p.id === newProposal.id)
          );
          
          newProposals.forEach((proposal: Proposal) => {
            toast.info(
              `New proposal created: "${proposal.title}"`,
              {
                description: `Client: ${proposal.clientName}`,
                duration: 4000,
              }
            );
          });
        }
        
        setProposals(proposalsData);
      } else {
        throw new Error('Failed to fetch proposals');
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        console.warn('Failed to fetch analytics data');
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      
      if (showNotification) {
        toast.error('Failed to refresh data', {
          description: 'Please check your connection and try again',
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [proposals]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    await loadData(true);
    toast.success('Data refreshed successfully', {
      duration: 2000,
    });
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    // Initial load
    loadData(false);
    
    // Set up polling interval
    const interval = setInterval(() => {
      loadData(true);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Listen for visibility changes to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, refresh data
        loadData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Connection restored', {
        description: 'Refreshing data...',
        duration: 2000,
      });
      loadData(true);
    };

    const handleOffline = () => {
      toast.warning('Connection lost', {
        description: 'Data may not be up to date',
        duration: 3000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  return {
    proposals,
    analytics,
    loading,
    error,
    lastUpdated,
    refreshData,
    loadData
  };
}