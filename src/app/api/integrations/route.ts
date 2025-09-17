import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Third-party integration configurations
interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email_service' | 'analytics' | 'webhook' | 'zapier' | 'marketing_automation';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: {
    apiKey?: string;
    apiSecret?: string;
    webhookUrl?: string;
    baseUrl?: string;
    authType: 'api_key' | 'oauth' | 'basic_auth' | 'bearer_token';
    credentials?: Record<string, any>;
    mappings?: Record<string, string>;
    syncSettings?: {
      syncContacts: boolean;
      syncCampaigns: boolean;
      syncAnalytics: boolean;
      syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    };
  };
  lastSync?: string;
  syncStats?: {
    totalSynced: number;
    lastSyncCount: number;
    errors: number;
  };
  createdAt: string;
  updatedAt: string;
}

// CRM Integration handlers
const crmProviders = {
  salesforce: {
    name: 'Salesforce',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    apiBase: 'https://your-instance.salesforce.com/services/data/v58.0',
    requiredScopes: ['api', 'refresh_token']
  },
  hubspot: {
    name: 'HubSpot',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    apiBase: 'https://api.hubapi.com',
    requiredScopes: ['contacts', 'automation']
  },
  pipedrive: {
    name: 'Pipedrive',
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    apiBase: 'https://api.pipedrive.com/v1',
    requiredScopes: ['deals:read', 'persons:read']
  },
  zoho: {
    name: 'Zoho CRM',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    apiBase: 'https://www.zohoapis.com/crm/v2',
    requiredScopes: ['ZohoCRM.modules.ALL']
  }
};

// Email service providers
const emailProviders = {
  sendgrid: {
    name: 'SendGrid',
    apiBase: 'https://api.sendgrid.com/v3',
    authType: 'api_key'
  },
  mailgun: {
    name: 'Mailgun',
    apiBase: 'https://api.mailgun.net/v3',
    authType: 'basic_auth'
  },
  ses: {
    name: 'Amazon SES',
    apiBase: 'https://email.us-east-1.amazonaws.com',
    authType: 'aws_signature'
  },
  postmark: {
    name: 'Postmark',
    apiBase: 'https://api.postmarkapp.com',
    authType: 'bearer_token'
  }
};

// Analytics providers
const analyticsProviders = {
  google_analytics: {
    name: 'Google Analytics',
    apiBase: 'https://analyticsreporting.googleapis.com/v4',
    authType: 'oauth'
  },
  mixpanel: {
    name: 'Mixpanel',
    apiBase: 'https://mixpanel.com/api',
    authType: 'api_key'
  },
  segment: {
    name: 'Segment',
    apiBase: 'https://api.segment.io/v1',
    authType: 'basic_auth'
  }
};

