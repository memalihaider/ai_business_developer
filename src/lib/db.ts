import { PrismaClient } from '@prisma/client';
import { secureOperation, validateEmail, validateRequired, sanitizeInput } from './db-wrapper';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Lead-related database operations
export const leadOperations = {
  // Get all leads
  async getAllLeads() {
    return await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Create a new lead
  async createLead(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    value?: string;
    status?: string;
    owner?: string;
    priority?: string;
    notes?: string;
  }) {
    return await prisma.lead.create({
      data,
    });
  },

  // Update a lead
  async updateLead(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    value?: string;
    status?: string;
    owner?: string;
    priority?: string;
    notes?: string;
  }) {
    return await prisma.lead.update({
      where: { id },
      data,
    });
  },

  // Delete a lead
  async deleteLead(id: string) {
    return await prisma.lead.delete({
      where: { id },
    });
  },

  // Get a single lead by ID
  async getLeadById(id: string) {
    return await prisma.lead.findUnique({
      where: { id },
    });
  },

  // Search leads
  async searchLeads(query: string) {
    return await prisma.lead.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

// Proposal-related database operations
export const proposalOperations = {
  // Get all proposals
  async getAllProposals() {
    return await prisma.proposal.findMany({
      include: {
        template: true,
        lead: true,
        analytics: true,
        collaborators: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Create a new proposal
  async createProposal(data: {
    title: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    description: string;
    timeline?: string;
    budget?: string;
    type?: string;
    status?: string;
    content?: string;
    sections?: any[];
    templateId?: string;
    leadId?: string;
    isDraft?: boolean;
  }) {
    return await prisma.proposal.create({
      data: {
        ...data,
        sections: data.sections ? JSON.stringify(data.sections) : null,
      },
      include: {
        template: true,
        lead: true,
      },
    });
  },

  // Update a proposal
  async updateProposal(id: string, data: {
    title?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    description?: string;
    timeline?: string;
    budget?: string;
    type?: string;
    status?: string;
    content?: string;
    sections?: any[];
    templateId?: string;
    isDraft?: boolean;
    sentAt?: Date;
    viewedAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
  }) {
    return await prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        sections: data.sections ? JSON.stringify(data.sections) : undefined,
      },
      include: {
        template: true,
        lead: true,
      },
    });
  },

  // Delete a proposal
  async deleteProposal(id: string) {
    return await prisma.proposal.delete({
      where: { id },
    });
  },

  // Get a single proposal by ID
  async getProposalById(id: string) {
    return await prisma.proposal.findUnique({
      where: { id },
      include: {
        template: true,
        lead: true,
        analytics: true,
        collaborators: true,
      },
    });
  },

  // Search proposals
  async searchProposals(query: string) {
    return await prisma.proposal.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        template: true,
        lead: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

// Proposal Template operations
export const templateOperations = {
  // Get all templates
  async getAllTemplates() {
    return await prisma.proposalTemplate.findMany({
      orderBy: [
        { isPopular: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  },

  // Create a new template
  async createTemplate(data: {
    name: string;
    description?: string;
    type: string;
    category: string;
    content: string;
    sections: any[];
    isPublic?: boolean;
    createdBy?: string;
  }) {
    return await prisma.proposalTemplate.create({
      data: {
        ...data,
        sections: JSON.stringify(data.sections),
      },
    });
  },

  // Update template usage count
  async incrementTemplateUsage(id: string) {
    return await prisma.proposalTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  },

  // Get template by ID
  async getTemplateById(id: string) {
    return await prisma.proposalTemplate.findUnique({
      where: { id },
    });
  },

  // Search templates
  async searchTemplates(query: string, category?: string) {
    return await prisma.proposalTemplate.findMany({
      where: {
        AND: [
          category ? { category } : {},
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { type: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: [
        { isPopular: 'desc' },
        { usageCount: 'desc' },
      ],
    });
  },

  // Update a template
  async updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    type?: string;
    category?: string;
    content?: string;
    sections?: any[];
    isPublic?: boolean;
    isPopular?: boolean;
  }) {
    return await prisma.proposalTemplate.update({
      where: { id },
      data: {
        ...data,
        sections: data.sections ? JSON.stringify(data.sections) : undefined,
      },
    });
  },

  // Delete a template
  async deleteTemplate(id: string) {
    return await prisma.proposalTemplate.delete({
      where: { id },
    });
  },
};

// Analytics operations
export const analyticsOperations = {
  // Track proposal event
  async trackProposalEvent(data: {
    proposalId: string;
    event: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.proposalAnalytics.create({
        data: {
          ...data,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error) {
      console.warn('Failed to track proposal event:', error);
      return null;
    }
  },

  // Get proposal analytics
  async getProposalAnalytics(proposalId: string) {
    try {
      return await prisma.proposalAnalytics.findMany({
        where: { proposalId },
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      console.warn('Failed to get proposal analytics:', error);
      return [];
    }
  },

  // Get analytics summary
  async getAnalyticsSummary() {
    try {
      const totalProposals = await prisma.proposal.count();
      const sentProposals = await prisma.proposal.count({
        where: { status: { not: 'draft' } },
      });
      const acceptedProposals = await prisma.proposal.count({
        where: { status: 'accepted' },
      });
      const viewedProposals = await prisma.proposal.count({
        where: { viewedAt: { not: null } },
      });

      return {
        totalProposals,
        sentProposals,
        acceptedProposals,
        viewedProposals,
        conversionRate: sentProposals > 0 ? (acceptedProposals / sentProposals) * 100 : 0,
        viewRate: sentProposals > 0 ? (viewedProposals / sentProposals) * 100 : 0,
      };
    } catch (error) {
      console.warn('Error getting analytics summary, using defaults:', error);
      return {
        totalProposals: 0,
        sentProposals: 0,
        acceptedProposals: 0,
        viewedProposals: 0,
        conversionRate: 0,
        viewRate: 0,
      };
    }
  },
};

// Client operations
export const clientOperations = {
  // Get all clients
  async getAllClients() {
    return await secureOperation(
      () => prisma.client.findMany({
        include: {
          lead: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      { action: 'getAllClients', resource: 'clients' }
    );
  },

  // Create a new client
  async createClient(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    industry?: string;
    notes?: string;
    tags?: string[];
    leadId?: string;
  }) {
    // Validate required fields
    validateRequired(data.name, 'Name');
    validateRequired(data.email, 'Email');
    
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    // Sanitize inputs
    const sanitizedData = {
      ...data,
      name: sanitizeInput(data.name),
      email: data.email.toLowerCase().trim(),
      phone: data.phone ? sanitizeInput(data.phone) : undefined,
      company: data.company ? sanitizeInput(data.company) : undefined,
      address: data.address ? sanitizeInput(data.address) : undefined,
      industry: data.industry ? sanitizeInput(data.industry) : undefined,
      notes: data.notes ? sanitizeInput(data.notes) : undefined,
    };
    
    return await secureOperation(
      () => prisma.client.create({
        data: {
          ...sanitizedData,
          tags: data.tags ? JSON.stringify(data.tags) : null,
        },
        include: {
          lead: true,
        },
      }),
      { action: 'createClient', resource: 'clients' }
    );
  },

  // Update a client
  async updateClient(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    industry?: string;
    notes?: string;
    tags?: string[];
  }) {
    validateRequired(id, 'Client ID');
    
    // Validate email if provided
    if (data.email && !validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    // Sanitize inputs
    const sanitizedData: any = {};
    if (data.name) sanitizedData.name = sanitizeInput(data.name);
    if (data.email) sanitizedData.email = data.email.toLowerCase().trim();
    if (data.phone) sanitizedData.phone = sanitizeInput(data.phone);
    if (data.company) sanitizedData.company = sanitizeInput(data.company);
    if (data.address) sanitizedData.address = sanitizeInput(data.address);
    if (data.industry) sanitizedData.industry = sanitizeInput(data.industry);
    if (data.notes) sanitizedData.notes = sanitizeInput(data.notes);
    if (data.tags) sanitizedData.tags = JSON.stringify(data.tags);
    
    return await secureOperation(
      () => prisma.client.update({
        where: { id },
        data: sanitizedData,
        include: {
          lead: true,
        },
      }),
      { action: 'updateClient', resource: 'clients' }
    );
  },

  // Get client by ID
  async getClientById(id: string) {
    validateRequired(id, 'Client ID');
    
    return await secureOperation(
      () => prisma.client.findUnique({
        where: { id },
        include: {
          lead: true,
        },
      }),
      { action: 'getClientById', resource: 'clients' }
    );
  },

  // Delete a client
  async deleteClient(id: string) {
    validateRequired(id, 'Client ID');
    
    return await secureOperation(
      () => prisma.client.delete({
        where: { id },
      }),
      { action: 'deleteClient', resource: 'clients' }
    );
  },

  // Search clients
  async searchClients(query: string) {
    validateRequired(query, 'Search query');
    const sanitizedQuery = sanitizeInput(query);
    
    return await secureOperation(
      () => prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: sanitizedQuery, mode: 'insensitive' } },
            { email: { contains: sanitizedQuery, mode: 'insensitive' } },
            { company: { contains: sanitizedQuery, mode: 'insensitive' } },
            { industry: { contains: sanitizedQuery, mode: 'insensitive' } },
          ],
        },
        include: {
          lead: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      { action: 'searchClients', resource: 'clients' }
    );
  },
};

// Case Study-related database operations
export const caseStudyOperations = {
  // Get all case studies
  async getAllCaseStudies() {
    return await prisma.caseStudy.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Create a new case study
  async createCaseStudy(data: {
    title: string;
    client: string;
    industry: string;
    summary: string;
    problem?: string;
    solution?: string;
    results?: string;
    cover?: string;
    tags: string[];
    metrics?: { label: string; value: string }[];
    techStack?: string;
    draft?: boolean;
    googleDocLink?: string | null;
  }) {
    return await prisma.caseStudy.create({
      data: {
        ...data,
        tags: JSON.stringify(data.tags),
        metrics: data.metrics ? JSON.stringify(data.metrics) : null,
      },
    });
  },

  // Update a case study
  async updateCaseStudy(id: string, data: {
    title?: string;
    client?: string;
    industry?: string;
    summary?: string;
    problem?: string;
    solution?: string;
    results?: string;
    cover?: string;
    tags?: string[];
    metrics?: { label: string; value: string }[];
    techStack?: string;
    draft?: boolean;
  }) {
    return await prisma.caseStudy.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        metrics: data.metrics ? JSON.stringify(data.metrics) : undefined,
      },
    });
  },

  // Delete a case study
  async deleteCaseStudy(id: string) {
    return await prisma.caseStudy.delete({
      where: { id },
    });
  },

  // Get a single case study by ID
  async getCaseStudyById(id: string) {
    return await prisma.caseStudy.findUnique({
      where: { id },
    });
  },

  // Search case studies
  async searchCaseStudies(query: string) {
    return await prisma.caseStudy.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { client: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
}