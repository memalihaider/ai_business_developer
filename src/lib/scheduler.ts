import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

interface ScheduledEmail {
  id: string;
  contactId: string;
  sequenceId: string;
  stepId: string;
  scheduledAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

interface SequenceAutomation {
  sequenceId: string;
  contactId: string;
  currentStep: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  startedAt: Date;
  nextExecutionAt?: Date;
}

// Sequences functionality removed

// Process pending scheduled emails
export async function processScheduledEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Get all pending emails that are due
    const pendingEmails = await prisma.scheduledEmail.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: new Date()
        }
      },
      include: {
        contact: true,
        sequence: true,
        step: true
      },
      take: 50 // Process in batches
    });

    for (const scheduledEmail of pendingEmails) {
      processed++;
      
      try {
        // Check if contact is still active and not unsubscribed
        if (scheduledEmail.contact.status === 'unsubscribed' || 
            scheduledEmail.contact.status === 'bounced') {
          await prisma.scheduledEmail.update({
            where: { id: scheduledEmail.id },
            data: { status: 'cancelled' }
          });
          continue;
        }

        // Send the email
        const result = await sendEmail({
          to: scheduledEmail.contact.email,
          subject: scheduledEmail.step.subject || 'Email from Sequence',
          html: personalizeEmailContent(
            scheduledEmail.step.content,
            scheduledEmail.contact
          )
        });

        if (result.success) {
          // Mark as sent
          await prisma.scheduledEmail.update({
            where: { id: scheduledEmail.id },
            data: { 
              status: 'sent',
              sentAt: new Date()
            }
          });

          // Log sequence run
          await prisma.sequenceRun.create({
            data: {
              sequenceId: scheduledEmail.sequenceId,
              contactId: scheduledEmail.contactId,
              stepId: scheduledEmail.stepId,
              status: 'completed',
              executedAt: new Date()
            }
          });

          // Schedule next step if exists
          await scheduleNextSequenceStep(
            scheduledEmail.sequenceId,
            scheduledEmail.contactId,
            scheduledEmail.step.order
          );

          sent++;
        } else {
          // Mark as failed
          await prisma.scheduledEmail.update({
            where: { id: scheduledEmail.id },
            data: { status: 'failed' }
          });
          failed++;
        }
      } catch (error) {
        console.error(`Error processing scheduled email ${scheduledEmail.id}:`, error);
        
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: { status: 'failed' }
        });
        failed++;
      }
    }

    return { processed, sent, failed };
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    throw error;
  }
}

// Schedule next step in sequence
async function scheduleNextSequenceStep(
  sequenceId: string,
  contactId: string,
  currentStepOrder: number
): Promise<void> {
  try {
    // Find next step
    const nextStep = await prisma.sequenceStep.findFirst({
      where: {
        sequenceId,
        order: currentStepOrder + 1
      }
    });

    if (nextStep) {
      // Schedule next step with its delay
      await scheduleSequenceEmail(
        sequenceId,
        contactId,
        nextStep.id,
        nextStep.delay || 24 // Default 24 hours delay
      );
    } else {
      // Sequence completed for this contact
      await prisma.sequenceRun.create({
        data: {
          sequenceId,
          contactId,
          status: 'sequence_completed',
          executedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error scheduling next sequence step:', error);
  }
}

// Start sequence for a contact
// Sequences functionality removed

// Sequences functionality removed

// Personalize email content
function personalizeEmailContent(content: string, contact: any): string {
  let personalizedContent = content;
  
  // Replace common placeholders
  personalizedContent = personalizedContent.replace(/{{firstName}}/g, contact.firstName || '');
  personalizedContent = personalizedContent.replace(/{{lastName}}/g, contact.lastName || '');
  personalizedContent = personalizedContent.replace(/{{fullName}}/g, 
    `${contact.firstName || ''} ${contact.lastName || ''}`.trim());
  personalizedContent = personalizedContent.replace(/{{email}}/g, contact.email || '');
  personalizedContent = personalizedContent.replace(/{{company}}/g, contact.company || '');
  
  // Replace custom fields
  if (contact.customFields) {
    const customFields = typeof contact.customFields === 'string' 
      ? JSON.parse(contact.customFields) 
      : contact.customFields;
      
    Object.entries(customFields).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedContent = personalizedContent.replace(regex, String(value));
    });
  }
  
  return personalizedContent;
}

// Sequences functionality removed