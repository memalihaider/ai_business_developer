import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// GET - Fetch all contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = {
        hasSome: tagArray
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      take: limit,
      skip: offset
    });

    // Transform contacts to match frontend expectations
    const contactsWithMetrics = contacts.map(contact => {
      return {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        jobTitle: contact.jobTitle,
        phone: contact.phone,
        status: contact.status,
        tags: contact.tags ? JSON.parse(contact.tags) : [],
        source: contact.source,
        lastEngaged: contact.lastEngaged?.toISOString().split('T')[0],
        activeCampaigns: 0,
        activeSequences: 0,
        totalCampaigns: 0,
        totalSequences: 0,
        customFields: contact.customFields ? JSON.parse(contact.customFields) : {},
        createdAt: contact.createdAt.toISOString().split('T')[0],
        updatedAt: contact.updatedAt.toISOString().split('T')[0]
      };
    });

    const total = await prisma.contact.count({ where });

    return NextResponse.json({
      contacts: contactsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST - Create new contact or bulk import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts: contactsData } = body;

    if (!contactsData) {
      // Single contact creation
      const { 
        email, 
        firstName, 
        lastName, 
        company, 
        position, 
        phone, 
        tags, 
        source,
        customFields
      } = body;

      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Check if contact already exists
      const existingContact = await prisma.contact.findUnique({
        where: { email }
      });

      if (existingContact) {
        return NextResponse.json(
          { error: 'Contact with this email already exists' },
          { status: 409 }
        );
      }

      const contact = await prisma.contact.create({
        data: {
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          company: company || '',
          jobTitle: position || '',
          phone: phone || '',
          status: 'active',
          tags: JSON.stringify(tags || []),
          source: source || 'manual',
          customFields: customFields ? JSON.stringify(customFields) : null
        }
      });

      return NextResponse.json({
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        jobTitle: contact.jobTitle,
        phone: contact.phone,
        status: contact.status,
        tags: contact.tags || [],
        source: contact.source,
        customFields: contact.customFields ? JSON.parse(contact.customFields) : {},
        createdAt: contact.createdAt.toISOString().split('T')[0],
        updatedAt: contact.updatedAt.toISOString().split('T')[0]
      }, { status: 201 });
    } else {
      // Bulk import
      if (!contactsData || !Array.isArray(contactsData)) {
        return NextResponse.json(
          { error: 'Contacts data must be an array' },
          { status: 400 }
        );
      }

      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[]
      };

      for (const contactData of contactsData) {
        try {
          if (!contactData.email) {
            results.skipped++;
            results.errors.push(`Skipped contact without email`);
            continue;
          }

          const existingContact = await prisma.contact.findUnique({
            where: { email: contactData.email }
          });

          if (existingContact) {
            // Update existing contact
            await prisma.contact.update({
              where: { email: contactData.email },
              data: {
                firstName: contactData.firstName || existingContact.firstName,
                lastName: contactData.lastName || existingContact.lastName,
                company: contactData.company || existingContact.company,
                position: contactData.position || existingContact.position,
                phone: contactData.phone || existingContact.phone,
                tags: contactData.tags || existingContact.tags,
                customFields: contactData.customFields ? 
                  JSON.stringify(contactData.customFields) : existingContact.customFields
              }
            });
            results.updated++;
          } else {
            // Create new contact
            await prisma.contact.create({
              data: {
                email: contactData.email,
                firstName: contactData.firstName || '',
                lastName: contactData.lastName || '',
                company: contactData.company || '',
                position: contactData.position || '',
                phone: contactData.phone || '',
                status: 'active',
                tags: contactData.tags || [],
                source: contactData.source || 'import',
                customFields: contactData.customFields ? 
                  JSON.stringify(contactData.customFields) : null
              }
            });
            results.created++;
          }
        } catch (error) {
          results.errors.push(`Error processing ${contactData.email}: ${error}`);
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`
      });
    }
  } catch (error) {
    console.error('Error creating/importing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to create/import contacts' },
      { status: 500 }
    );
  }
}

// PUT - Update contact
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      email, 
      firstName, 
      lastName, 
      company, 
      position, 
      phone, 
      status, 
      tags,
      customFields
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it conflicts with existing contact
    if (email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (existingContact) {
        return NextResponse.json(
          { error: 'Another contact with this email already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (company !== undefined) updateData.company = company;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (tags) updateData.tags = tags;
    if (customFields) updateData.customFields = JSON.stringify(customFields);

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      id: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      position: contact.position,
      phone: contact.phone,
      status: contact.status,
      tags: contact.tags || [],
      source: contact.source,
      customFields: contact.customFields ? JSON.parse(contact.customFields) : {},
      createdAt: contact.createdAt.toISOString().split('T')[0],
      updatedAt: contact.updatedAt.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact(s)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Contact ID or IDs are required' },
        { status: 400 }
      );
    }

    if (id) {
      // Single contact deletion
      await prisma.contact.delete({
        where: { id }
      });
    } else if (ids) {
      // Bulk deletion
      const idArray = ids.split(',');
      await prisma.contact.deleteMany({
        where: {
          id: {
            in: idArray
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact(s):', error);
    return NextResponse.json(
      { error: 'Failed to delete contact(s)' },
      { status: 500 }
    );
  }
}
