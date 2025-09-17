import { NextRequest } from 'next/server';
import { getRealTimeMetrics, checkDatabaseHealth } from '@/lib/database/analytics-queries';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-static';


// Store active connections
const connections = new Set<ReadableStreamDefaultController>();
let connectionCount = 0;

// Real-time data generator using database
const generateRealtimeData = async () => {
  try {
    // Try to get from cache first
    const cached = await cache.get(CacheKeys.realtimeMetrics());
    if (cached) {
      return cached;
    }

    // Fetch fresh data from database
    const dbMetrics = await getRealTimeMetrics();
    
    const realtimeMetrics = {
      timestamp: dbMetrics.timestamp.toISOString(),
      totalFollowers: Math.floor(Math.random() * 1000) + 125000,
      totalEngagement: dbMetrics.recentEngagement || Math.floor(Math.random() * 500) + 45000,
      totalReach: Math.floor(Math.random() * 10000) + 890000,
      totalImpressions: Math.floor(Math.random() * 50000) + 1200000,
      avgEngagementRate: (Math.random() * 2 + 3.5).toFixed(1),
      activeConnections: dbMetrics.activeConnections,
      platformMetrics: await generatePlatformMetrics(),
      liveActivity: {
        newFollowers: Math.floor(Math.random() * 50),
        newEngagements: Math.floor(Math.random() * 200),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        onlinePlatforms: Math.floor(Math.random() * 5) + 1
      },
      alerts: generateAlerts()
    };

    // Cache for short duration
    await cache.set(CacheKeys.realtimeMetrics(), realtimeMetrics, CacheTTL.REALTIME);
    
    return realtimeMetrics;
  } catch (error) {
    console.error('Error generating real-time data:', error);
    // Fallback to mock data
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    const currentTime = new Date();
    
    return {
      timestamp: currentTime.toISOString(),
      totalFollowers: Math.floor(Math.random() * 1000) + 125000,
      totalEngagement: Math.floor(Math.random() * 500) + 45000,
      totalReach: Math.floor(Math.random() * 10000) + 890000,
      totalImpressions: Math.floor(Math.random() * 50000) + 1200000,
      avgEngagementRate: (Math.random() * 2 + 3.5).toFixed(1),
      platformMetrics: platforms.map(platform => ({
        platformId: platform,
        platformName: platform.charAt(0).toUpperCase() + platform.slice(1),
        followers: Math.floor(Math.random() * 5000) + 10000,
        engagement: Math.floor(Math.random() * 1000) + 2000,
        reach: Math.floor(Math.random() * 20000) + 50000,
        impressions: Math.floor(Math.random() * 50000) + 100000,
        clicks: Math.floor(Math.random() * 500) + 1000,
        shares: Math.floor(Math.random() * 100) + 200,
        likes: Math.floor(Math.random() * 1000) + 3000,
        comments: Math.floor(Math.random() * 200) + 500,
        posts: Math.floor(Math.random() * 10) + 20,
        growthRate: (Math.random() * 10 + 5).toFixed(1),
        engagementRate: (Math.random() * 5 + 2).toFixed(1),
        trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      })),
      liveActivity: {
        newFollowers: Math.floor(Math.random() * 50),
        newEngagements: Math.floor(Math.random() * 200),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        onlinePlatforms: Math.floor(Math.random() * 5) + 1
      },
      alerts: generateAlerts()
    };
  }
};

