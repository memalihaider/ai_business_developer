import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for quotation template creation
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  content: z.string().min(1, 'Template content is required'),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    category: z.string().optional(),
  })).default([]),
  terms: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  currency: z.string().default('USD'),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional()
});

// GET /api/quotation-templates - List all quotation templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const isPublic = searchParams.get('isPublic');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (category) where.category = category;
    if (isPublic !== null) where.isPublic = isPublic === 'true';
    if (popular) where.isPopular = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [templates, total] = await Promise.all([
      prisma.quotationTemplate.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          taxRate: true,
          currency: true,
          isPublic: true,
          isPopular: true,
          usageCount: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { quotations: true }
          }
        },
        orderBy: popular 
          ? [{ isPopular: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quotationTemplate.count({ where })
    ]);
    
    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotation templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation templates' },
      { status: 500 }
    );
  }
}

// POST /api/quotation-templates - Create new quotation template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);
    
    const template = await prisma.quotationTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        content: validatedData.content,
        items: JSON.stringify(validatedData.items),
        terms: validatedData.terms,
        paymentTerms: validatedData.paymentTerms,
        taxRate: validatedData.taxRate,
        currency: validatedData.currency,
        isPublic: validatedData.isPublic,
        createdBy: validatedData.createdBy
      }
    });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create quotation template' },
      { status: 500 }
    );
  }
}