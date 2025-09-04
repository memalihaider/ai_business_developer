"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";

export default function ReputationPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!input.trim()) return;
    setLoading(true);
    setAnalysis(null);

    // simulate AI processing
    setTimeout(() => {
      setAnalysis(
        `✅ Reputation Analysis Result:\n\nYour brand has strong credibility in B2B. Clients highlight timely delivery, but note room for improvement in communication. Recommended action: Improve follow-ups and highlight case studies.`
      );
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-white to-gray-100">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#7A8063] mb-6">
        Reputation Management
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Working Area */}
        <Card className="shadow-lg rounded-2xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Analyze Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter brand or business name"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="border-gray-300 focus:ring-2 focus:ring-[#7A8063]"
            />
            <Textarea
              placeholder="Add customer feedback, social posts, or review text..."
              className="border-gray-300 focus:ring-2 focus:ring-[#7A8063]"
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-[#7A8063] hover:bg-[#6b7058] text-white"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                "Run AI Analysis"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Display Area */}
        <Card className="shadow-lg rounded-2xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#7A8063]" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-gray-500 italic">Analyzing reputation...</p>
            )}
            {analysis && (
              <div className="whitespace-pre-line text-gray-700">
                {analysis}
              </div>
            )}
            {!loading && !analysis && (
              <p className="text-gray-400">
                Enter details on the left and run analysis to see results here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      {analysis && (
        <div className="mt-6">
          <Card className="shadow-lg rounded-2xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Was this analysis helpful?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-[#7A8063] text-[#7A8063] hover:bg-[#7A8063] hover:text-white"
              >
                <ThumbsUp className="h-4 w-4" /> Yes
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <ThumbsDown className="h-4 w-4" /> No
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
