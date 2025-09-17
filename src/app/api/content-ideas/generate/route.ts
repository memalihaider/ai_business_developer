import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateUser = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('User not found or inactive');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Validation schema for AI generation request
const generateIdeaSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  category: z.string().default('general'),
  platform: z.string().optional(),
  count: z.number().min(1).max(10).default(1),
  tone: z.enum(['professional', 'casual', 'creative', 'informative', 'engaging']).default('engaging'),
  targetAudience: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  userId: z.string().optional(),
  saveToDatabase: z.boolean().default(true),
});

// Mock AI content generation (replace with actual AI API integration)
function generateContentWithAI(params: {
  prompt: string;
  category: string;
  platform?: string;
  count: number;
  tone: string;
  targetAudience?: string;
  keywords?: string[];
}) {
  const { prompt, category, platform, count, tone, targetAudience, keywords } = params;
  
  // Sample content ideas based on different categories and platforms
  const contentTemplates = {
    'social-media': {
      instagram: [
        'Behind-the-scenes content showing your daily workflow',
        'User-generated content featuring customer testimonials',
        'Quick tips carousel posts for your industry',
        'Before and after transformation posts',
        'Interactive polls and questions in Stories',
        'Product showcase with lifestyle photography',
        'Day-in-the-life content series',
        'Tutorial videos and step-by-step guides',
        'Community spotlights and user features',
        'Trending hashtag challenges',
      ],
      twitter: [
        'Industry insights and trending topics discussion',
        'Quick tips in thread format',
        'Live-tweeting from events or conferences',
        'Engaging questions to spark conversations',
        'Sharing valuable resources and tools',
        'Breaking news and industry updates',
        'Motivational quotes and inspiration',
        'Behind-the-scenes company updates',
        'Customer success story threads',
        'Educational mini-courses in tweets',
      ],
      linkedin: [
        'Professional insights and industry analysis',
        'Career advice and professional development tips',
        'Company culture and team highlights',
        'Thought leadership articles',
        'Business case studies and success stories',
        'Industry trend predictions and analysis',
        'Leadership lessons and management tips',
        'Networking strategies and relationship building',
        'Skills development and learning resources',
        'Company milestone celebrations',
      ],
    },
    blog: [
      'How-to guides and tutorials for your industry',
      'Industry trends and future predictions',
      'Case studies showcasing successful projects',
      'Expert interviews and thought leadership pieces',
      'Problem-solving articles addressing common pain points',
      'Comprehensive resource lists and toolkits',
      'Behind-the-scenes process documentation',
      'Customer journey mapping and insights',
      'Comparative analysis and reviews',
      'Best practices and lessons learned',
    ],
    video: [
      'Educational tutorials and how-to videos',
      'Behind-the-scenes content and company culture',
      'Product demonstrations and reviews',
      'Customer testimonials and success stories',
      'Live Q&A sessions and webinars',
      'Time-lapse creation processes',
      'Interview series with industry experts',
      'Virtual tours and facility showcases',
      'Animated explainer videos',
      'Interactive workshops and training',
    ],
    email: [
      'Welcome series for new subscribers',
      'Weekly newsletters with industry insights',
      'Product updates and feature announcements',
      'Educational content and tips',
      'Exclusive offers and promotions',
      'Customer success story features',
      'Industry trend reports and analysis',
      'Event invitations and announcements',
      'Seasonal campaigns and themed content',
      'Re-engagement campaigns for inactive users',
    ],
  };

  // Generate ideas based on the prompt and parameters
  const ideas = [];
  const baseTemplates = platform && contentTemplates['social-media'][platform as keyof typeof contentTemplates['social-media']] 
    ? contentTemplates['social-media'][platform as keyof typeof contentTemplates['social-media']]
    : contentTemplates[category as keyof typeof contentTemplates] || contentTemplates.blog;

  // Create a shuffled copy of templates to ensure uniqueness
  const shuffledTemplates = [...baseTemplates].sort(() => Math.random() - 0.5);
  const usedTemplates = new Set<string>();
  
  // Additional variation phrases for more uniqueness
  const variationPhrases = [
    'innovative approach to',
    'comprehensive guide for',
    'strategic insights on',
    'creative solutions for',
    'expert perspective on',
    'practical tips for',
    'advanced techniques in',
    'beginner-friendly guide to',
    'data-driven analysis of',
    'actionable strategies for'
  ];

  for (let i = 0; i < count; i++) {
    let selectedTemplate;
    let attempts = 0;
    
    // Try to find an unused template, with fallback to avoid infinite loops
    do {
      const templateIndex = (i + attempts) % shuffledTemplates.length;
      selectedTemplate = shuffledTemplates[templateIndex];
      attempts++;
    } while (usedTemplates.has(selectedTemplate) && attempts < shuffledTemplates.length * 2);
    
    usedTemplates.add(selectedTemplate);
    
    // Customize the template based on the prompt and parameters
    let customizedIdea = selectedTemplate;
    
    // Add variation phrase for more uniqueness
    if (Math.random() > 0.5 && variationPhrases.length > 0) {
      const variationPhrase = variationPhrases[i % variationPhrases.length];
      customizedIdea = `${variationPhrase} ${customizedIdea.toLowerCase()}`;
    }
    
    if (keywords && keywords.length > 0) {
      const keywordIndex = i % keywords.length; // Cycle through keywords for variety
      const keyword = keywords[keywordIndex];
      customizedIdea = `${customizedIdea} focusing on ${keyword}`;
    }
    
    if (targetAudience) {
      customizedIdea += ` for ${targetAudience}`;
    }
    
    // Add tone-specific modifications with more variety
    const toneModifiers = {
      professional: ['Professional', 'Corporate', 'Business-focused', 'Executive-level'],
      casual: ['Casual and friendly', 'Relaxed', 'Conversational', 'Approachable'],
      creative: ['Creative and innovative', 'Artistic', 'Imaginative', 'Original'],
      informative: ['Informative and detailed', 'Educational', 'Comprehensive', 'In-depth'],
      engaging: ['Engaging and interactive', 'Captivating', 'Dynamic', 'Compelling']
    };
    
    const modifierArray = toneModifiers[tone as keyof typeof toneModifiers] || ['Engaging'];
    const selectedModifier = modifierArray[i % modifierArray.length];
    customizedIdea = `${selectedModifier} ${customizedIdea.toLowerCase()}`;
    
    // Add unique timestamp-based suffix to ensure absolute uniqueness
    const uniqueSuffix = `_${Date.now()}_${i}`;
    
    ideas.push({
      title: customizedIdea,
      description: `Generated content idea based on: ${prompt} (ID: ${uniqueSuffix})`,
      content: `This is a ${tone} content idea for ${category}${platform ? ` on ${platform}` : ''}. ${customizedIdea}`,
      category,
      platform,
      tags: keywords || [],
      aiGenerated: true,
      aiPrompt: prompt,
      aiModel: 'mock-ai-v1',
    });
  }
  
  return ideas;
}

