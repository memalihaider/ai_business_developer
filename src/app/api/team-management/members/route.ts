import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      role,
      position,
      photoUrl,
      hireDate,
      salary,
      skills,
      bio
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !department || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, department, role' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 409 }
      );
    }

    const newMember = await prisma.teamMember.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        department,
        role,
        position,
        photoUrl,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
        skills: skills ? JSON.stringify(skills) : null,
        bio
      }
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      department,
      role,
      position,
      photoUrl,
      status,
      hireDate,
      salary,
      skills,
      bio
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        department,
        role,
        position,
        photoUrl,
        status,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
        skills: skills ? JSON.stringify(skills) : null,
        bio
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}