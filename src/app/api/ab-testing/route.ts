import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-static';

const prisma = new PrismaClient();


// GET - Fetch A/B tests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const testId = searchParams.get("testId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (testId) {
      // Get specific test with detailed results
      const test = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: {
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                  subject: true,
                  htmlContent: true
                }
              },
              _count: {
                select: {
                  emails: true
                }
              }
            }
          },
          sequence: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!test) {
        return NextResponse.json(
          { error: "A/B test not found" },
          { status: 404 }
        );
      }

      // Calculate results for each variant
      const variantsWithResults = await Promise.all(
        test.variants.map(async (variant) => {
          const stats = await getVariantStats(variant.id);
          return {
            ...variant,
            stats
          };
        })
      );

      return NextResponse.json({
        success: true,
        test: {
          ...test,
          variants: variantsWithResults
        }
      });
    }

    // Get list of tests
    const where: any = {};
    if (status) where.status = status;

    const tests = await prisma.aBTest.findMany({
      where,
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            trafficPercentage: true,
            _count: {
              select: {
                emails: true
              }
            }
          }
        },
        sequence: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    });

    const total = await prisma.aBTest.count({ where });

    return NextResponse.json({
      success: true,
      tests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error("Error fetching A/B tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B tests" },
      { status: 500 }
    );
  }
}

// POST - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sequenceId,
      stepNumber,
      testType,
      variants,
      settings,
      duration
    } = body;

    // Validate required fields
    if (!name || !sequenceId || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: "Name, sequenceId, and at least 2 variants are required" },
        { status: 400 }
      );
    }

    // Validate traffic percentages sum to 100
    const totalTraffic = variants.reduce((sum: number, v: any) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      return NextResponse.json(
        { error: "Traffic percentages must sum to 100%" },
        { status: 400 }
      );
    }

    // Check if sequence exists
    const sequence = await prisma.followUpSequence.findUnique({
      where: { id: sequenceId },
      include: {
        steps: {
          where: { stepNumber: stepNumber || 1 }
        }
      }
    });

    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (duration || 7) * 24 * 60 * 60 * 1000);

    // Create A/B test
    const test = await prisma.aBTest.create({
      data: {
        name,
        description: description || "",
        sequenceId,
        stepNumber: stepNumber || 1,
        testType: testType || "template",
        status: "draft",
        startDate,
        endDate,
        settings: {
          significanceLevel: settings?.significanceLevel || 0.05,
          minimumSampleSize: settings?.minimumSampleSize || 100,
          autoWinner: settings?.autoWinner || false,
          primaryMetric: settings?.primaryMetric || "open_rate",
          ...settings
        },
        variants: {
          create: variants.map((variant: any, index: number) => ({
            name: variant.name || `Variant ${String.fromCharCode(65 + index)}`,
            description: variant.description || "",
            templateId: variant.templateId,
            trafficPercentage: variant.trafficPercentage,
            isControl: index === 0,
            settings: variant.settings || {}
          }))
        }
      },
      include: {
        variants: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      test,
      message: "A/B test created successfully"
    });

  } catch (error) {
    console.error("Error creating A/B test:", error);
    return NextResponse.json(
      { error: "Failed to create A/B test" },
      { status: 500 }
    );
  }
}

// PUT - Update A/B test
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    const existingTest = await prisma.aBTest.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    let updatedTest;

    switch (action) {
      case "start":
        if (existingTest.status !== "draft") {
          return NextResponse.json(
            { error: "Only draft tests can be started" },
            { status: 400 }
          );
        }

        updatedTest = await prisma.aBTest.update({
          where: { id },
          data: {
            status: "running",
            startDate: new Date()
          },
          include: { variants: true }
        });
        break;

      case "pause":
        if (existingTest.status !== "running") {
          return NextResponse.json(
            { error: "Only running tests can be paused" },
            { status: 400 }
          );
        }

        updatedTest = await prisma.aBTest.update({
          where: { id },
          data: { status: "paused" },
          include: { variants: true }
        });
        break;

      case "resume":
        if (existingTest.status !== "paused") {
          return NextResponse.json(
            { error: "Only paused tests can be resumed" },
            { status: 400 }
          );
        }

        updatedTest = await prisma.aBTest.update({
          where: { id },
          data: { status: "running" },
          include: { variants: true }
        });
        break;

      case "complete":
        if (!['running', 'paused'].includes(existingTest.status)) {
          return NextResponse.json(
            { error: "Only running or paused tests can be completed" },
            { status: 400 }
          );
        }

        // Determine winner
        const winner = await determineWinner(id);
        
        updatedTest = await prisma.aBTest.update({
          where: { id },
          data: {
            status: "completed",
            endDate: new Date(),
            winnerId: winner?.id || null,
            results: winner?.results || {}
          },
          include: { variants: true }
        });
        break;

      default:
        // Regular update
        updatedTest = await prisma.aBTest.update({
          where: { id },
          data: {
            ...updateData,
            updatedAt: new Date()
          },
          include: { variants: true }
        });
    }

    return NextResponse.json({
      success: true,
      test: updatedTest,
      message: `A/B test ${action || 'updated'} successfully`
    });

  } catch (error) {
    console.error("Error updating A/B test:", error);
    return NextResponse.json(
      { error: "Failed to update A/B test" },
      { status: 500 }
    );
  }
}

