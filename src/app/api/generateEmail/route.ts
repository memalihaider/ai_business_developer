import { NextRequest, NextResponse } from 'next/server';

// API configurations
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface EmailRequest {
  type: 'business' | 'marketing' | 'follow-up' | 'thank-you' | 'custom';
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  purpose: string;
  recipientName?: string;
  senderName?: string;
  companyName?: string;
  context?: string;
  keyPoints?: string[];
  callToAction?: string;
  customPrompt?: string;
}

async function generateWithOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-business-developer.com',
      'X-Title': 'AI Business Developer'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: `You are a professional email writer. Create compelling, well-structured emails that are clear, engaging, and appropriate for business communication. Format the output in clean HTML with proper paragraphs and formatting.\n\n${prompt}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
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
          text: `You are a professional email writer. Create compelling, well-structured emails that are clear and effective. Format the output in clean HTML with proper structure.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 1500,
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

function createEmailPrompt(data: EmailRequest): string {
  let prompt = `Create a ${data.tone} ${data.type} email`;
  
  if (data.recipientName) {
    prompt += ` addressed to ${data.recipientName}`;
  }
  
  if (data.senderName) {
    prompt += ` from ${data.senderName}`;
  }
  
  if (data.companyName) {
    prompt += ` representing ${data.companyName}`;
  }
  
  prompt += `.\n\nPurpose: ${data.purpose}`;
  
  if (data.context) {
    prompt += `\n\nContext: ${data.context}`;
  }
  
  if (data.keyPoints && data.keyPoints.length > 0) {
    prompt += `\n\nKey points to include:\n${data.keyPoints.map(point => `- ${point}`).join('\n')}`;
  }
  
  if (data.callToAction) {
    prompt += `\n\nCall to action: ${data.callToAction}`;
  }
  
  if (data.customPrompt) {
    prompt += `\n\nAdditional instructions: ${data.customPrompt}`;
  }
  
  prompt += `\n\nPlease create a complete email with appropriate greeting, body, and closing. Make it engaging and professional.`;
  
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    
    // Validate required fields
    if (!body.type || !body.tone || !body.purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: type, tone, and purpose are required' },
        { status: 400 }
      );
    }
    
    // Create the prompt
    const prompt = createEmailPrompt(body);
    
    // Generate email content with fallback mechanism
    let generatedContent = '';
    
    try {
      generatedContent = await generateWithOpenRouter(prompt);
    } catch (openRouterError) {
      console.error('OpenRouter API failed, trying Gemini:', openRouterError);
      
      try {
        generatedContent = await generateWithGemini(prompt);
      } catch (geminiError) {
        console.error('Both APIs failed:', { openRouterError, geminiError });
        return NextResponse.json(
          { error: 'AI email generation is currently unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }
    
    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate email content' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      generatedEmail: generatedContent,
      prompt: prompt
    });
    
  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}