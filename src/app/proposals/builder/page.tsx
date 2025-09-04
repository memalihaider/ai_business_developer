"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ProposalBuilderPage() {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [proposalType, setProposalType] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success" | "";
  }>({
    text: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState("");

  // Handle Submit → Calls backend AI API
  const handleSubmit = async () => {
    if (
      !title ||
      !clientName ||
      !description ||
      !timeline ||
      !budget ||
      !proposalType
    ) {
      setMessage({
        text: "⚠️ Please fill all fields before submitting.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    setGeneratedProposal("");

    try {
      const res = await fetch("/api/generateProposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientName,
          description,
          timeline,
          budget,
          proposalType,
        }),
      });

      const data = await res.json();
      setGeneratedProposal(
        data.proposal || "⚠️ No proposal text returned from AI."
      );
      setMessage({ text: "✅ Proposal generated successfully!", type: "success" });
    } catch (error) {
      setMessage({ text: "❌ Failed to generate proposal.", type: "error" });
    }
    setLoading(false);
  };

  // Handle Save as Draft
  const handleSaveDraft = () => {
    setMessage({ text: "💾 Proposal saved as draft!", type: "success" });
  };

  // Handle Clear Form
  const handleClear = () => {
    setTitle("");
    setClientName("");
    setDescription("");
    setTimeline("");
    setBudget("");
    setProposalType("");
    setMessage({ text: "", type: "" });
    setGeneratedProposal("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAF9] p-8">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Proposal Builder
        </h1>

        <div className="space-y-4">
          {/* Proposal Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Proposal Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              className="mt-1"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Client Name
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              className="mt-1"
            />
          </div>

          {/* Proposal Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Proposal Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details..."
              rows={5}
              className="mt-1"
            />
          </div>

          {/* Project Timeline */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Project Timeline
            </label>
            <Input
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g., 2 months"
              className="mt-1"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Budget
            </label>
            <Input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., $2000 - $5000"
              className="mt-1"
            />
          </div>

          {/* Proposal Type */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Proposal Type
            </label>
            <Select onValueChange={(val) => setProposalType(val)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service Proposal</SelectItem>
                <SelectItem value="quotation">Quotation</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            onClick={handleSaveDraft}
            variant="secondary"
            className="rounded-xl px-5"
          >
            Save Draft
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="rounded-xl px-5"
          >
            Clear
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl px-6 bg-[#7A8063] hover:bg-[#7A8055] text-white"
          >
            {loading ? "Generating..." : "Submit"}
          </Button>
        </div>

        {/* Message Display */}
        {message.text && (
          <p
            className={`mt-4 text-sm font-medium ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Loading State or Generated Proposal Preview */}
        <div className="mt-8">
          {loading ? (
            <div className="p-6 bg-gray-50 border rounded-xl flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#7A8063]" />
              <span className="text-gray-700">
                Generating proposal... please wait
              </span>
            </div>
          ) : (
            generatedProposal && (
              <div className="p-6 bg-gray-50 border rounded-xl">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">
                  Generated Proposal
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {generatedProposal}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
