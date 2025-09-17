import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get total team members
    const totalMembers = await prisma.teamMember.count({
      where: { status: 'active' }
    });

    // Get total projects
    const totalProjects = await prisma.project.count();

    // Get active projects
    const activeProjects = await prisma.project.count({
      where: { status: 'active' }
    });

    // Get completed projects
    const completedProjects = await prisma.project.count({
      where: { status: 'completed' }
    });

    // Get pending assignments
    const pendingAssignments = await prisma.teamAssignment.count({
      where: { status: 'assigned' }
    });

    // Get department breakdown
    const departmentData = await prisma.teamMember.groupBy({
      by: ['department'],
      where: { status: 'active' },
      _count: {
        id: true
      }
    });

    const departments = departmentData.map(dept => ({
      name: dept.department,
      count: dept._count.id
    }));

    const dashboardStats = {
      totalMembers,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingAssignments,
      departments
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}