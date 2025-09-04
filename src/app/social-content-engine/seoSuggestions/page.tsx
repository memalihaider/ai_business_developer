"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ----------------------
// SEO Input
// ----------------------
interface SEOInputProps {
  onAnalyze: (text: string) => void;
}

function SEOInput({ onAnalyze }: SEOInputProps) {
  const [input, setInput] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAnalyze(input);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-3 mb-6"
    >
      <Input
        type="text"
        placeholder="Enter your content, topic, or idea..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 rounded-xl border-gray-300"
      />
      <Button
        type="submit"
        className="bg-[#7A8063] hover:bg-[#7A8055] text-white px-6 rounded-xl shadow-md"
      >
        Analyze
      </Button>
    </form>
  );
}

// ----------------------
// Keyword Suggestions
// ----------------------
interface KeywordSuggestionsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
}

function KeywordSuggestions({ keywords, onSelect }: KeywordSuggestionsProps) {
  if (keywords.length === 0) return null;
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          🔑 Keyword Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => onSelect(keyword)}
              className="px-3 py-1 rounded-full text-sm border-gray-300 hover:bg-[#7A8063] hover:text-white transition-colors"
            >
              {keyword}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Hashtag Suggestions
// ----------------------
interface HashtagSuggestionsProps {
  hashtags: string[];
  onSelect: (hashtag: string) => void;
}

function HashtagSuggestions({ hashtags, onSelect }: HashtagSuggestionsProps) {
  if (hashtags.length === 0) return null;
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          #️⃣ Hashtag Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => onSelect(tag)}
              className="px-3 py-1 rounded-full text-sm border-gray-300 hover:bg-[#7A8055] hover:text-white transition-colors"
            >
              #{tag}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// SEO Keywords (Selected)
// ----------------------
interface SEOKeywordsProps {
  selected: string[];
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

function SEOKeywords({ selected, onRemove, onClearAll }: SEOKeywordsProps) {
  if (selected.length === 0) return null;
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">
          📌 Selected SEO Keywords
        </CardTitle>
        <Button
          variant="ghost"
          onClick={onClearAll}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {selected.map((keyword, index) => (
            <span
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-[#7A8063] text-white rounded-full text-sm shadow-sm"
            >
              {keyword}
              <button
                onClick={() => onRemove(keyword)}
                className="ml-1 text-xs text-white hover:text-gray-200"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Main SEOSuggestions Module
// ----------------------
export default function SEOSuggestions() {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);

  const analyzeContent = (text: string) => {
    // Mock suggestions (replace with real API later)
    const mockKeywords = ["marketing", "growth", "strategy", "brand"];
    const mockHashtags = ["socialmedia", "seo", "content", "digital"];
    setKeywords(mockKeywords);
    setHashtags(mockHashtags);
  };

  const selectKeyword = (keyword: string) => {
    if (!selected.includes(keyword)) {
      setSelected((prev) => [...prev, keyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setSelected((prev) => prev.filter((k) => k !== keyword));
  };

  const clearAll = () => {
    setSelected([]);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
         SEO Suggestions
      </h2>
      <SEOInput onAnalyze={analyzeContent} />

      <div className="grid gap-6 md:grid-cols-2">
        <KeywordSuggestions keywords={keywords} onSelect={selectKeyword} />
        <HashtagSuggestions hashtags={hashtags} onSelect={selectKeyword} />
      </div>

      <div className="mt-6">
        <SEOKeywords
          selected={selected}
          onRemove={removeKeyword}
          onClearAll={clearAll}
        />
      </div>
    </div>
  );
}
