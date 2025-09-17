"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  DollarSign,
  Users,
  Clock,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface AnalyticalQuestion {
  id: string;
  category: 'market' | 'financial' | 'competitive' | 'strategic' | 'risk';
  question: string;
  options: string[];
  weight: number;
  explanation: string;
}

interface QuestionResponse {
  questionId: string;
  selectedOption: string;
  score: number;
}

interface AnalysisResult {
  overallScore: number;
  categoryScores: Record<string, number>;
  recommendations: string[];
  riskFactors: string[];
  strengths: string[];
}

interface AnalyticalQuestionsProps {
  opportunity?: {
    id: number;
    title: string;
    industry: string;
    value: string;
    priority: string;
    confidence: number;
  };
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

const analyticalQuestions: AnalyticalQuestion[] = [
  {
    id: 'market-size',
    category: 'market',
    question: 'What is the estimated total addressable market (TAM) for this opportunity?',
    options: ['< $1M', '$1M - $10M', '$10M - $100M', '$100M - $1B', '> $1B'],
    weight: 0.2,
    explanation: 'Larger markets typically offer more growth potential and scalability.'
  },
  {
    id: 'market-growth',
    category: 'market',
    question: 'What is the expected market growth rate over the next 3 years?',
    options: ['Declining', '0-5%', '5-15%', '15-30%', '> 30%'],
    weight: 0.15,
    explanation: 'Growing markets provide better opportunities for sustained success.'
  },
  {
    id: 'competitive-landscape',
    category: 'competitive',
    question: 'How competitive is the market landscape?',
    options: ['Highly saturated', 'Moderately competitive', 'Some competition', 'Limited competition', 'Blue ocean'],
    weight: 0.15,
    explanation: 'Less competitive markets offer better margins and easier market entry.'
  },
  {
    id: 'financial-viability',
    category: 'financial',
    question: 'What is the expected profit margin for this opportunity?',
    options: ['< 10%', '10-20%', '20-35%', '35-50%', '> 50%'],
    weight: 0.2,
    explanation: 'Higher margins indicate better financial viability and sustainability.'
  },
  {
    id: 'implementation-complexity',
    category: 'strategic',
    question: 'How complex is the implementation of this opportunity?',
    options: ['Very complex', 'Complex', 'Moderate', 'Simple', 'Very simple'],
    weight: 0.1,
    explanation: 'Lower complexity reduces execution risk and time to market.'
  },
  {
    id: 'resource-requirements',
    category: 'strategic',
    question: 'What level of resources does this opportunity require?',
    options: ['Very high', 'High', 'Moderate', 'Low', 'Very low'],
    weight: 0.1,
    explanation: 'Lower resource requirements improve ROI and reduce financial risk.'
  },
  {
    id: 'regulatory-risk',
    category: 'risk',
    question: 'What is the regulatory risk associated with this opportunity?',
    options: ['Very high', 'High', 'Moderate', 'Low', 'Very low'],
    weight: 0.1,
    explanation: 'Lower regulatory risk reduces compliance costs and market entry barriers.'
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'market': return <TrendingUp className="h-4 w-4" />;
    case 'financial': return <DollarSign className="h-4 w-4" />;
    case 'competitive': return <Target className="h-4 w-4" />;
    case 'strategic': return <BarChart3 className="h-4 w-4" />;
    case 'risk': return <AlertCircle className="h-4 w-4" />;
    default: return <Brain className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'market': return 'bg-blue-500';
    case 'financial': return 'bg-green-500';
    case 'competitive': return 'bg-purple-500';
    case 'strategic': return 'bg-orange-500';
    case 'risk': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export function AnalyticalQuestions({ opportunity, onAnalysisComplete }: AnalyticalQuestionsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = analyticalQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / analyticalQuestions.length) * 100;

  const handleOptionSelect = (option: string) => {
    const score = analyticalQuestions[currentQuestionIndex].options.indexOf(option) + 1;
    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      selectedOption: option,
      score
    };

    const updatedResponses = [...responses.filter(r => r.questionId !== currentQuestion.id), response];
    setResponses(updatedResponses);

    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestionIndex < analyticalQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        analyzeResponses(updatedResponses);
      }
    }, 500);
  };

  const analyzeResponses = async (finalResponses: QuestionResponse[]) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate scores
    const categoryScores: Record<string, number> = {};
    const categoryWeights: Record<string, number> = {};

    analyticalQuestions.forEach(question => {
      const response = finalResponses.find(r => r.questionId === question.id);
      if (response) {
        const normalizedScore = (response.score / 5) * 100; // Convert to 0-100 scale
        const weightedScore = normalizedScore * question.weight;
        
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = 0;
          categoryWeights[question.category] = 0;
        }
        
        categoryScores[question.category] += weightedScore;
        categoryWeights[question.category] += question.weight;
      }
    });

    // Normalize category scores
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category] = categoryScores[category] / categoryWeights[category];
    });

    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length;

    // Generate recommendations based on scores
    const recommendations = [];
    const riskFactors = [];
    const strengths = [];

    if (categoryScores.market > 70) {
      strengths.push('Strong market opportunity with good growth potential');
    } else if (categoryScores.market < 40) {
      riskFactors.push('Limited market size or declining growth trends');
      recommendations.push('Consider market expansion strategies or pivot to adjacent markets');
    }

    if (categoryScores.financial > 70) {
      strengths.push('Excellent financial viability with strong profit margins');
    } else if (categoryScores.financial < 40) {
      riskFactors.push('Low profit margins may impact sustainability');
      recommendations.push('Focus on cost optimization and value proposition enhancement');
    }

    if (categoryScores.competitive > 70) {
      strengths.push('Favorable competitive position with differentiation opportunities');
    } else if (categoryScores.competitive < 40) {
      riskFactors.push('Highly competitive market with potential margin pressure');
      recommendations.push('Develop unique value propositions and competitive advantages');
    }

    if (categoryScores.strategic < 40) {
      riskFactors.push('High implementation complexity or resource requirements');
      recommendations.push('Consider phased implementation approach and resource planning');
    }

    if (categoryScores.risk < 40) {
      riskFactors.push('Significant regulatory or operational risks identified');
      recommendations.push('Develop comprehensive risk mitigation strategies');
    }

    if (overallScore > 80) {
      recommendations.push('Excellent opportunity - prioritize for immediate action');
    } else if (overallScore > 60) {
      recommendations.push('Good opportunity - proceed with careful planning');
    } else if (overallScore > 40) {
      recommendations.push('Moderate opportunity - requires significant improvements');
    } else {
      recommendations.push('High-risk opportunity - consider alternative options');
    }

    const result: AnalysisResult = {
      overallScore,
      categoryScores,
      recommendations,
      riskFactors,
      strengths
    };

    setAnalysisResult(result);
    setIsAnalyzing(false);
    setShowResults(true);
    onAnalysisComplete?.(result);
  };

  const resetAnalysis = () => {
    setCurrentQuestionIndex(0);
    setResponses([]);
    setAnalysisResult(null);
    setShowResults(false);
  };

  if (showResults && analysisResult) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            Opportunity Analysis Results
          </CardTitle>
          {opportunity && (
            <p className="text-sm text-muted-foreground">
              Analysis for: {opportunity.title}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {Math.round(analysisResult.overallScore)}/100
            </div>
            <Progress value={analysisResult.overallScore} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Overall Opportunity Score
            </p>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysisResult.categoryScores).map(([category, score]) => (
              <Card key={category} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded ${getCategoryColor(category)} text-white`}>
                    {getCategoryIcon(category)}
                  </div>
                  <span className="font-medium capitalize">{category}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{Math.round(score)}</div>
                <Progress value={score} className="h-2" />
              </Card>
            ))}
          </div>

          {/* Strengths */}
          {analysisResult.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h3>
              <ul className="space-y-1">
                {analysisResult.strengths.map((strength, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {analysisResult.riskFactors.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Risk Factors
              </h3>
              <ul className="space-y-1">
                {analysisResult.riskFactors.map((risk, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </h3>
            <ul className="space-y-1">
              {analysisResult.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <Button onClick={resetAnalysis} variant="outline">
              Analyze Another Opportunity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Opportunity...</h3>
          <p className="text-muted-foreground mb-4">
            Processing your responses and generating insights
          </p>
          <Progress value={66} className="w-full max-w-md mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Opportunity Analysis
          </CardTitle>
          <Badge variant="outline">
            {currentQuestionIndex + 1} of {analyticalQuestions.length}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {opportunity && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium">{opportunity.title}</h3>
            <p className="text-sm text-muted-foreground">
              {opportunity.industry} • {opportunity.value} • {opportunity.priority} Priority
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded ${getCategoryColor(currentQuestion.category)} text-white`}>
              {getCategoryIcon(currentQuestion.category)}
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentQuestion.category}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = responses.find(r => r.questionId === currentQuestion.id)?.selectedOption === option;
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </Button>
              );
            })}
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-700">
              <strong>Why this matters:</strong> {currentQuestion.explanation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}