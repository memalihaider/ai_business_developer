import { NextRequest, NextResponse } from 'next/server';
import { clientOperations } from '@/lib/db';

// GET /api/clients/stats - Get real-time client statistics
export async function GET(request: NextRequest) {
  try {
    const clients = await clientOperations.getAllClients();
    
    // Calculate statistics
    const totalClients = clients.length;
    const clientsWithLeads = clients.filter(client => client.leadId).length;
    const industries = [...new Set(clients.map(client => client.industry).filter(Boolean))];
    const totalIndustries = industries.length;
    
    // Calculate recent activity (clients created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClients = clients.filter(client => 
      new Date(client.createdAt) > thirtyDaysAgo
    ).length;
    
    // Industry distribution
    const industryStats = clients.reduce((acc, client) => {
      if (client.industry) {
        acc[client.industry] = (acc[client.industry] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Monthly growth (simplified)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyClients = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    }).length;
    
    const stats = {
      totalClients,
      clientsWithLeads,
      totalIndustries,
      recentClients,
      monthlyClients,
      industryStats,
      industries,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({ stats }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client statistics' },
      { status: 500 }
    );
  }
}