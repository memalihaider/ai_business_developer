'use client';

import { useState, useEffect, useCallback } from 'react';

interface DashboardMetrics {
  leads: {
    total: number;
    thisMonth: number;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      company: string;
      createdAt: string;
    }>;
  };
  proposals: {
    total: number;
    sent: number;
    pending: number;
  };

  revenue: {
    total: number;
    thisQuarter: number;
    currency: string;
  };
  activities: string[];
  chartData: Array<{
    name: string;
    date: string;
    leads: number;
    proposals: number;

    revenue: number;
  }>;
  lastUpdated: string;
}

interface UseDashboardMetricsOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  onError?: (error: Error) => void;
}

interface UseDashboardMetricsReturn {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastFetched: Date | null;
}

export function useDashboardMetrics(options: UseDashboardMetricsOptions = {}): UseDashboardMetricsReturn {
  const {
    refreshInterval = 30000, // 30 seconds default
    autoRefresh = true,
    onError
  } = options;

  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/dashboard/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch metrics');
      }

      setData(result.data);
      setLastFetched(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      console.error('Dashboard metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchMetrics();
  }, [fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      // Only refresh if not currently loading and no error
      if (!loading && !error) {
        fetchMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, error, fetchMetrics]);

  // Visibility change handler - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        // Refresh if data is older than refresh interval
        if (lastFetched && Date.now() - lastFetched.getTime() > refreshInterval) {
          fetchMetrics();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, lastFetched, refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refresh,
    lastFetched
  };
}

// Additional hook for triggering manual updates
export function useDashboardActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger refresh');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMetric = useCallback(async (metricType: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update_metric', 
          data: { type: metricType, ...data } 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update metric');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    triggerRefresh,
    updateMetric,
    loading,
    error
  };
}

// Hook for real-time status indicator
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateLastSync = useCallback(() => {
    setLastSync(new Date());
  }, []);

  return {
    isOnline,
    lastSync,
    updateLastSync
  };
}