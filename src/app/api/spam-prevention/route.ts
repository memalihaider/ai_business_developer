import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Spam trigger words and phrases
const SPAM_TRIGGERS = {
  high: [
    'free money', 'guaranteed income', 'make money fast', 'get rich quick',
    'no investment', 'risk free', 'cash bonus', 'prize', 'winner',
    'congratulations you have won', 'lottery', 'inheritance',
    'nigerian prince', 'urgent response required'
  ],
  medium: [
    'limited time', 'act now', 'hurry', 'expires today', 'last chance',
    'buy now', 'order now', 'click here', 'visit our website',
    'special promotion', 'exclusive offer', 'amazing deal'
  ],
  low: [
    'free', 'discount', 'sale', 'offer', 'deal', 'promotion',
    'save money', 'cheap', 'affordable', 'best price'
  ]
};

// Content analysis patterns
const CONTENT_PATTERNS = {
  excessive_caps: /[A-Z]{4,}/g,
  excessive_exclamation: /!{2,}/g,
  suspicious_urls: /bit\.ly|tinyurl|t\.co|goo\.gl/gi,
  phone_numbers: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  email_addresses: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
};

// POST /api/spam-prevention - Analyze content for spam indicators
export async function POST(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const body = await request.json();
    const { subject, content, fromEmail, toEmails } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeContent(subject, content, fromEmail, toEmails);
    
    return NextResponse.json({
      analysis,
      recommendations: generateRecommendations(analysis)
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

// GET /api/spam-prevention/domain-reputation - Check domain reputation
export async function GET(request: NextRequest) {
  try {
    // Authentication would be handled by middleware or context
    // For now, proceeding without session check

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const reputation = await checkDomainReputation(domain);
    
    return NextResponse.json({ reputation });
  } catch (error) {
    console.error('Error checking domain reputation:', error);
    return NextResponse.json(
      { error: 'Failed to check domain reputation' },
      { status: 500 }
    );
  }
}

// Content analysis function
async function analyzeContent(subject: string, content: string, fromEmail?: string, toEmails?: string[]) {
  const fullText = `${subject} ${content}`.toLowerCase();
  const analysis = {
    spamScore: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high',
    issues: [] as any[],
    suggestions: [] as string[],
    authentication: {
      spf: false,
      dkim: false,
      dmarc: false
    },
    contentAnalysis: {
      spamTriggers: {
        high: [] as string[],
        medium: [] as string[],
        low: [] as string[]
      },
      patterns: {
        excessiveCaps: 0,
        excessiveExclamation: 0,
        suspiciousUrls: 0,
        phoneNumbers: 0,
        emailAddresses: 0
      },
      readability: {
        wordCount: content.split(/\s+/).length,
        sentenceCount: content.split(/[.!?]+/).length,
        avgWordsPerSentence: 0
      }
    }
  };

  // Check for spam triggers
  Object.entries(SPAM_TRIGGERS).forEach(([level, triggers]) => {
    triggers.forEach(trigger => {
      if (fullText.includes(trigger.toLowerCase())) {
        analysis.contentAnalysis.spamTriggers[level as keyof typeof SPAM_TRIGGERS].push(trigger);
        analysis.spamScore += level === 'high' ? 30 : level === 'medium' ? 15 : 5;
      }
    });
  });

  // Check content patterns
  const capsMatches = content.match(CONTENT_PATTERNS.excessive_caps) || [];
  analysis.contentAnalysis.patterns.excessiveCaps = capsMatches.length;
  if (capsMatches.length > 3) {
    analysis.spamScore += 10;
    analysis.issues.push({
      type: 'excessive_caps',
      message: 'Excessive use of capital letters detected',
      severity: 'medium'
    });
  }

  const exclamationMatches = content.match(CONTENT_PATTERNS.excessive_exclamation) || [];
  analysis.contentAnalysis.patterns.excessiveExclamation = exclamationMatches.length;
  if (exclamationMatches.length > 2) {
    analysis.spamScore += 8;
    analysis.issues.push({
      type: 'excessive_exclamation',
      message: 'Excessive use of exclamation marks detected',
      severity: 'medium'
    });
  }

  const urlMatches = content.match(CONTENT_PATTERNS.suspicious_urls) || [];
  analysis.contentAnalysis.patterns.suspiciousUrls = urlMatches.length;
  if (urlMatches.length > 0) {
    analysis.spamScore += 15;
    analysis.issues.push({
      type: 'suspicious_urls',
      message: 'Suspicious URL shorteners detected',
      severity: 'high'
    });
  }

  // Calculate readability
  const { wordCount, sentenceCount } = analysis.contentAnalysis.readability;
  analysis.contentAnalysis.readability.avgWordsPerSentence = 
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  if (analysis.contentAnalysis.readability.avgWordsPerSentence > 25) {
    analysis.spamScore += 5;
    analysis.issues.push({
      type: 'readability',
      message: 'Sentences are too long, consider breaking them up',
      severity: 'low'
    });
  }

  // Check authentication if domain provided
  if (fromEmail) {
    const domain = fromEmail.split('@')[1];
    if (domain) {
      analysis.authentication = await checkEmailAuthentication(domain);
      
      if (!analysis.authentication.spf) {
        analysis.spamScore += 20;
        analysis.issues.push({
          type: 'missing_spf',
          message: 'SPF record not found for domain',
          severity: 'high'
        });
      }
      
      if (!analysis.authentication.dkim) {
        analysis.spamScore += 15;
        analysis.issues.push({
          type: 'missing_dkim',
          message: 'DKIM not configured for domain',
          severity: 'medium'
        });
      }
      
      if (!analysis.authentication.dmarc) {
        analysis.spamScore += 10;
        analysis.issues.push({
          type: 'missing_dmarc',
          message: 'DMARC policy not found for domain',
          severity: 'medium'
        });
      }
    }
  }

  // Determine risk level
  if (analysis.spamScore >= 50) {
    analysis.riskLevel = 'high';
  } else if (analysis.spamScore >= 25) {
    analysis.riskLevel = 'medium';
  }

  return analysis;
}

// Check email authentication records
async function checkEmailAuthentication(domain: string) {
  // In a real implementation, you would use DNS lookup libraries
  // For now, we'll simulate the checks
  return {
    spf: Math.random() > 0.3, // Simulate 70% have SPF
    dkim: Math.random() > 0.4, // Simulate 60% have DKIM
    dmarc: Math.random() > 0.6 // Simulate 40% have DMARC
  };
}

// Check domain reputation
async function checkDomainReputation(domain: string) {
  // In a real implementation, you would check against reputation services
  // For now, we'll simulate the reputation check
  const reputationScore = Math.floor(Math.random() * 100);
  
  return {
    domain,
    score: reputationScore,
    status: reputationScore >= 80 ? 'good' : reputationScore >= 50 ? 'neutral' : 'poor',
    lastChecked: new Date().toISOString(),
    sources: [
      { name: 'Sender Score', score: reputationScore + Math.floor(Math.random() * 10) - 5 },
      { name: 'Reputation Authority', score: reputationScore + Math.floor(Math.random() * 10) - 5 }
    ]
  };
}

// Generate recommendations based on analysis
function generateRecommendations(analysis: any) {
  const recommendations = [];

  if (analysis.riskLevel === 'high') {
    recommendations.push({
      type: 'critical',
      message: 'High spam risk detected. Consider revising content before sending.',
      priority: 1
    });
  }

  if (analysis.contentAnalysis.spamTriggers.high.length > 0) {
    recommendations.push({
      type: 'content',
      message: `Remove high-risk spam triggers: ${analysis.contentAnalysis.spamTriggers.high.join(', ')}`,
      priority: 1
    });
  }

  if (!analysis.authentication.spf || !analysis.authentication.dkim) {
    recommendations.push({
      type: 'authentication',
      message: 'Configure email authentication (SPF, DKIM, DMARC) to improve deliverability',
      priority: 2
    });
  }

  if (analysis.contentAnalysis.patterns.excessiveCaps > 3) {
    recommendations.push({
      type: 'formatting',
      message: 'Reduce use of capital letters to avoid appearing spammy',
      priority: 3
    });
  }

  if (analysis.contentAnalysis.readability.avgWordsPerSentence > 25) {
    recommendations.push({
      type: 'readability',
      message: 'Break up long sentences to improve readability',
      priority: 3
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}