// DELETE - Delete A/B test
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    const existingTest = await prisma.aBTest.findUnique({
      where: { id }
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "A/B test not found" },
        { status: 404 }
      );
    }

    if (existingTest.status === "running") {
      return NextResponse.json(
        { error: "Cannot delete running tests. Please pause or complete first." },
        { status: 409 }
      );
    }

    await prisma.aBTest.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "A/B test deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting A/B test:", error);
    return NextResponse.json(
      { error: "Failed to delete A/B test" },
      { status: 500 }
    );
  }
}

// Helper functions
async function getVariantStats(variantId: string) {
  const emails = await prisma.scheduledEmail.findMany({
    where: { variantId },
    include: {
      engagements: true
    }
  });

  const totalSent = emails.filter(e => e.status === 'sent').length;
  const opens = emails.reduce((sum, e) => sum + e.engagements.filter(eng => eng.type === 'open').length, 0);
  const clicks = emails.reduce((sum, e) => sum + e.engagements.filter(eng => eng.type === 'click').length, 0);
  const replies = emails.reduce((sum, e) => sum + e.engagements.filter(eng => eng.type === 'reply').length, 0);
  const unsubscribes = emails.reduce((sum, e) => sum + e.engagements.filter(eng => eng.type === 'unsubscribe').length, 0);

  return {
    totalSent,
    opens,
    clicks,
    replies,
    unsubscribes,
    openRate: totalSent > 0 ? (opens / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (clicks / totalSent) * 100 : 0,
    replyRate: totalSent > 0 ? (replies / totalSent) * 100 : 0,
    unsubscribeRate: totalSent > 0 ? (unsubscribes / totalSent) * 100 : 0
  };
}

async function determineWinner(testId: string) {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: { variants: true }
  });

  if (!test) return null;

  const variantStats = await Promise.all(
    test.variants.map(async (variant) => {
      const stats = await getVariantStats(variant.id);
      return {
        id: variant.id,
        name: variant.name,
        ...stats
      };
    })
  );

  // Determine winner based on primary metric
  const primaryMetric = test.settings.primaryMetric || 'open_rate';
  let winner = variantStats[0];

  for (const variant of variantStats) {
    switch (primaryMetric) {
      case 'open_rate':
        if (variant.openRate > winner.openRate) winner = variant;
        break;
      case 'click_rate':
        if (variant.clickRate > winner.clickRate) winner = variant;
        break;
      case 'reply_rate':
        if (variant.replyRate > winner.replyRate) winner = variant;
        break;
      default:
        if (variant.openRate > winner.openRate) winner = variant;
    }
  }

  return {
    id: winner.id,
    results: {
      variants: variantStats,
      winner: winner.id,
      primaryMetric,
      confidence: calculateConfidence(variantStats, primaryMetric)
    }
  };
}

function calculateConfidence(variants: any[], metric: string) {
  // Simplified confidence calculation
  // In a real implementation, you'd use proper statistical tests
  if (variants.length < 2) return 0;
  
  const [control, variant] = variants;
  const controlRate = control[metric.replace('_rate', 'Rate')] || 0;
  const variantRate = variant[metric.replace('_rate', 'Rate')] || 0;
  
  const improvement = Math.abs(variantRate - controlRate) / controlRate * 100;
  
  // Mock confidence based on sample size and improvement
  const minSampleSize = Math.min(control.totalSent, variant.totalSent);
  const confidence = Math.min(95, (improvement * minSampleSize) / 100);
  
  return Math.round(confidence * 100) / 100;
}
