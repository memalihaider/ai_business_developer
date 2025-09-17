import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Webhook event types
interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

// Integration webhook handlers
const webhookHandlers = {
  // CRM Webhooks
  hubspot: {
    contact_created: handleContactCreated,
    contact_updated: handleContactUpdated,
    deal_created: handleDealCreated,
    deal_updated: handleDealUpdated,
    engagement_created: handleEngagementCreated
  },
  salesforce: {
    lead_created: handleLeadCreated,
    lead_updated: handleLeadUpdated,
    opportunity_created: handleOpportunityCreated,
    opportunity_updated: handleOpportunityUpdated,
    task_created: handleTaskCreated
  },
  pipedrive: {
    person_created: handlePersonCreated,
    person_updated: handlePersonUpdated,
    deal_created: handleDealCreated,
    deal_updated: handleDealUpdated,
    activity_created: handleActivityCreated
  },
  
  // Email Service Webhooks
  sendgrid: {
    delivered: handleEmailDelivered,
    opened: handleEmailOpened,
    clicked: handleEmailClicked,
    bounced: handleEmailBounced,
    unsubscribed: handleEmailUnsubscribed,
    spam_report: handleSpamReport
  },
  mailgun: {
    delivered: handleEmailDelivered,
    opened: handleEmailOpened,
    clicked: handleEmailClicked,
    bounced: handleEmailBounced,
    unsubscribed: handleEmailUnsubscribed
  },
  
  // Analytics Webhooks
  google_analytics: {
    goal_completed: handleGoalCompleted,
    ecommerce_purchase: handleEcommercePurchase,
    custom_event: handleCustomEvent
  },
  mixpanel: {
    event_tracked: handleEventTracked,
    funnel_completed: handleFunnelCompleted
  }
};

