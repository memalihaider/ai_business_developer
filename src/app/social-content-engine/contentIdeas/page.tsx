"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, X, Copy, Sparkles, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ContentIdeasPage() {
  const [ideas, setIdeas] = useState<string[]>([
    "10 Tips for Boosting Engagement on Instagram",
    "Creative Ways to Reuse Old Content",
    "How to Build a 30-Day Content Calendar",
    "Trendy Hashtags to Use This Month",
  ]);

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Controlled confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const primaryColor = "#7A8063";
  const hoverColor = "#7A8055";

  const handleRefresh = () => {
    setIdeas([
      "AI-Powered Marketing Strategies for 2025",
      "5 Must-Know Trends in Social Media",
      "Engaging Video Ideas for TikTok",
      "Repurposing Blogs into Instagram Carousels",
    ]);
  };

  const handleCopy = (idea: string, index: number) => {
    navigator.clipboard.writeText(idea);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleGenerateIdea = () => {
    const newIdeas = [
      "How AI is Revolutionizing Content Creation",
      "Top 10 Social Media Trends to Watch",
      "Creative Instagram Reels Ideas for Businesses",
      "How to Turn Followers into Customers",
      "Content Strategies That Actually Work in 2025",
      "Building Brand Trust Through Authentic Stories",
      "The Rise of Short-Form Video Marketing",
      "AI Tools Every Marketer Should Know",
    ];
    const randomIdea = newIdeas[Math.floor(Math.random() * newIdeas.length)];
    setIdeas((prev) => [randomIdea, ...prev]);
  };

  // Open confirm for a specific index
  const openConfirm = (idx: number) => {
    setPendingIndex(idx);
    setConfirmOpen(true);
  };

  // If dialog closes by clicking outside/Escape, reset pending index
  const onDialogChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) setPendingIndex(null);
  };

  const confirmDelete = () => {
    if (pendingIndex !== null) {
      setIdeas((prev) => prev.filter((_, i) => i !== pendingIndex));
    }
    setPendingIndex(null);
    setConfirmOpen(false);
  };

  const cancelDelete = () => {
    setPendingIndex(null);
    setConfirmOpen(false);
  };

  const filteredIdeas = ideas.filter((idea) =>
    idea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
      >
        <h1 className="text-sm font-semibold text-gray-800">  Content Ideas</h1>

        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          {/* Search */}
          {!searchActive ? (
            <Button
              onClick={() => setSearchActive(true)}
              variant="outline"
              className="text-xs flex items-center gap-1 border text-gray-700 hover:text-white"
              style={{ borderColor: primaryColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "";
              }}
            >
              <Search size={14} /> Search
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas..."
                className="text-xs w-40 sm:w-60"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSearchActive(false);
                }}
                className="text-xs flex items-center gap-1 text-white"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = hoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = primaryColor)
                }
              >
                <X size={12} /> Close
              </Button>
            </div>
          )}

          {/* Generate Idea */}
          <Button
            onClick={handleGenerateIdea}
            className="text-xs flex items-center gap-1 text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = hoverColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = primaryColor)
            }
          >
            <Sparkles size={14} /> Generate
          </Button>

          {/* Refresh */}
          <Button
            onClick={handleRefresh}
            className="text-xs flex items-center gap-1 text-white"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = hoverColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = primaryColor)
            }
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* List */}
      <div className="max-w-3xl mx-auto">
        {filteredIdeas.length > 0 ? (
          <ul className="space-y-3">
            {filteredIdeas.map((idea, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-sm hover:shadow-md transition rounded-lg border border-gray-200">
                  <CardContent className="p-3 flex justify-between items-center">
                    <p className="text-xs text-gray-700">{idea}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopy(idea, index)}
                        className="text-xs flex items-center gap-1 text-white px-2 py-1"
                        style={{ backgroundColor: primaryColor }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = hoverColor)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = primaryColor)
                        }
                      >
                        {copiedIndex === index ? "Copied!" : "Copy"}
                        <Copy size={12} />
                      </Button>

                      <Button
                        onClick={() => openConfirm(index)}
                        className="text-xs flex items-center gap-1 px-2 py-1 text-white"
                        style={{ backgroundColor: primaryColor }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = hoverColor)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = primaryColor)
                        }
                      >
                        <Trash2 size={12} /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm text-center">No ideas found.</p>
        )}
      </div>

      {/* Single controlled Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={onDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this idea? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-xs"
              style={{ borderColor: primaryColor, color: primaryColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = primaryColor;
              }}
              onClick={cancelDelete}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="text-xs text-white"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = hoverColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = primaryColor)
              }
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
