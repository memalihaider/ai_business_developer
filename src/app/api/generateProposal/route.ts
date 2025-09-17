import { NextRequest, NextResponse } from 'next/server';
import { proposalOperations, templateOperations, analyticsOperations } from '@/lib/db';

export const dynamic = 'force-static';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Fallback to Gemini if OpenRouter is not available
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ProposalRequest {
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  timeline?: string;
  budget?: string;
  type?: string;
  templateId?: string;
  leadId?: string;
  customSections?: Array<{
    title: string;
    content: string;
  }>;
  aiPrompt?: string;
  isAISuggestion?: boolean;
}

async function generateWithOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Business Developer'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are a professional business proposal writer. Create compelling, well-structured proposals that are persuasive and professional. Format the output in clean HTML with proper headings, paragraphs, and sections.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function generateWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a professional business proposal writer. Create compelling, well-structured proposals that are persuasive and professional. Format the output in clean HTML with proper headings, paragraphs, and sections.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

function createProposalPrompt(data: ProposalRequest, templateContent?: string): string {
  let prompt = `Create a professional business proposal with the following details:

`;
  
  prompt += `Title: ${data.title}\n`;
  prompt += `Client: ${data.clientName}\n`;
  prompt += `Description: ${data.description}\n`;
  
  if (data.timeline) prompt += `Timeline: ${data.timeline}\n`;
  if (data.budget) prompt += `Budget: ${data.budget}\n`;
  if (data.type) prompt += `Type: ${data.type}\n`;
  
  if (templateContent) {
    prompt += `\nUse this template as a guide (adapt the content to match the specific requirements):\n${templateContent}\n`;
  }
  
  if (data.customSections && data.customSections.length > 0) {
    prompt += `\nInclude these custom sections:\n`;
    data.customSections.forEach(section => {
      prompt += `- ${section.title}: ${section.content}\n`;
    });
  }
  
  prompt += `\nPlease create a comprehensive, professional proposal that includes:
`;
  prompt += `1. Executive Summary
`;
  prompt += `2. Project Overview
`;
  prompt += `3. Scope of Work
`;
  prompt += `4. Timeline and Deliverables
`;
  prompt += `5. Investment/Pricing
`;
  prompt += `6. Why Choose Us
`;
  prompt += `7. Next Steps
`;
  prompt += `\nMake it persuasive, professional, and tailored to the client's needs.`;
  
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProposalRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.clientName || !body.description) {
      return NextResponse.json(
        { error: 'Title, client name, and description are required' },
        { status: 400 }
      );
    }

    // Get template content if templateId is provided
    let templateContent = '';
    if (body.templateId) {
      try {
        const template = await templateOperations.getTemplateById(body.templateId);
        if (template) {
          templateContent = template.content;
          // Increment template usage
          await templateOperations.incrementTemplateUsage(body.templateId);
        }
      } catch (error) {
        console.warn('Failed to fetch template:', error);
      }
    }

    // Create the prompt - handle AI suggestions differently
    let prompt: string;
    if (body.isAISuggestion && body.aiPrompt) {
      prompt = `Based on the following proposal details, provide suggestions and improvements for: ${body.aiPrompt}

Proposal Details:
- Title: ${body.title}
- Client: ${body.clientName}
- Description: ${body.description}
- Timeline: ${body.timeline || 'Not specified'}
- Budget: ${body.budget || 'Not specified'}
- Type: ${body.type || 'service'}

Please provide specific, actionable suggestions to improve this proposal.`;
    } else {
      prompt = createProposalPrompt(body, templateContent);
    }
    
    // Try to generate with OpenRouter first, fallback to Gemini
    let generatedContent = '';
    let aiProvider = '';
    
    try {
      generatedContent = await generateWithOpenRouter(prompt);
      aiProvider = 'openrouter';
    } catch (openrouterError) {
      console.warn('OpenRouter failed, trying Gemini:', openrouterError);
      try {
        generatedContent = await generateWithGemini(prompt);
        aiProvider = 'gemini';
      } catch (geminiError) {
        console.error('Both AI providers failed:', { openrouterError, geminiError });
        return NextResponse.json(
          { error: 'AI proposal generation is currently unavailable. Please try again later or contact support.' },
          { status: 503 }
        );
      }
    }

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate proposal content' },
        { status: 500 }
      );
    }

    // For AI suggestions, don't create a proposal in the database
    let proposal = null;
    if (!body.isAISuggestion) {
      proposal = await proposalOperations.createProposal({
        title: body.title,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone,
        description: body.description,
        timeline: body.timeline,
        budget: body.budget,
        type: body.type || 'service',
        content: generatedContent,
        sections: body.customSections,
        templateId: body.templateId,
        leadId: body.leadId,
        isDraft: true
      });
    }

    // Track analytics only for actual proposals, not AI suggestions
    if (proposal) {
      await analyticsOperations.trackProposalEvent({
        proposalId: proposal.id,
        event: 'generated',
        metadata: {
          aiProvider,
          templateUsed: !!body.templateId,
          customSections: body.customSections?.length || 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      proposal,
      content: generatedContent,
      aiProvider
    });
    
  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}