// Generate platform metrics with caching
const generatePlatformMetrics = async () => {
  try {
    const cacheKey = 'realtime:platform-metrics';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // In a real implementation, this would fetch from database
    // For now, using mock data with some database integration
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    const metrics = platforms.map(platform => ({
      platformId: platform,
      platformName: platform.charAt(0).toUpperCase() + platform.slice(1),
      followers: Math.floor(Math.random() * 5000) + 10000,
      engagement: Math.floor(Math.random() * 1000) + 2000,
      reach: Math.floor(Math.random() * 20000) + 50000,
      impressions: Math.floor(Math.random() * 50000) + 100000,
      clicks: Math.floor(Math.random() * 500) + 1000,
      shares: Math.floor(Math.random() * 100) + 200,
      likes: Math.floor(Math.random() * 1000) + 3000,
      comments: Math.floor(Math.random() * 200) + 500,
      posts: Math.floor(Math.random() * 10) + 20,
      growthRate: (Math.random() * 10 + 5).toFixed(1),
      engagementRate: (Math.random() * 5 + 2).toFixed(1),
      trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
    }));

    await cache.set(cacheKey, metrics, CacheTTL.REALTIME);
    return metrics;
  } catch (error) {
    console.error('Error generating platform metrics:', error);
    // Fallback to mock data
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    return platforms.map(platform => ({
      platformId: platform,
      platformName: platform.charAt(0).toUpperCase() + platform.slice(1),
      followers: Math.floor(Math.random() * 5000) + 10000,
      engagement: Math.floor(Math.random() * 1000) + 2000,
      reach: Math.floor(Math.random() * 20000) + 50000,
      impressions: Math.floor(Math.random() * 50000) + 100000,
      clicks: Math.floor(Math.random() * 500) + 1000,
      shares: Math.floor(Math.random() * 100) + 200,
      likes: Math.floor(Math.random() * 1000) + 3000,
      comments: Math.floor(Math.random() * 200) + 500,
      posts: Math.floor(Math.random() * 10) + 20,
      growthRate: (Math.random() * 10 + 5).toFixed(1),
      engagementRate: (Math.random() * 5 + 2).toFixed(1),
      trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
    }));
  }
};

// Generate real-time alerts
const generateAlerts = () => {
  const alertTypes = [
    { type: 'spike', message: 'Engagement spike detected on Instagram', severity: 'info' },
    { type: 'milestone', message: 'Reached 10K followers on Twitter!', severity: 'success' },
    { type: 'warning', message: 'Low engagement rate on Facebook posts', severity: 'warning' },
    { type: 'error', message: 'API rate limit reached for LinkedIn', severity: 'error' }
  ];
  
  const alerts = [];
  const numAlerts = Math.floor(Math.random() * 3); // 0-2 alerts
  
  for (let i = 0; i < numAlerts; i++) {
    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    alerts.push({
      id: `alert_${Date.now()}_${i}`,
      ...alert,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
};

// Broadcast data to all connected clients
const broadcastToClients = async (data: any) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  
  // Create a copy of connections to avoid modification during iteration
  const activeConnections = Array.from(connections);
  
  activeConnections.forEach(controller => {
    try {
      // Check if the controller is still writable
      if (controller.desiredSize !== null) {
        controller.enqueue(encoder.encode(message));
      } else {
        // Controller is closed, remove it
        connections.delete(controller);
      }
    } catch (error) {
      console.error('Error sending data to client:', error);
      connections.delete(controller);
    }
  });
};

// Start real-time data broadcasting
let broadcastInterval: NodeJS.Timeout | null = null;

const startBroadcasting = () => {
  if (broadcastInterval) return;
  
  broadcastInterval = setInterval(async () => {
    if (connections.size === 0) {
      // Stop broadcasting if no clients connected
      if (broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
      }
      return;
    }
    
    try {
      const realtimeData = await generateRealtimeData();
      await broadcastToClients(realtimeData);
    } catch (error) {
      console.error('Error generating real-time data:', error);
    }
  }, 2000); // Update every 2 seconds
};

// Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || `client_${Date.now()}`;
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to active connections
      connections.add(controller);
      
      // Send initial connection message
      const welcomeMessage = `data: ${JSON.stringify({
        type: 'connection',
        clientId,
        message: 'Connected to real-time analytics',
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(welcomeMessage));
      
      // Send initial data
      generateRealtimeData().then(data => {
        const initialMessage = `data: ${JSON.stringify({
          type: 'initial',
          ...data
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initialMessage));
      });
      
      // Start broadcasting if not already started
      startBroadcasting();
      
      console.log(`Client ${clientId} connected. Total connections: ${connections.size}`);
    },
    
    cancel() {
      // Remove connection when client disconnects
      connections.delete(controller);
      console.log(`Client ${clientId} disconnected. Total connections: ${connections.size}`);
      
      // Stop broadcasting if no clients
      if (connections.size === 0 && broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
        console.log('Stopped real-time broadcasting - no active connections');
      }
    }
  });
  
  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Health check endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'status':
        return Response.json({
          success: true,
          connections: connections.size,
          broadcasting: broadcastInterval !== null,
          timestamp: new Date().toISOString()
        });
        
      case 'broadcast':
        const { data } = body;
        await broadcastToClients({
          type: 'manual',
          ...data,
          timestamp: new Date().toISOString()
        });
        return Response.json({ success: true, message: 'Data broadcasted' });
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Real-time API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control'
    }
  });
}