// POST - Handle incoming webhooks
export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const integrationId = params.integrationId;
    const body = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('x-hub-signature-256');
    
    // Get integration details
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, integration.webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Process webhook based on provider and event type
    const result = await processWebhook(integration, webhookData);
    
    // Log webhook event
    await logWebhookEvent({
      integrationId,
      provider: integration.provider,
      eventType: webhookData.type || 'unknown',
      payload: webhookData,
      processed: result.success,
      error: result.error
    });

    if (result.success) {
      return NextResponse.json({
        message: 'Webhook processed successfully',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Webhook status and logs
export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const integrationId = params.integrationId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('eventType');

    // Get webhook logs
    const logs = await getWebhookLogs(integrationId, {
      limit,
      offset,
      eventType
    });

    // Get webhook statistics
    const stats = await getWebhookStats(integrationId);

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        limit,
        offset,
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching webhook data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook data' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getIntegration(integrationId: string) {
  // Mock integration data - in real implementation, fetch from database
  return {
    id: integrationId,
    provider: 'hubspot', // This would come from database
    webhookSecret: 'mock_secret_key',
    config: {
      syncSettings: {
        syncContacts: true,
        syncCampaigns: true,
        syncAnalytics: true
      }
    }
  };
}

function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Handle different signature formats
    let expectedSignature: string;
    
    if (signature.startsWith('sha256=')) {
      // GitHub/HubSpot style
      expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    } else if (signature.startsWith('sha1=')) {
      // Legacy format
      expectedSignature = 'sha1=' + crypto
        .createHmac('sha1', secret)
        .update(payload)
        .digest('hex');
    } else {
      // Plain hash
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function processWebhook(integration: any, webhookData: any) {
  try {
    const { provider } = integration;
    const eventType = webhookData.type || webhookData.event_type || 'unknown';
    
    // Get appropriate handler
    const providerHandlers = webhookHandlers[provider];
    if (!providerHandlers) {
      return { success: false, error: `No handlers for provider: ${provider}` };
    }

    const handler = providerHandlers[eventType];
    if (!handler) {
      return { success: false, error: `No handler for event type: ${eventType}` };
    }

    // Process the webhook
    const result = await handler(webhookData, integration);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// CRM Event Handlers
async function handleContactCreated(data: any, integration: any) {
  console.log('Processing contact created:', data);
  
  // Extract contact information
  const contact = {
    externalId: data.objectId || data.id,
    email: data.properties?.email || data.email,
    firstName: data.properties?.firstname || data.first_name,
    lastName: data.properties?.lastname || data.last_name,
    company: data.properties?.company || data.company,
    phone: data.properties?.phone || data.phone,
    source: integration.provider,
    createdAt: new Date().toISOString()
  };

  // In real implementation:
  // 1. Save contact to database
  // 2. Trigger welcome email sequence
  // 3. Add to appropriate segments
  // 4. Update analytics

  return { action: 'contact_created', contact };
}

async function handleContactUpdated(data: any, integration: any) {
  console.log('Processing contact updated:', data);
  
  const updates = {
    externalId: data.objectId || data.id,
    changes: data.properties || data.changes,
    updatedAt: new Date().toISOString()
  };

  // In real implementation:
  // 1. Update contact in database
  // 2. Check for segment changes
  // 3. Trigger conditional sequences
  // 4. Update lead scoring

  return { action: 'contact_updated', updates };
}

async function handleDealCreated(data: any, integration: any) {
  console.log('Processing deal created:', data);
  
  const deal = {
    externalId: data.objectId || data.id,
    amount: data.properties?.amount || data.value,
    stage: data.properties?.dealstage || data.stage,
    contactId: data.properties?.contact_id || data.person_id,
    source: integration.provider,
    createdAt: new Date().toISOString()
  };

  // In real implementation:
  // 1. Save deal to database
  // 2. Trigger deal-specific sequences
  // 3. Update contact scoring
  // 4. Notify sales team

  return { action: 'deal_created', deal };
}

async function handleDealUpdated(data: any, integration: any) {
  console.log('Processing deal updated:', data);
  
  const updates = {
    externalId: data.objectId || data.id,
    changes: data.properties || data.changes,
    updatedAt: new Date().toISOString()
  };

  // Check for stage changes
  if (updates.changes?.dealstage || updates.changes?.stage) {
    // Trigger stage-specific sequences
  }

  return { action: 'deal_updated', updates };
}

async function handleEngagementCreated(data: any, integration: any) {
  console.log('Processing engagement created:', data);
  
  const engagement = {
    externalId: data.objectId || data.id,
    type: data.properties?.type || data.engagement_type,
    contactId: data.properties?.contact_id,
    timestamp: data.properties?.timestamp || new Date().toISOString()
  };

  return { action: 'engagement_created', engagement };
}

// Salesforce specific handlers
async function handleLeadCreated(data: any, integration: any) {
  console.log('Processing Salesforce lead created:', data);
  
  const lead = {
    externalId: data.Id,
    email: data.Email,
    firstName: data.FirstName,
    lastName: data.LastName,
    company: data.Company,
    status: data.Status,
    source: 'salesforce',
    createdAt: new Date().toISOString()
  };

  return { action: 'lead_created', lead };
}

async function handleLeadUpdated(data: any, integration: any) {
  console.log('Processing Salesforce lead updated:', data);
  return { action: 'lead_updated', data };
}

async function handleOpportunityCreated(data: any, integration: any) {
  console.log('Processing Salesforce opportunity created:', data);
  return { action: 'opportunity_created', data };
}

async function handleOpportunityUpdated(data: any, integration: any) {
  console.log('Processing Salesforce opportunity updated:', data);
  return { action: 'opportunity_updated', data };
}

async function handleTaskCreated(data: any, integration: any) {
  console.log('Processing Salesforce task created:', data);
  return { action: 'task_created', data };
}

// Pipedrive specific handlers
async function handlePersonCreated(data: any, integration: any) {
  console.log('Processing Pipedrive person created:', data);
  return { action: 'person_created', data };
}

async function handlePersonUpdated(data: any, integration: any) {
  console.log('Processing Pipedrive person updated:', data);
  return { action: 'person_updated', data };
}

async function handleActivityCreated(data: any, integration: any) {
  console.log('Processing Pipedrive activity created:', data);
  return { action: 'activity_created', data };
}

// Email Service Event Handlers
async function handleEmailDelivered(data: any, integration: any) {
  console.log('Processing email delivered:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    timestamp: data.timestamp,
    event: 'delivered'
  };

  // Update email analytics
  // Update contact engagement score
  
  return { action: 'email_delivered', event };
}

async function handleEmailOpened(data: any, integration: any) {
  console.log('Processing email opened:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    timestamp: data.timestamp,
    userAgent: data.useragent,
    ip: data.ip,
    event: 'opened'
  };

  // Update email analytics
  // Update contact engagement score
  // Trigger follow-up sequences
  
  return { action: 'email_opened', event };
}

async function handleEmailClicked(data: any, integration: any) {
  console.log('Processing email clicked:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    url: data.url,
    timestamp: data.timestamp,
    userAgent: data.useragent,
    ip: data.ip,
    event: 'clicked'
  };

  // Update email analytics
  // Update contact engagement score
  // Trigger click-based sequences
  
  return { action: 'email_clicked', event };
}

async function handleEmailBounced(data: any, integration: any) {
  console.log('Processing email bounced:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    reason: data.reason,
    type: data.type, // hard or soft bounce
    timestamp: data.timestamp,
    event: 'bounced'
  };

  // Update contact status
  // Remove from active sequences if hard bounce
  // Update email reputation metrics
  
  return { action: 'email_bounced', event };
}

async function handleEmailUnsubscribed(data: any, integration: any) {
  console.log('Processing email unsubscribed:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    timestamp: data.timestamp,
    event: 'unsubscribed'
  };

  // Update contact subscription status
  // Remove from all active sequences
  // Update suppression list
  
  return { action: 'email_unsubscribed', event };
}

async function handleSpamReport(data: any, integration: any) {
  console.log('Processing spam report:', data);
  
  const event = {
    messageId: data.sg_message_id || data.id,
    email: data.email,
    timestamp: data.timestamp,
    event: 'spam_report'
  };

  // Update contact status
  // Remove from sequences
  // Alert compliance team
  // Update sender reputation
  
  return { action: 'spam_report', event };
}

// Analytics Event Handlers
async function handleGoalCompleted(data: any, integration: any) {
  console.log('Processing goal completed:', data);
  return { action: 'goal_completed', data };
}

async function handleEcommercePurchase(data: any, integration: any) {
  console.log('Processing ecommerce purchase:', data);
  return { action: 'ecommerce_purchase', data };
}

async function handleCustomEvent(data: any, integration: any) {
  console.log('Processing custom event:', data);
  return { action: 'custom_event', data };
}

async function handleEventTracked(data: any, integration: any) {
  console.log('Processing event tracked:', data);
  return { action: 'event_tracked', data };
}

async function handleFunnelCompleted(data: any, integration: any) {
  console.log('Processing funnel completed:', data);
  return { action: 'funnel_completed', data };
}

// Logging functions
async function logWebhookEvent(eventData: any) {
  // In real implementation, save to database
  console.log('Webhook event logged:', eventData);
  
  // Mock logging
  return {
    id: `log_${Date.now()}`,
    ...eventData,
    timestamp: new Date().toISOString()
  };
}

async function getWebhookLogs(integrationId: string, options: any) {
  // Mock webhook logs
  return [
    {
      id: 'log_1',
      integrationId,
      eventType: 'contact_created',
      processed: true,
      timestamp: '2024-01-15T12:00:00Z'
    },
    {
      id: 'log_2',
      integrationId,
      eventType: 'email_opened',
      processed: true,
      timestamp: '2024-01-15T11:30:00Z'
    }
  ];
}

async function getWebhookStats(integrationId: string) {
  // Mock webhook statistics
  return {
    totalEvents: 1247,
    successfulEvents: 1198,
    failedEvents: 49,
    successRate: 96.1,
    lastEvent: '2024-01-15T12:00:00Z',
    eventTypes: {
      'contact_created': 234,
      'contact_updated': 456,
      'email_opened': 789,
      'email_clicked': 123,
      'deal_created': 45
    }
  };
}