import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimeData {
  timestamp: string;
  totalFollowers: number;
  totalEngagement: number;
  totalReach: number;
  totalImpressions: number;
  avgEngagementRate: string;
  platformMetrics: Array<{
    platformId: string;
    platformName: string;
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
    clicks: number;
    shares: number;
    likes: number;
    comments: number;
    posts: number;
    growthRate: string;
    engagementRate: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  liveActivity: {
    newFollowers: number;
    newEngagements: number;
    activeUsers: number;
    onlinePlatforms: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
  }>;
}

interface UseRealtimeAnalyticsOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onData?: (data: RealtimeData) => void;
}

interface UseRealtimeAnalyticsReturn {
  data: RealtimeData | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionCount: number;
  lastUpdated: Date | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  clearError: () => void;
}

export function useRealtimeAnalytics(options: UseRealtimeAnalyticsOptions = {}): UseRealtimeAnalyticsReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onError,
    onConnect,
    onDisconnect,
    onData
  } = options;

  const [data, setData] = useState<RealtimeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const clientIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
    
    onDisconnect?.();
  }, [onDisconnect]);

  const connectInternal = useCallback(() => {
    if (eventSourceRef.current || isConnecting) {
      return; // Already connected or connecting
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Social analytics API has been removed - using mock connection
      const url = `data:text/plain,{"type":"connection","message":"Social analytics disabled"}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
        console.log('Real-time analytics connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          
          if (parsedData.type === 'connection') {
            console.log('Connection established:', parsedData.message);
            return;
          }
          
          if (parsedData.type === 'initial' || !parsedData.type) {
            const realtimeData: RealtimeData = {
              timestamp: parsedData.timestamp,
              totalFollowers: parsedData.totalFollowers,
              totalEngagement: parsedData.totalEngagement,
              totalReach: parsedData.totalReach,
              totalImpressions: parsedData.totalImpressions,
              avgEngagementRate: parsedData.avgEngagementRate,
              platformMetrics: parsedData.platformMetrics,
              liveActivity: parsedData.liveActivity,
              alerts: parsedData.alerts || []
            };
            
            setData(realtimeData);
            setLastUpdated(new Date());
            onData?.(realtimeData);
          }
        } catch (parseError) {
          console.error('Error parsing real-time data:', parseError);
          setError('Failed to parse real-time data');
        }
      };

      eventSource.onerror = (event) => {
        console.error('EventSource error:', event);
        setIsConnected(false);
        setIsConnecting(false);
        
        const errorMessage = 'Real-time connection error';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            connectInternal();
          }, reconnectInterval);
        } else {
          setError(`Failed to connect after ${maxReconnectAttempts} attempts`);
        }
      };

    } catch (connectError) {
      console.error('Failed to establish connection:', connectError);
      setError('Failed to establish real-time connection');
      setIsConnecting(false);
      onError?.(connectError as Error);
    }
  }, [isConnecting, onConnect, onData, onError, maxReconnectAttempts, reconnectInterval]);

  const connect = useCallback(() => {
    connectInternal();
  }, [connectInternal]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      connectInternal();
    }, 1000);
  }, [disconnect]);

  // Auto-connect and cleanup effect
  useEffect(() => {
    if (autoConnect) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update connection count periodically - only when connected
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const updateConnectionCount = async () => {
      try {
        // Social analytics API has been removed
        const response = { ok: false };
        
        if (response.ok) {
          const status = await response.json();
          setConnectionCount(status.connections || 0);
        }
      } catch (error) {
        console.error('Failed to get connection status:', error);
      }
    };

    const interval = setInterval(updateConnectionCount, 10000); // Update every 10 seconds
    updateConnectionCount(); // Initial call

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    data,
    isConnected,
    isConnecting,
    error,
    connectionCount,
    lastUpdated,
    connect,
    disconnect,
    reconnect,
    clearError
  };
}