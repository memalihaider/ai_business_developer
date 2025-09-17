import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-static';

const prisma = new PrismaClient();


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sequenceId, contactId, settings } = body;

    switch (action) {
      case "start":
        return await startSequence(sequenceId, contactId, settings);
      case "pause":
        return await pauseSequence(sequenceId, contactId);
      case "resume":
        return await resumeSequence(sequenceId, contactId);
      case "stop":
        return await stopSequence(sequenceId, contactId);
      case "schedule_next":
        return await scheduleNextStep(sequenceId, contactId);
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Automation error:", error);
    return NextResponse.json(
      { error: "Automation failed" },
      { status: 500 }
    );
  }
}

async function startSequence(sequenceId: string, contactId: string, settings: any) {
  // Get sequence and first step
  const sequence = await prisma.followUpSequence.findUnique({
    where: { id: sequenceId },
    include: {
      steps: {
        orderBy: { stepNumber: "asc" }
      }
    }
  });

  if (!sequence || sequence.steps.length === 0) {
    return NextResponse.json(
      { error: "Sequence not found or has no steps" },
      { status: 404 }
    );
  }

  const firstStep = sequence.steps[0];
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + (firstStep.delayHours * 60 * 60 * 1000) + (firstStep.delayDays * 24 * 60 * 60 * 1000));

  // Create sequence enrollment
  const enrollment = await prisma.sequenceEnrollment.create({
    data: {
      sequenceId,
      contactId,
      currentStep: 1,
      status: "active",
      startedAt: now,
      nextScheduledAt: scheduledTime,
      settings: settings || {}
    }
  });

  // Schedule first email
  await scheduleEmail({
    enrollmentId: enrollment.id,
    stepId: firstStep.id,
    contactId,
    scheduledAt: scheduledTime,
    subject: firstStep.subject,
    content: firstStep.content
  });

  return NextResponse.json({
    success: true,
    enrollment,
    message: "Sequence started successfully"
  });
}

async function pauseSequence(sequenceId: string, contactId: string) {
  const enrollment = await prisma.sequenceEnrollment.updateMany({
    where: {
      sequenceId,
      contactId,
      status: "active"
    },
    data: {
      status: "paused",
      pausedAt: new Date()
    }
  });

  // Cancel pending emails
  await prisma.scheduledEmail.updateMany({
    where: {
      contactId,
      status: "scheduled",
      enrollment: {
        sequenceId
      }
    },
    data: {
      status: "cancelled"
    }
  });

  return NextResponse.json({
    success: true,
    message: "Sequence paused successfully"
  });
}

async function resumeSequence(sequenceId: string, contactId: string) {
  const enrollment = await prisma.sequenceEnrollment.findFirst({
    where: {
      sequenceId,
      contactId,
      status: "paused"
    },
    include: {
      sequence: {
        include: {
          steps: {
            orderBy: { stepNumber: "asc" }
          }
        }
      }
    }
  });

  if (!enrollment) {
    return NextResponse.json(
      { error: "Paused enrollment not found" },
      { status: 404 }
    );
  }

  const currentStep = enrollment.sequence.steps.find(s => s.stepNumber === enrollment.currentStep);
  if (!currentStep) {
    return NextResponse.json(
      { error: "Current step not found" },
      { status: 404 }
    );
  }

  const now = new Date();
  const nextScheduledTime = new Date(now.getTime() + (currentStep.delayHours * 60 * 60 * 1000));

  // Update enrollment
  await prisma.sequenceEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "active",
      nextScheduledAt: nextScheduledTime,
      pausedAt: null
    }
  });

  // Reschedule next email
  await scheduleEmail({
    enrollmentId: enrollment.id,
    stepId: currentStep.id,
    contactId,
    scheduledAt: nextScheduledTime,
    subject: currentStep.subject,
    content: currentStep.content
  });

  return NextResponse.json({
    success: true,
    message: "Sequence resumed successfully"
  });
}

async function stopSequence(sequenceId: string, contactId: string) {
  await prisma.sequenceEnrollment.updateMany({
    where: {
      sequenceId,
      contactId,
      status: { in: ["active", "paused"] }
    },
    data: {
      status: "stopped",
      completedAt: new Date()
    }
  });

  // Cancel all pending emails
  await prisma.scheduledEmail.updateMany({
    where: {
      contactId,
      status: "scheduled",
      enrollment: {
        sequenceId
      }
    },
    data: {
      status: "cancelled"
    }
  });

  return NextResponse.json({
    success: true,
    message: "Sequence stopped successfully"
  });
}

async function scheduleNextStep(sequenceId: string, contactId: string) {
  const enrollment = await prisma.sequenceEnrollment.findFirst({
    where: {
      sequenceId,
      contactId,
      status: "active"
    },
    include: {
      sequence: {
        include: {
          steps: {
            orderBy: { stepNumber: "asc" }
          }
        }
      }
    }
  });

  if (!enrollment) {
    return NextResponse.json(
      { error: "Active enrollment not found" },
      { status: 404 }
    );
  }

  const nextStepNumber = enrollment.currentStep + 1;
  const nextStep = enrollment.sequence.steps.find(s => s.stepNumber === nextStepNumber);

  if (!nextStep) {
    // Sequence completed
    await prisma.sequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      completed: true,
      message: "Sequence completed successfully"
    });
  }

  const now = new Date();
  const scheduledTime = new Date(now.getTime() + (nextStep.delayHours * 60 * 60 * 1000) + (nextStep.delayDays * 24 * 60 * 60 * 1000));

  // Update enrollment
  await prisma.sequenceEnrollment.update({
    where: { id: enrollment.id },
    data: {
      currentStep: nextStepNumber,
      nextScheduledAt: scheduledTime
    }
  });

  // Schedule next email
  await scheduleEmail({
    enrollmentId: enrollment.id,
    stepId: nextStep.id,
    contactId,
    scheduledAt: scheduledTime,
    subject: nextStep.subject,
    content: nextStep.content
  });

  return NextResponse.json({
    success: true,
    nextStep: nextStepNumber,
    scheduledAt: scheduledTime,
    message: "Next step scheduled successfully"
  });
}

async function scheduleEmail(data: {
  enrollmentId: string;
  stepId: string;
  contactId: string;
  scheduledAt: Date;
  subject: string;
  content: string;
}) {
  return await prisma.scheduledEmail.create({
    data: {
      enrollmentId: data.enrollmentId,
      stepId: data.stepId,
      contactId: data.contactId,
      scheduledAt: data.scheduledAt,
      subject: data.subject,
      content: data.content,
      status: "scheduled"
    }
  });
}

// GET endpoint for automation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sequenceId = searchParams.get("sequenceId");
    const contactId = searchParams.get("contactId");

    if (!sequenceId) {
      return NextResponse.json(
        { error: "Sequence ID is required" },
        { status: 400 }
      );
    }

    const where: any = { sequenceId };
    if (contactId) where.contactId = contactId;

    const enrollments = await prisma.sequenceEnrollment.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        sequence: {
          select: {
            id: true,
            name: true,
            totalSteps: true
          }
        },
        scheduledEmails: {
          where: {
            status: { in: ["scheduled", "sent"] }
          },
          orderBy: { scheduledAt: "asc" }
        }
      },
      orderBy: { startedAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      enrollments
    });

  } catch (error) {
    console.error("Error fetching automation status:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation status" },
      { status: 500 }
    );
  }
}
