import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all assignments
export async function GET() {
  try {
    const assignments = await prisma.teamAssignment.findMany({
      include: {
        teamMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            role: true,
            photoUrl: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            deadline: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST - Create new assignment(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      teamMemberId,
      department,
      assignmentType,
      status = 'assigned',
      notes
    } = body;

    // Validation
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!assignmentType || !['individual', 'department'].includes(assignmentType)) {
      return NextResponse.json(
        { error: 'Valid assignment type is required (individual or department)' },
        { status: 400 }
      );
    }

    if (assignmentType === 'individual' && !teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required for individual assignments' },
        { status: 400 }
      );
    }

    if (assignmentType === 'department' && !department) {
      return NextResponse.json(
        { error: 'Department is required for department assignments' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['assigned', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let createdAssignments = [];

    if (assignmentType === 'individual') {
      // Check if team member exists
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: teamMemberId }
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        );
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.teamAssignment.findFirst({
        where: {
          projectId,
          teamMemberId,
          status: {
            not: 'cancelled'
          }
        }
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'This team member is already assigned to this project' },
          { status: 400 }
        );
      }

      // Create individual assignment
      const assignment = await prisma.teamAssignment.create({
        data: {
          projectId,
          teamMemberId,
          role: 'Team Member', // Default role for assignments
          status,
          notes: notes?.trim() || null
        },
        include: {
          teamMember: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              role: true,
              photoUrl: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              priority: true,
              deadline: true
            }
          }
        }
      });

      createdAssignments.push(assignment);
    } else {
      // Department assignment - assign to all members in the department
      const departmentMembers = await prisma.teamMember.findMany({
        where: { department }
      });

      if (departmentMembers.length === 0) {
        return NextResponse.json(
          { error: 'No team members found in the specified department' },
          { status: 404 }
        );
      }

      // Check for existing assignments
      const existingAssignments = await prisma.teamAssignment.findMany({
        where: {
          projectId,
          teamMemberId: {
            in: departmentMembers.map(member => member.id)
          },
          status: {
            not: 'cancelled'
          }
        },
        include: {
          teamMember: true
        }
      });

      const alreadyAssignedMembers = existingAssignments.map(assignment => assignment.teamMember.name);
      
      if (alreadyAssignedMembers.length > 0) {
        return NextResponse.json(
          { 
            error: `Some team members are already assigned to this project: ${alreadyAssignedMembers.join(', ')}` 
          },
          { status: 400 }
        );
      }

      // Create assignments for all department members
      const assignmentPromises = departmentMembers.map(member => 
        prisma.teamAssignment.create({
          data: {
            projectId,
            teamMemberId: member.id,
            role: 'Team Member', // Default role for department assignments
            status,
            notes: notes?.trim() || null
          },
          include: {
            teamMember: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                role: true,
                photoUrl: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                priority: true,
                deadline: true
              }
            }
          }
        })
      );

      createdAssignments = await Promise.all(assignmentPromises);
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdAssignments.length} assignment(s)`,
        assignments: createdAssignments
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

// PUT - Update an assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.teamAssignment.findUnique({
      where: { id }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['assigned', 'in-progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const assignment = await prisma.teamAssignment.update({
      where: { id },
      data: updateData,
      include: {
        teamMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            role: true,
            photoUrl: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            deadline: true
          }
        }
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.teamAssignment.findUnique({
      where: { id }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    await prisma.teamAssignment.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Assignment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}