// GET - Fetch integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (provider) where.provider = provider;

    // Mock data for demonstration
    const mockIntegrations: Integration[] = [
      {
        id: 'int_1',
        name: 'HubSpot CRM',
        type: 'crm',
        provider: 'hubspot',
        status: 'active',
        config: {
          authType: 'oauth',
          baseUrl: 'https://api.hubapi.com',
          syncSettings: {
            syncContacts: true,
            syncCampaigns: true,
            syncAnalytics: true,
            syncFrequency: 'hourly'
          },
          mappings: {
            'email': 'email',
            'firstName': 'firstname',
            'lastName': 'lastname',
            'company': 'company'
          }
        },
        lastSync: '2024-01-15T12:00:00Z',
        syncStats: {
          totalSynced: 15420,
          lastSyncCount: 23,
          errors: 0
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z'
      },
      {
        id: 'int_2',
        name: 'SendGrid Email',
        type: 'email_service',
        provider: 'sendgrid',
        status: 'active',
        config: {
          authType: 'api_key',
          baseUrl: 'https://api.sendgrid.com/v3',
          syncSettings: {
            syncContacts: false,
            syncCampaigns: true,
            syncAnalytics: true,
            syncFrequency: 'real_time'
          }
        },
        lastSync: '2024-01-15T12:30:00Z',
        syncStats: {
          totalSynced: 8930,
          lastSyncCount: 156,
          errors: 2
        },
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-15T12:30:00Z'
      },
      {
        id: 'int_3',
        name: 'Salesforce Integration',
        type: 'crm',
        provider: 'salesforce',
        status: 'error',
        config: {
          authType: 'oauth',
          baseUrl: 'https://your-instance.salesforce.com/services/data/v58.0',
          syncSettings: {
            syncContacts: true,
            syncCampaigns: false,
            syncAnalytics: true,
            syncFrequency: 'daily'
          }
        },
        lastSync: '2024-01-14T08:00:00Z',
        syncStats: {
          totalSynced: 5670,
          lastSyncCount: 0,
          errors: 5
        },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-14T08:00:00Z'
      }
    ];

    // Filter integrations
    let filteredIntegrations = mockIntegrations;
    if (type) {
      filteredIntegrations = filteredIntegrations.filter(int => int.type === type);
    }
    if (status) {
      filteredIntegrations = filteredIntegrations.filter(int => int.status === status);
    }
    if (provider) {
      filteredIntegrations = filteredIntegrations.filter(int => int.provider === provider);
    }

    // Paginate
    const paginatedIntegrations = filteredIntegrations.slice(skip, skip + limit);

    return NextResponse.json({
      integrations: paginatedIntegrations,
      pagination: {
        page,
        limit,
        total: filteredIntegrations.length,
        totalPages: Math.ceil(filteredIntegrations.length / limit)
      },
      providers: {
        crm: crmProviders,
        email_service: emailProviders,
        analytics: analyticsProviders
      }
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST - Create new integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, provider, config } = body;

    // Validate required fields
    if (!name || !type || !provider || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, provider, config' },
        { status: 400 }
      );
    }

    // Validate integration type
    const validTypes = ['crm', 'email_service', 'analytics', 'webhook', 'zapier', 'marketing_automation'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid integration type' },
        { status: 400 }
      );
    }

    // Validate provider based on type
    let validProviders: string[] = [];
    switch (type) {
      case 'crm':
        validProviders = Object.keys(crmProviders);
        break;
      case 'email_service':
        validProviders = Object.keys(emailProviders);
        break;
      case 'analytics':
        validProviders = Object.keys(analyticsProviders);
        break;
      default:
        validProviders = [provider]; // Allow custom providers for other types
    }

    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider for ${type}. Valid providers: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Create integration
    const integration: Integration = {
      id: `int_${Date.now()}`,
      name,
      type,
      provider,
      status: 'pending',
      config: {
        ...config,
        syncSettings: {
          syncContacts: config.syncSettings?.syncContacts || false,
          syncCampaigns: config.syncSettings?.syncCampaigns || false,
          syncAnalytics: config.syncSettings?.syncAnalytics || false,
          syncFrequency: config.syncSettings?.syncFrequency || 'daily'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Test the connection
    // 3. Set up webhooks if needed
    // 4. Initialize sync process

    // Mock successful creation
    integration.status = 'active';
    integration.lastSync = new Date().toISOString();
    integration.syncStats = {
      totalSynced: 0,
      lastSyncCount: 0,
      errors: 0
    };

    return NextResponse.json({
      integration,
      message: 'Integration created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}

// PUT - Update integration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, config, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Find the integration in the database
    // 2. Update the fields
    // 3. Test connection if config changed
    // 4. Update sync settings

    const updatedIntegration = {
      id,
      name: name || 'Updated Integration',
      config: config || {},
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      integration: updatedIntegration,
      message: 'Integration updated successfully'
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Find the integration
    // 2. Clean up webhooks
    // 3. Stop sync processes
    // 4. Remove from database

    return NextResponse.json({
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}

// Helper functions for integration management
export async function testConnection(integration: Integration) {
  try {
    const { type, provider, config } = integration;
    
    switch (type) {
      case 'crm':
        return await testCRMConnection(provider, config);
      case 'email_service':
        return await testEmailServiceConnection(provider, config);
      case 'analytics':
        return await testAnalyticsConnection(provider, config);
      default:
        return { success: false, error: 'Unsupported integration type' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testCRMConnection(provider: string, config: any) {
  const providerConfig = crmProviders[provider];
  if (!providerConfig) {
    return { success: false, error: 'Unknown CRM provider' };
  }

  // Mock connection test
  // In real implementation, make actual API call to test credentials
  return {
    success: true,
    data: {
      provider,
      apiVersion: 'v2',
      permissions: ['read_contacts', 'write_contacts'],
      limits: {
        dailyRequests: 10000,
        remainingRequests: 9876
      }
    }
  };
}

async function testEmailServiceConnection(provider: string, config: any) {
  const providerConfig = emailProviders[provider];
  if (!providerConfig) {
    return { success: false, error: 'Unknown email service provider' };
  }

  // Mock connection test
  return {
    success: true,
    data: {
      provider,
      status: 'active',
      limits: {
        dailyEmails: 100000,
        remainingEmails: 95432
      }
    }
  };
}

async function testAnalyticsConnection(provider: string, config: any) {
  const providerConfig = analyticsProviders[provider];
  if (!providerConfig) {
    return { success: false, error: 'Unknown analytics provider' };
  }

  // Mock connection test
  return {
    success: true,
    data: {
      provider,
      accountId: 'UA-123456789-1',
      properties: ['website', 'mobile_app']
    }
  };
}

export async function syncIntegration(integrationId: string) {
  try {
    // In a real implementation:
    // 1. Fetch integration config
    // 2. Connect to external service
    // 3. Sync data based on settings
    // 4. Update sync stats
    // 5. Handle errors and retries

    const syncResult = {
      integrationId,
      syncedAt: new Date().toISOString(),
      recordsSynced: Math.floor(Math.random() * 100) + 1,
      errors: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
      duration: Math.floor(Math.random() * 5000) + 1000 // milliseconds
    };

    return { success: true, data: syncResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function setupWebhook(integration: Integration, events: string[]) {
  try {
    const { provider, config } = integration;
    
    // Mock webhook setup
    const webhook = {
      id: `webhook_${Date.now()}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${integration.id}`,
      events,
      secret: generateWebhookSecret(),
      createdAt: new Date().toISOString()
    };

    return { success: true, data: webhook };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateWebhookSecret(): string {
  return Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
}

// Export utility functions for use in other parts of the application
export {
  crmProviders,
  emailProviders,
  analyticsProviders
};