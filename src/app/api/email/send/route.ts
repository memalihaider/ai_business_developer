import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendBulkEmails, sendTestEmail, verifyEmailConfig } from '@/lib/email';
import { prisma } from '@/lib/db';

export const dynamic = 'force-static';

// POST /api/email/send - Send emails
export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    const { type, ...emailData } = body;

    switch (type) {
      case 'single':
        return await handleSingleEmail(emailData);
      case 'bulk':
        return await handleBulkEmail(emailData);
      case 'test':
        return await handleTestEmail(emailData);
      case 'campaign':
        return await handleCampaignEmail(emailData);
      case 'sequence':
        return await handleSequenceEmail(emailData);
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in email send API:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET /api/email/send - Verify email configuration
export async function GET() {
  try {
    const verification = await verifyEmailConfig();
    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error verifying email config:', error);
    return NextResponse.json(
      { error: 'Failed to verify email configuration' },
      { status: 500 }
    );
  }
}

// Handle single email sending
async function handleSingleEmail(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  const result = await sendEmail(data);
  
  if (result.success) {
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });
  } else {
    return NextResponse.json(
      { error: `Failed to send email: ${result.error}` },
      { status: 500 }
    );
  }
}

// Handle bulk email sending
async function handleBulkEmail(data: {
  recipients: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    customFields?: Record<string, any>;
  }>;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  const result = await sendBulkEmails(data);
  return NextResponse.json(result);
}

// Handle test email
async function handleTestEmail(data: { to: string }) {
  const result = await sendTestEmail(data.to);
  
  if (result.success) {
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId 
    });
  } else {
    return NextResponse.json(
      { error: `Failed to send test email: ${result.error}` },
      { status: 500 }
    );
  }
}

// Handle campaign email sending
async function handleCampaignEmail(data: { campaignId: string }) {
  try {
    // Get campaign with contacts and template
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        template: true
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (!campaign.template) {
      return NextResponse.json(
        { error: 'Campaign template not found' },
        { status: 400 }
      );
    }

    // Prepare recipients
    const recipients = campaign.contacts.map(cc => ({
      email: cc.contact.email,
      firstName: cc.contact.firstName,
      lastName: cc.contact.lastName,
      customFields: cc.contact.customFields as Record<string, any> || {}
    }));

    // Send bulk emails
    const result = await sendBulkEmails({
      recipients,
      subject: campaign.template.subject,
      html: campaign.template.content,
      campaignId: campaign.id,
      templateId: campaign.template.id
    });

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        totalSent: result.success,
        totalFailed: result.failed
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign emails sent',
      stats: {
        total: recipients.length,
        sent: result.success,
        failed: result.failed
      }
    });
  } catch (error) {
    console.error('Error sending campaign emails:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign emails' },
      { status: 500 }
    );
  }
}

// Handle sequence email sending
async function handleSequenceEmail(data: {
  sequenceId: string;
  stepId: string;
  contactId: string;
}) {
  try {
    // Get sequence step and contact
    const step = await prisma.sequenceStep.findUnique({
      where: { id: data.stepId },
      include: {
        sequence: true
      }
    });

    const contact = await prisma.contact.findUnique({
      where: { id: data.contactId }
    });

    if (!step || !contact) {
      return NextResponse.json(
        { error: 'Sequence step or contact not found' },
        { status: 404 }
      );
    }

    // Send email
    const result = await sendEmail({
      to: contact.email,
      subject: step.subject || 'Email from Sequence',
      html: step.content,
      sequenceId: data.sequenceId
    });

    if (result.success) {
      // Log sequence step execution
      await prisma.sequenceRun.create({
        data: {
          sequenceId: data.sequenceId,
          contactId: data.contactId,
          stepId: data.stepId,
          status: 'completed',
          executedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Sequence email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send sequence email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending sequence email:', error);
    return NextResponse.json(
      { error: 'Failed to send sequence email' },
      { status: 500 }
    );
  }
}
