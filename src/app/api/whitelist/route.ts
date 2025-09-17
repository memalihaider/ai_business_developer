import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'whitelist' or 'blacklist'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    if (type && (type === 'whitelist' || type === 'blacklist')) {
      where.type = type;
    }

    const [entries, total] = await Promise.all([
      prisma.emailList.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emailList.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      success: true,
    });
  } catch (error) {
    console.error('Error fetching email list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, type, reason } = body;

    // Validate required fields
    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'whitelist' && type !== 'blacklist') {
      return NextResponse.json(
        { error: 'Type must be either whitelist or blacklist' },
        { status: 400 }
      );
    }

    // Check if email already exists in the list
    const existingEntry = await prisma.emailList.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        userId: session.user.id,
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: `Email already exists in ${type}` },
        { status: 409 }
      );
    }

    // Create new entry
    const entry = await prisma.emailList.create({
      data: {
        email: email.toLowerCase(),
        type,
        reason: reason || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ entry, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding email to list:', error);
    return NextResponse.json(
      { error: 'Failed to add email to list' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingEntry = await prisma.emailList.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await prisma.emailList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email list entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}

// Utility function to check if email is whitelisted or blacklisted
export async function checkEmailStatus(email: string, userId: string) {
  try {
    const entries = await prisma.emailList.findMany({
      where: {
        email: email.toLowerCase(),
        userId,
      },
    });

    const whitelist = entries.find(entry => entry.type === 'whitelist');
    const blacklist = entries.find(entry => entry.type === 'blacklist');

    return {
      isWhitelisted: !!whitelist,
      isBlacklisted: !!blacklist,
      whitelistEntry: whitelist,
      blacklistEntry: blacklist,
    };
  } catch (error) {
    console.error('Error checking email status:', error);
    return {
      isWhitelisted: false,
      isBlacklisted: false,
      whitelistEntry: null,
      blacklistEntry: null,
    };
  }
}