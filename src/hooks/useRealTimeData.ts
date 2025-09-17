import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRealTimeDataOptions {
  endpoint: string;
  interval?: number; // in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UseRealTimeDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useRealTimeData<T = any>({
  endpoint,
  interval = 30000, // 30 seconds default
  enabled = true,
  onError,
  onSuccess
}: UseRealTimeDataOptions): UseRealTimeDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, onError, onSuccess]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    if (interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, interval, enabled]);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Page is visible, resume polling
        if (enabled && interval > 0 && !intervalRef.current) {
          intervalRef.current = setInterval(fetchData, interval);
          // Also fetch immediately when page becomes visible
          fetchData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, interval, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated
  };
}

// Specialized hook for client data
export function useRealTimeClients() {
  return useRealTimeData<{ clients: any[] }>({
    endpoint: '/api/clients',
    interval: 30000, // 30 seconds
  });
}

// Specialized hook for client statistics
export function useRealTimeClientStats() {
  return useRealTimeData<any>({
    endpoint: '/api/clients/stats',
    interval: 15000, // 15 seconds for stats
  });
}