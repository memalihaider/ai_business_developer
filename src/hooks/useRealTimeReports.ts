import { useState, useEffect, useCallback, useRef } from 'react';

interface RealTimeMetrics {
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  averageDealValue: number;
  totalInvoices: number;
  totalInvoiceAmount: number;
  averageInvoiceAmount: number;
  totalCampaigns: number;
  totalContacts: number;
  totalPayments: number;
  totalPaymentAmount: number;
  emailOpenRate: number;
  emailClickRate: number;
  conversionRate: number;
}

interface TrendData {
  date: string;
  leads: number;
  deals: number;
  revenue: number;
}

interface RecentActivity {
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    updatedAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

interface RealTimeData {
  metrics: RealTimeMetrics;
  trends: TrendData[];
  recentActivity: RecentActivity;
  lastUpdated: string;
}

interface UseRealTimeReportsOptions {
  currency?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface UseRealTimeReportsReturn {
  data: RealTimeData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  isAutoRefreshing: boolean;
}

export const useRealTimeReports = ({
  currency = 'USD',
  refreshInterval = 30000, // 30 seconds default
  autoRefresh = false
}: UseRealTimeReportsOptions = {}): UseRealTimeReportsReturn => {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch real-time data
  const fetchRealTimeData = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      
      const params = new URLSearchParams({ currency });
      const response = await fetch(`/api/reports/realtime?${params}`, {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch real-time data');
      }
      
      setData(result.data);
      setLastUpdated(new Date());
      
      return result.data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't set error
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching real-time data:', err);
      throw err;
    }
  }, [currency]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      await fetchRealTimeData(abortControllerRef.current.signal);
    } finally {
      setLoading(false);
    }
  }, [fetchRealTimeData]);

  // Start auto refresh
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsAutoRefreshing(true);
    
    // Immediate fetch
    refresh();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchRealTimeData().catch(console.error);
    }, refreshInterval);
  }, [refresh, fetchRealTimeData, refreshInterval]);

  // Stop auto refresh
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoRefreshing(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      // Initial fetch without auto-refresh
      refresh();
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array for mount/unmount only

  // Handle currency changes
  useEffect(() => {
    if (isAutoRefreshing) {
      startAutoRefresh(); // Restart with new currency
    } else {
      refresh(); // Manual refresh with new currency
    }
  }, [currency]); // Only depend on currency changes

  // Handle refresh interval changes
  useEffect(() => {
    if (isAutoRefreshing) {
      startAutoRefresh(); // Restart with new interval
    }
  }, [refreshInterval]); // Only depend on refreshInterval changes

  // Visibility change handler - pause/resume auto-refresh when tab is hidden/visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, pause auto-refresh to save resources
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab is visible, resume auto-refresh if it was enabled
        if (isAutoRefreshing && !intervalRef.current) {
          startAutoRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAutoRefreshing, startAutoRefresh]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing
  };
};

export default useRealTimeReports;