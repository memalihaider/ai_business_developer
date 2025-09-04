"use client";

import { useState } from "react";

type SequenceStep = { name: string; delay: number; aiGenerated?: boolean };
type Sequence = {
  id: number;
  name: string;
  steps: SequenceStep[];
  active: boolean;
};

export default function AutomatedSequences() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", steps: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAddOrEdit = () => {
    if (!formData.name || !formData.steps) {
      setMessage({ type: "error", text: "Please fill all fields." });
      return;
    }

    const stepsArray = formData.steps.split(",").map((s) => ({ name: s.trim(), delay: 1 }));

    if (editingId !== null) {
      setSequences((prev) =>
        prev.map((seq) =>
          seq.id === editingId ? { ...seq, name: formData.name, steps: stepsArray } : seq
        )
      );
      setMessage({ type: "success", text: "Sequence updated successfully!" });
    } else {
      const newSeq: Sequence = {
        id: Date.now(),
        name: formData.name,
        steps: stepsArray,
        active: true,
      };
      setSequences((prev) => [...prev, newSeq]);
      setMessage({ type: "success", text: "Sequence created successfully!" });
    }

    setFormData({ name: "", steps: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setSequences((prev) => prev.filter((seq) => seq.id !== id));
    setMessage({ type: "info", text: "Sequence deleted." });
  };

  const handleEdit = (seq: Sequence) => {
    setFormData({ name: seq.name, steps: seq.steps.map((s) => s.name).join(", ") });
    setEditingId(seq.id);
    setShowForm(true);
  };

  const toggleActive = (id: number) => {
    setSequences((prev) =>
      prev.map((seq) => (seq.id === id ? { ...seq, active: !seq.active } : seq))
    );
    setMessage({ type: "info", text: "Sequence status updated!" });
  };

  // ✨ Simulate AI generating follow-up steps
 const [backendConnected, setBackendConnected] = useState(false); // toggle to true when backend ready
const generateAIStep = (seqId: number) => {
  if (!backendConnected) {
    setMessage({ type: "error", text: "❌ AI generation failed: backend not connected." });
    return;
  }

  setLoadingAI(true);
  setMessage({ type: "info", text: "AI is generating a follow-up step..." });

  setTimeout(() => {
    setSequences((prev) =>
      prev.map((seq) =>
        seq.id === seqId
          ? {
              ...seq,
              steps: [
                ...seq.steps,
                { name: `AI-generated follow-up for "${seq.name}"`, delay: 2, aiGenerated: true },
              ],
            }
          : seq
      )
    );
    setLoadingAI(false);
    setMessage({ type: "success", text: "✨ AI generated a follow-up step (demo only)." });
  }, 1200);
};


  return (
    <div className="min-h-screen p-6 bg-white text-black">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">🔁 Automated Sequences (AI Demo)</h1>
      </header>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-2 mb-4 rounded text-sm ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-5 mb-6 rounded-xl shadow-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">
            {editingId !== null ? "Edit Sequence" : "New Sequence"}
          </h2>
          <div className="mb-3">
            <label className="block text-sm mb-1">Sequence Name *</label>
            <input
              className="w-full p-2 rounded border text-sm bg-white text-black"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">Steps (comma separated) *</label>
            <input
              className="w-full p-2 rounded border text-sm bg-white text-black"
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddOrEdit}
              className="px-4 py-1.5 rounded bg-[#7A8063] text-white text-sm hover:bg-[#7A8055] transition"
            >
              {editingId !== null ? "Update" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ name: "", steps: "" });
                setEditingId(null);
              }}
              className="px-4 py-1.5 rounded bg-gray-400 text-white text-sm hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-1.5 text-sm rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
          >
            + Add Sequence
          </button>
        </div>
      )}

      {/* Sequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sequences.map((seq) => (
          <div key={seq.id} className="p-5 rounded-xl shadow-md bg-gray-50 text-sm transition">
            <h2 className="font-semibold text-base mb-1">{seq.name}</h2>
            <p className="mb-1">Steps: {seq.steps.length}</p>
            <p className="mb-3">
              Status:{" "}
              <span className={seq.active ? "text-green-600" : "text-red-600"}>
                {seq.active ? "Active" : "Inactive"}
              </span>
            </p>
            <div className="flex flex-col gap-2 mb-2">
              {seq.steps.map((step, idx) => (
                <div key={idx} className="p-2 rounded border bg-white flex justify-between items-center">
                  <span>
                    {step.name} {step.aiGenerated && "(AI)"}
                  </span>
                  <span className="text-xs text-gray-500">{step.delay} day(s)</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleEdit(seq)}
                className="px-3 py-1 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(seq.id)}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => toggleActive(seq.id)}
                className={`px-3 py-1 rounded text-white transition ${
                  seq.active ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {seq.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => generateAIStep(seq.id)}
                disabled={loadingAI}
                className="px-3 py-1 rounded bg-[#7A8063] text-white hover:bg-[#7A8055] transition"
              >
                {loadingAI ? "Generating..." : "AI Generate Step"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
