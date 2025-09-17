import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// GET /api/templates/stats - Get template statistics
export async function GET(request: NextRequest) {
  try {
    // Get total templates count
    const totalTemplates = await prisma.proposalTemplate.count();

    // Get public templates count
    const publicTemplates = await prisma.proposalTemplate.count({
      where: {
        isPublic: true
      }
    });

    // Get private templates count
    const privateTemplates = totalTemplates - publicTemplates;

    // Get templates by category
    const templatesByCategory = await prisma.proposalTemplate.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get templates by type
    const templatesByType = await prisma.proposalTemplate.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get recent templates (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTemplates = await prisma.proposalTemplate.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get most used templates (mock data based on proposals count)
    const mostUsedTemplates = await prisma.proposalTemplate.findMany({
      include: {
        _count: {
          select: {
            proposals: true
          }
        }
      },
      orderBy: {
        proposals: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Calculate usage statistics
    const totalUsage = mostUsedTemplates.reduce((sum, template) => 
      sum + (template._count?.proposals || 0), 0
    );

    // Get templates created this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const templatesThisMonth = await prisma.proposalTemplate.count({
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    });

    // Calculate growth rate (mock calculation)
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const templatesLastMonth = await prisma.proposalTemplate.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: thisMonth
        }
      }
    });

    const growthRate = templatesLastMonth > 0 
      ? ((templatesThisMonth - templatesLastMonth) / templatesLastMonth) * 100 
      : 0;

    // Generate usage trend data (mock data for the last 7 days)
    const usageTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      usageTrend.push({
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 50) + 10
      });
    }

    // Generate category distribution data
    const categoryDistribution = templatesByCategory.map(item => ({
      name: item.category,
      value: item._count.id,
      percentage: ((item._count.id / totalTemplates) * 100).toFixed(1)
    }));

    // Generate type distribution data
    const typeDistribution = templatesByType.map(item => ({
      name: item.type,
      value: item._count.id,
      percentage: ((item._count.id / totalTemplates) * 100).toFixed(1)
    }));

    const stats = {
      overview: {
        totalTemplates,
        publicTemplates,
        privateTemplates,
        recentTemplates,
        templatesThisMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        totalUsage,
        averageRating: 4.2, // Mock average rating
        totalDownloads: Math.floor(Math.random() * 1000) + 500
      },
      distribution: {
        byCategory: categoryDistribution,
        byType: typeDistribution
      },
      trends: {
        usage: usageTrend,
        creation: usageTrend.map(item => ({
          ...item,
          usage: Math.floor(Math.random() * 10) + 1
        }))
      },
      topTemplates: mostUsedTemplates.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        type: template.type,
        usageCount: template._count?.proposals || 0,
        rating: Math.random() * 2 + 3,
        downloads: Math.floor(Math.random() * 100) + 10
      })),
      performance: {
        conversionRate: Math.random() * 20 + 70, // 70-90%
        successRate: Math.random() * 15 + 80, // 80-95%
        userSatisfaction: Math.random() * 1 + 4, // 4-5 stars
        responseTime: Math.random() * 500 + 200 // 200-700ms
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching template stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template statistics' },
      { status: 500 }
    );
  }
}
