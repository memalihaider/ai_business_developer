import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeSystem = searchParams.get("includeSystem") === "true";

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ];
    }

    if (!includeSystem) {
      where.isSystem = false;
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        thumbnail: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usageStats: true
          }
        }
      },
      orderBy: [
        { isSystem: "desc" },
        { createdAt: "desc" }
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.emailTemplate.count({ where });

    return NextResponse.json({
      success: true,
      templates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      tags,
      variables,
      thumbnail,
      settings
    } = body;

    // Validate required fields
    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Name, subject, and HTML content are required" },
        { status: 400 }
      );
    }

    // Extract variables from content
    const extractedVariables = extractVariablesFromContent(htmlContent, textContent);
    const mergedVariables = [...new Set([...extractedVariables, ...(variables || [])])];

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description: description || "",
        subject,
        htmlContent,
        textContent: textContent || stripHtmlTags(htmlContent),
        category: category || "custom",
        tags: JSON.stringify(tags || []),
        variables: JSON.stringify(mergedVariables),
        thumbnail: thumbnail || null,
        isSystem: false,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      template,
      message: "Template created successfully"
    });

  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      tags,
      variables,
      thumbnail,
      settings,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if template exists and is not system template
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: "Cannot modify system templates" },
        { status: 403 }
      );
    }

    // Extract variables if content is updated
    let mergedVariables = existingTemplate.variables;
    if (htmlContent) {
      const extractedVariables = extractVariablesFromContent(htmlContent, textContent);
      mergedVariables = [...new Set([...extractedVariables, ...(variables || [])])];
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (textContent !== undefined) updateData.textContent = textContent;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = { ...existingTemplate.settings, ...settings };
    updateData.variables = mergedVariables;
    updateData.updatedAt = new Date();

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      template,
      message: "Template updated successfully"
    });

  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if template exists and is not system template
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system templates" },
        { status: 403 }
      );
    }

    // Check if template is being used in any sequences
    const usageCount = await prisma.followUpStep.count({
      where: { templateId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Template is being used in ${usageCount} sequence step(s). Please remove it from sequences before deleting.` },
        { status: 409 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

// Helper functions
function extractVariablesFromContent(htmlContent: string, textContent?: string): string[] {
  const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;
  const variables = new Set<string>();
  
  // Extract from HTML content
  let match;
  while ((match = variableRegex.exec(htmlContent)) !== null) {
    variables.add(match[1]);
  }
  
  // Extract from text content if provided
  if (textContent) {
    variableRegex.lastIndex = 0;
    while ((match = variableRegex.exec(textContent)) !== null) {
      variables.add(match[1]);
    }
  }
  
  return Array.from(variables);
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}