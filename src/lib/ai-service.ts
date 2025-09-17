import { GoogleGenerativeAI } from '@google/generative-ai';

interface OpportunityAlert {
  id: number;
  message: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  actionable: boolean;
}

interface OpportunityData {
  id: number;
  title: string;
  industry: string;
  value: string;
  priority: string;
  confidence: number;
  status: string;
  dateAdded: string;
  description: string;
}


interface SentimentAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  score: number; // -1 to 1, where -1 is most negative, 1 is most positive
  keywords: string[];
}

interface TextAnalysisResult {
  sentiment: SentimentAnalysisResult;
  topics: string[];
  entities: string[];
  summary: string;
  readabilityScore: number;
}



class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }


  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    if (this.genAI) {
      return await this.aiSentimentAnalysis(text);
    } else {
      return this.ruleBasedSentimentAnalysis(text);
    }
  }

  async analyzeText(text: string): Promise<TextAnalysisResult> {
    const sentiment = await this.analyzeSentiment(text);
    const topics = this.extractTopics(text);
    const entities = this.extractEntities(text);
    const summary = this.generateSummary(text);
    const readabilityScore = this.calculateReadabilityScore(text);
    
    return {
      sentiment,
      topics,
      entities,
      summary,
      readabilityScore
    };
  }



  private async aiSentimentAnalysis(text: string): Promise<SentimentAnalysisResult> {
    try {
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze the sentiment of this text and respond with a JSON object containing:
      - sentiment: "positive", "neutral", or "negative"
      - confidence: number between 0 and 1
      - score: number between -1 and 1 (-1 most negative, 1 most positive)
      - keywords: array of up to 5 relevant sentiment keywords
      
      Text: "${text}"
      
      Respond only with valid JSON:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      const parsed = JSON.parse(jsonText);
      
      return {
        sentiment: parsed.sentiment,
        confidence: parsed.confidence,
        score: parsed.score,
        keywords: parsed.keywords || []
      };
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
      return this.ruleBasedSentimentAnalysis(text);
    }
  }

  async generateIndustryAlerts(industries: string[]): Promise<OpportunityAlert[]> {
    if (!this.genAI) {
      // Fallback to mock data if no API key
      return this.getMockAlerts();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Generate 4-6 realistic business opportunity alerts for the following industries: ${industries.join(', ')}. 
      
      For each alert, provide:
      - A specific, actionable message about market opportunities, trends, or competitive insights
      - Appropriate severity level (low, medium, high, critical)
      - Realistic source (e.g., "Market Research", "Government Portal", "Industry Report")
      - Whether it's actionable (true/false)
      
      Format as JSON array with this structure:
      {
        "message": "specific alert message",
        "type": "opportunity|market-trend|competitive|regulatory|funding",
        "severity": "low|medium|high|critical",
        "source": "source name",
        "actionable": true|false
      }
      
      Focus on current market conditions, emerging technologies, regulatory changes, and competitive landscape.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const alertsData = JSON.parse(text.replace(/```json|```/g, '').trim());
      
      return alertsData.map((alert: any, index: number) => ({
        id: Date.now() + index,
        message: alert.message,
        type: alert.type,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
        source: alert.source,
        actionable: alert.actionable
      }));
    } catch (error) {
      console.error('AI service error:', error);
      return this.getMockAlerts();
    }
  }

  async analyzeOpportunities(opportunities: OpportunityData[]): Promise<{
    insights: string[];
    recommendations: string[];
    marketTrends: string[];
  }> {
    if (!this.genAI) {
      return this.getMockAnalysis();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const opportunitiesText = opportunities.map(opp => 
        `${opp.title} (${opp.industry}) - ${opp.value} - Priority: ${opp.priority} - Confidence: ${opp.confidence}%`
      ).join('\n');

      const prompt = `Analyze these business opportunities and provide strategic insights:

${opportunitiesText}

Provide analysis in JSON format:
{
  "insights": ["3-4 key insights about the opportunity portfolio"],
  "recommendations": ["3-4 strategic recommendations"],
  "marketTrends": ["3-4 relevant market trends"]
}

Focus on industry patterns, value distribution, priority alignment, and competitive positioning.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getMockAnalysis();
    }
  }

  async generateOpportunities(industry: string, filters: any): Promise<OpportunityData[]> {
    if (!this.genAI) {
      return this.getMockOpportunities(industry);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Generate 5-8 realistic business opportunities for the ${industry} industry.
      
      Consider these filters: ${JSON.stringify(filters)}
      
      For each opportunity, provide:
      - Specific, realistic title
      - Estimated value range
      - Priority level (Low, Medium, High, Critical)
      - Confidence score (60-95%)
      - Current status (Active, Pending, Review)
      - Brief description
      
      Format as JSON array:
      {
        "title": "opportunity title",
        "industry": "${industry}",
        "value": "$XXX,XXX",
        "priority": "High|Medium|Low|Critical",
        "confidence": 85,
        "status": "Active|Pending|Review",
        "description": "brief description"
      }
      
      Base opportunities on current market conditions and emerging trends.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const opportunitiesData = JSON.parse(text.replace(/```json|```/g, '').trim());
      
      return opportunitiesData.map((opp: any, index: number) => ({
        id: Date.now() + index,
        title: opp.title,
        industry: opp.industry,
        value: opp.value,
        priority: opp.priority,
        confidence: opp.confidence,
        status: opp.status,
        dateAdded: new Date().toISOString(),
        description: opp.description
      }));
    } catch (error) {
      console.error('AI opportunity generation error:', error);
      return this.getMockOpportunities(industry);
    }
  }

  private ruleBasedSentimentAnalysis(text: string): SentimentAnalysisResult {
    const positiveWords = [
      'excellent', 'great', 'amazing', 'outstanding', 'professional', 'recommended',
      'satisfied', 'happy', 'love', 'best', 'fantastic', 'wonderful', 'perfect',
      'impressed', 'quality', 'reliable', 'trustworthy', 'efficient', 'helpful'
    ];
    
    const negativeWords = [
      'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointed', 'poor',
      'unsatisfied', 'hate', 'problem', 'issue', 'complaint', 'failed', 'broken'
    ];
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\W+/);
    
    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords: string[] = [];
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveScore++;
        foundKeywords.push(word);
      } else if (negativeWords.includes(word)) {
        negativeScore++;
        foundKeywords.push(word);
      }
    });
    
    let sentiment: 'positive' | 'neutral' | 'negative';
    let score: number;
    let confidence: number;
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      score = Math.min(1, positiveScore / Math.max(1, negativeScore + 1));
      confidence = Math.min(0.9, (positiveScore + negativeScore) / words.length * 3);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      score = -Math.min(1, negativeScore / Math.max(1, positiveScore + 1));
      confidence = Math.min(0.9, (positiveScore + negativeScore) / words.length * 3);
    } else {
      sentiment = 'neutral';
      score = 0;
      confidence = 0.5;
    }
    
    return {
      sentiment,
      confidence,
      score,
      keywords: foundKeywords.slice(0, 5)
    };
  }

  private extractTopics(text: string): string[] {
    const topicKeywords = {
      'customer_service': ['service', 'support', 'help', 'staff', 'team'],
      'product_quality': ['quality', 'product', 'item', 'goods', 'material'],
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'value', 'money'],
      'delivery': ['delivery', 'shipping', 'fast', 'slow', 'on-time'],
      'communication': ['communication', 'response', 'contact', 'email']
    };
    
    const lowerText = text.toLowerCase();
    const topics: string[] = [];
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        topics.push(topic.replace('_', ' '));
      }
    });
    
    return topics;
  }

  private extractEntities(text: string): string[] {
    const words = text.split(/\s+/);
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]+/.test(word) && word.length > 2
    );
    return [...new Set(capitalizedWords)].slice(0, 5);
  }

  private generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= 2) return text;
    return `${sentences[0].trim()}. ${sentences[sentences.length - 1].trim()}.`;
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (sentences.length === 0 || words.length === 0) return 0;
    const avgSentenceLength = words.length / sentences.length;
    return Math.max(0, Math.min(100, Math.round(100 - avgSentenceLength * 2)));
  }



  private getMockAlerts(): OpportunityAlert[] {
    return [
      {
        id: Date.now(),
        message: "New government funding program launched for AI startups - $50M available",
        type: "funding",
        severity: "high",
        timestamp: new Date().toISOString(),
        source: "Government Portal",
        actionable: true
      },
      {
        id: Date.now() + 1,
        message: "Healthcare sector shows 35% increase in digital transformation budgets",
        type: "market-trend",
        severity: "medium",
        timestamp: new Date().toISOString(),
        source: "Market Research",
        actionable: false
      },
      {
        id: Date.now() + 2,
        message: "Major competitor exits renewable energy consulting market",
        type: "competitive",
        severity: "critical",
        timestamp: new Date().toISOString(),
        source: "Industry Intelligence",
        actionable: true
      }
    ];
  }

  private getMockAnalysis() {
    return {
      insights: [
        "Technology sector dominates high-value opportunities with 60% of total portfolio value",
        "Healthcare opportunities show highest confidence scores averaging 90%",
        "Critical priority opportunities represent $1.2M in potential revenue"
      ],
      recommendations: [
        "Focus resources on healthcare opportunities due to high confidence and market growth",
        "Develop specialized expertise in AI/ML to capture technology sector opportunities",
        "Consider strategic partnerships to address capacity constraints in high-value deals"
      ],
      marketTrends: [
        "Digital transformation spending increased 23% across all industries",
        "Regulatory compliance requirements driving demand for specialized consulting",
        "Remote work technologies creating new market segments worth $500B globally"
      ]
    };
  }

  private getMockOpportunities(industry: string): OpportunityData[] {
    const baseOpportunities = [
      {
        title: `${industry} Digital Transformation Initiative`,
        value: "$450,000",
        priority: "High",
        confidence: 88,
        description: `Comprehensive digital transformation project for ${industry.toLowerCase()} sector`
      },
      {
        title: `AI-Powered ${industry} Analytics Platform`,
        value: "$320,000",
        priority: "Critical",
        confidence: 92,
        description: `Advanced analytics platform tailored for ${industry.toLowerCase()} industry`
      }
    ];

    return baseOpportunities.map((opp, index) => ({
      id: Date.now() + index,
      title: opp.title,
      industry,
      value: opp.value,
      priority: opp.priority,
      confidence: opp.confidence,
      status: "Active",
      dateAdded: new Date().toISOString(),
      description: opp.description
    }));
  }
}

export const aiService = new AIService();
export type { OpportunityAlert, OpportunityData, SentimentAnalysisResult, TextAnalysisResult };