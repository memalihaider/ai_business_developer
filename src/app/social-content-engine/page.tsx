"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

export default function SocialContentEnginePage() {
  redirect("/social-content-engine/contentIdeas");
}

interface Module {
  id: string;   // will be used in route
  title: string;
  desc: string;
}

export const SocialContentEngine: React.FC = () => {
  const [modules] = useState<Module[]>([
    {
      id: "contentIdeas",
      title: "Content Ideas",
      desc: "AI-generated ideas tailored to your business goals.",
    },
    {
      id: "seoSuggestions",
      title: "SEO Suggestions",
      desc: "Boost rankings with AI-powered SEO insights.",
    },
    {
      id: "analytics",
      title: "Analytics",
      desc: "Track engagement, ROI, and performance in real-time.",
    },
  ]);

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Autofocus search input when activated
  useEffect(() => {
    if (searchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchActive]);

  const handleRefresh = () => window.location.reload();

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3"
      >
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Social Content Engine
        </h1>

        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          {/* Search */}
          {!searchActive ? (
            <Button
              onClick={() => setSearchActive(true)}
              variant="outline"
              className="text-xs flex items-center gap-1 border-gray-300 text-gray-700 px-3 py-1.5 hover:bg-gray-100"
            >
              <Search size={14} /> Search
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="text-xs w-40 sm:w-56 h-8 border-gray-300 focus:border-[#7A8063] focus:ring-[#7A8063]"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSearchActive(false);
                }}
                className="text-xs flex items-center gap-1 border-gray-300 text-gray-700 px-3 py-1.5 hover:bg-gray-100"
              >
                <X size={12} /> Close
              </Button>
            </div>
          )}

          {/* Refresh */}
          <Button
            onClick={handleRefresh}
            className="text-xs flex items-center gap-1 bg-[#7A8063] hover:bg-[#7A8055] text-white px-3 py-1.5"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {filteredModules.length > 0 ? (
          filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-sm hover:shadow-lg transition-shadow rounded-xl border border-gray-200 bg-white h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 mb-1">
                      {module.title}
                    </h2>
                    <p className="text-sm text-gray-600">{module.desc}</p>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Link
                      href={`/social-content-engine/${module.id}`}
                      passHref
                    >
                      <Button className="text-xs flex items-center gap-1 bg-[#7A8063] hover:bg-[#7A8055] text-white px-4 py-2 rounded-lg">
                        Open <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-full text-sm">
            No modules found.
          </p>
        )}
      </div>
    </div>
  );
};
