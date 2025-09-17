import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';
import { formatEmailSender, getEmailSenderName } from '@/lib/settings';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface BulkEmailOptions {
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
  campaignId?: string;
  sequenceId?: string;
  templateId?: string;
}

// Create SMTP transporter
const createTransporter = () => {
  // Check if SMTP credentials are properly configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your environment variables.');
  }

  if (process.env.SMTP_PASS === 'your_app_password_here') {
    throw new Error('Please replace SMTP_PASS with your actual Gmail app password in the .env.local file.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
    logger: process.env.NODE_ENV === 'development' // Enable logging in development
  });
};

// Send single email
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: options.from || formatEmailSender(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide more specific error messages for common issues
      if (error.message.includes('Invalid login') || error.message.includes('535')) {
        errorMessage = 'Email authentication failed. Please check your SMTP credentials. For Gmail, make sure you are using an App Password, not your regular password.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to email server. Please check your SMTP host and port settings.';
      } else if (error.message.includes('SMTP credentials not configured')) {
        errorMessage = 'SMTP credentials are missing. Please configure SMTP_USER and SMTP_PASS in your environment variables.';
      } else if (error.message.includes('Please replace SMTP_PASS')) {
        errorMessage = 'Please replace the placeholder SMTP_PASS with your actual Gmail app password in the .env.local file.';
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Send bulk emails with personalization
export async function sendBulkEmails(options: BulkEmailOptions): Promise<{
  success: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let success = 0;
  let failed = 0;

  const transporter = createTransporter();

  for (const recipient of options.recipients) {
    try {
      // Personalize content
      const personalizedSubject = personalizeContent(options.subject, recipient);
      const personalizedHtml = personalizeContent(options.html, recipient);
      const personalizedText = options.text ? personalizeContent(options.text, recipient) : undefined;

      const mailOptions = {
        from: options.from || formatEmailSender(),
        to: recipient.email,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        replyTo: options.replyTo
      };

      const result = await transporter.sendMail(mailOptions);
      
      // Log email delivery
      await logEmailDelivery({
        email: recipient.email,
        subject: personalizedSubject,
        status: 'sent',
        messageId: result.messageId,
        campaignId: options.campaignId,
        sequenceId: options.sequenceId,
        templateId: options.templateId
      });

      results.push({ email: recipient.email, success: true });
      success++;
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      
      // Log failed delivery
      await logEmailDelivery({
        email: recipient.email,
        subject: options.subject,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId: options.campaignId,
        sequenceId: options.sequenceId,
        templateId: options.templateId
      });

      results.push({ 
        email: recipient.email, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      failed++;
    }
  }

  return { success, failed, results };
}

// Personalize email content with recipient data
function personalizeContent(content: string, recipient: any): string {
  let personalizedContent = content;
  
  // Replace common placeholders
  personalizedContent = personalizedContent.replace(/{{firstName}}/g, recipient.firstName || '');
  personalizedContent = personalizedContent.replace(/{{lastName}}/g, recipient.lastName || '');
  personalizedContent = personalizedContent.replace(/{{fullName}}/g, 
    `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim());
  personalizedContent = personalizedContent.replace(/{{email}}/g, recipient.email || '');
  
  // Replace custom fields
  if (recipient.customFields) {
    Object.entries(recipient.customFields).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedContent = personalizedContent.replace(regex, String(value));
    });
  }
  
  return personalizedContent;
}

// Log email delivery for tracking
async function logEmailDelivery(data: {
  email: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  messageId?: string;
  error?: string;
  campaignId?: string;
  sequenceId?: string;
  templateId?: string;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        email: data.email,
        subject: data.subject,
        status: data.status,
        messageId: data.messageId,
        error: data.error,
        campaignId: data.campaignId,
        sequenceId: data.sequenceId,
        templateId: data.templateId,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging email delivery:', error);
  }
}

// Send test email
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  return await sendEmail({
    to,
    subject: 'Test Email from Email Marketing System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Test Email</h2>
        <p>This is a test email from your Email Marketing System.</p>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `,
    text: 'This is a test email from your Email Marketing System. If you received this email, your SMTP configuration is working correctly!'
  });
}

// Verify SMTP configuration
export async function verifyEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}