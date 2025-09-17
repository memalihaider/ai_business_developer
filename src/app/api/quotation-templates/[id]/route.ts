import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for quotation template updates
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  content: z.string().min(1, 'Template content is required').optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    category: z.string().optional(),
  })).optional(),
  terms: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().optional(),
  isPublic: z.boolean().optional(),
  isPopular: z.boolean().optional()
});

// GET /api/quotation-templates/[id] - Get single quotation template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { quotations: true }
        }
      }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Quotation template not found' },
        { status: 404 }
      );
    }
    
    // Parse items JSON
    const templateWithParsedItems = {
      ...template,
      items: template.items ? JSON.parse(template.items) : []
    };
    
    return NextResponse.json(templateWithParsedItems);
  } catch (error) {
    console.error('Error fetching quotation template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation template' },
      { status: 500 }
    );
  }
}

// PUT /api/quotation-templates/[id] - Update quotation template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);
    
    // Check if template exists
    const existingTemplate = await prisma.quotationTemplate.findUnique({
      where: { id: params.id }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Quotation template not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Convert items array to JSON string if provided
    if (validatedData.items) {
      updateData.items = JSON.stringify(validatedData.items);
    }
    
    const template = await prisma.quotationTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { quotations: true }
        }
      }
    });
    
    // Parse items JSON for response
    const templateWithParsedItems = {
      ...template,
      items: template.items ? JSON.parse(template.items) : []
    };
    
    return NextResponse.json(templateWithParsedItems);
  } catch (error) {
    console.error('Error updating quotation template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update quotation template' },
      { status: 500 }
    );
  }
}

// DELETE /api/quotation-templates/[id] - Delete quotation template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if template exists
    const existingTemplate = await prisma.quotationTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { quotations: true }
        }
      }
    });
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Quotation template not found' },
        { status: 404 }
      );
    }
    
    // Check if template is being used by quotations
    if (existingTemplate._count.quotations > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete template that is being used by quotations',
          quotationsCount: existingTemplate._count.quotations
        },
        { status: 400 }
      );
    }
    
    // Delete template
    await prisma.quotationTemplate.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Quotation template deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting quotation template:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation template' },
      { status: 500 }
    );
  }
}