// POST - Generate content ideas using AI
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const body = await request.json();
    const validatedData = generateIdeaSchema.parse(body);

    // Generate content ideas using AI (mock implementation)
    const generatedIdeas = generateContentWithAI({
      prompt: validatedData.prompt,
      category: validatedData.category,
      platform: validatedData.platform,
      count: validatedData.count,
      tone: validatedData.tone,
      targetAudience: validatedData.targetAudience,
      keywords: validatedData.keywords,
    });

    const savedIdeas = [];

    // Save to database if requested
    if (validatedData.saveToDatabase) {
      for (const idea of generatedIdeas) {
        const tagsString = idea.tags.length > 0 ? JSON.stringify(idea.tags) : null;
        
        const savedIdea = await prisma.contentIdea.create({
          data: {
            title: idea.title,
            description: idea.description,
            content: idea.content,
            category: idea.category,
            platform: idea.platform,
            tags: tagsString,
            aiGenerated: idea.aiGenerated,
            aiPrompt: idea.aiPrompt,
            aiModel: idea.aiModel,
            userId: user.id,
            status: 'draft',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        // Log analytics event
        await prisma.contentIdeaAnalytics.create({
          data: {
            ideaId: savedIdea.id,
            event: 'generated',
            userId: user.id,
            metadata: JSON.stringify({
              prompt: validatedData.prompt,
              category: validatedData.category,
              platform: validatedData.platform,
              tone: validatedData.tone,
            }),
          },
        });

        savedIdeas.push({
          ...savedIdea,
          tags: savedIdea.tags ? JSON.parse(savedIdea.tags) : [],
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: validatedData.saveToDatabase ? savedIdeas : generatedIdeas.map(idea => ({
        ...idea,
        id: `temp-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      metadata: {
        prompt: validatedData.prompt,
        count: validatedData.count,
        saved: validatedData.saveToDatabase,
        aiModel: 'mock-ai-v1',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating content ideas:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid or expired token' || error.message === 'User not found or inactive')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate content ideas' },
      { status: 500 }
    );
  }
}

// GET - Get generation history and statistics
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent AI-generated ideas
    const recentGenerations = await prisma.contentIdea.findMany({
      where: {
        userId: user.id,
        aiGenerated: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        platform: true,
        aiPrompt: true,
        aiModel: true,
        createdAt: true,
      },
    });

    // Get generation statistics
    const stats = await prisma.contentIdeaAnalytics.groupBy({
      by: ['event'],
      where: {
        userId: user.id,
        event: 'generated',
      },
      _count: {
        event: true,
      },
    });

    const totalGenerations = stats.find(s => s.event === 'generated')?._count.event || 0;

    return NextResponse.json({
      success: true,
      data: {
        recentGenerations,
        statistics: {
          totalGenerations,
          totalIdeas: await prisma.contentIdea.count({ where: { userId: user.id, aiGenerated: true } }),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching generation history:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid or expired token' || error.message === 'User not found or inactive')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch generation history' },
      { status: 500 }
    );
  }
}