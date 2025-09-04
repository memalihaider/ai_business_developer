"use client";

import { useState } from "react";

type FollowUp = {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  date: string;
  time: string;
  status: "Pending" | "Sent";
};

export default function FollowUpScheduler() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    recipient: "",
    subject: "",
    body: "",
    date: "",
    time: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAddOrEdit = () => {
    if (!formData.recipient || !formData.subject || !formData.body || !formData.date || !formData.time) {
      setMessage("⚠️ Please fill all fields.");
      return;
    }

    if (editingId !== null) {
      setFollowUps((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...formData } : f))
      );
      setMessage("✅ Follow-up updated successfully!");
    } else {
      const newFollowUp: FollowUp = { id: Date.now(), status: "Pending", ...formData };
      setFollowUps((prev) => [...prev, newFollowUp]);
      setMessage("✅ Follow-up scheduled successfully!");
    }

    setFormData({ recipient: "", subject: "", body: "", date: "", time: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
    setMessage("🗑️ Follow-up deleted successfully!");
  };

  const handleEdit = (f: FollowUp) => {
    setFormData({ ...f });
    setEditingId(f.id);
    setShowForm(true);
  };

  const markAsSent = (id: number) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "Sent" } : f))
    );
    setMessage("📨 Follow-up marked as sent!");
  };

  // 🧠 AI Suggestion for scheduling
  const handleAISchedule = async () => {
    setLoadingAI(true);
    setMessage("");

    try {
      // 👉 Replace this with real AI backend later
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const today = new Date();
      today.setDate(today.getDate() + Math.floor(Math.random() * 5) + 1);
      const suggestedDate = today.toISOString().split("T")[0];
      const suggestedTime = "10:00";

      setFormData((prev) => ({
        ...prev,
        date: suggestedDate,
        time: suggestedTime,
      }));

      setMessage("🤖 AI suggested a schedule for you!");
    } catch {
      setMessage("❌ AI scheduling failed. Try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white text-black">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">⏰ AI-Powered Follow-up Scheduler</h1>
      </header>

      {/* Message Banner */}
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-yellow-100 text-yellow-800 shadow-sm">
          {message}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-5 mb-6 rounded-xl shadow-md bg-white text-sm border">
          <h2 className="text-base font-semibold mb-4">
            {editingId !== null ? "Edit Follow-up" : "Schedule Follow-up"}
          </h2>
          <div className="mb-3">
            <label className="block mb-1 text-xs font-medium">Recipient *</label>
            <input
              className="w-full p-2 rounded border text-sm"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-xs font-medium">Subject *</label>
            <input
              className="w-full p-2 rounded border text-sm"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-xs font-medium">Body *</label>
            <textarea
              className="w-full p-2 rounded border text-sm"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
          </div>
          <div className="mb-4 flex gap-4 items-end">
            <div>
              <label className="block mb-1 text-xs font-medium">Date *</label>
              <input
                type="date"
                className="p-2 rounded border text-sm"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium">Time *</label>
              <input
                type="time"
                className="p-2 rounded border text-sm"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <button
              onClick={handleAISchedule}
              disabled={loadingAI}
              className="px-3 py-2 rounded-md bg-[#7A8063] text-white text-xs hover:bg-[#6A704F] transition flex items-center gap-2"
            >
              {loadingAI && (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loadingAI ? "AI Scheduling..." : "AI Suggest"}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddOrEdit}
              className="px-3 py-1.5 rounded-md bg-[#7A8063] text-white text-sm hover:bg-[#6A704F] transition"
            >
              {editingId !== null ? "Update" : "Schedule"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ recipient: "", subject: "", body: "", date: "", time: "" });
                setEditingId(null);
              }}
              className="px-3 py-1.5 rounded-md bg-gray-400 text-white text-sm hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add New Follow-up Button */}
      {!showForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-md bg-[#7A8063] text-white text-sm hover:bg-[#6A704F] transition"
          >
            + Schedule Follow-up
          </button>
        </div>
      )}

      {/* Follow-ups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {followUps.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-xl shadow-md bg-white text-sm border"
          >
            <h2 className="text-base font-semibold mb-2">{f.subject}</h2>
            <p className="mb-1"><span className="font-medium">Recipient:</span> {f.recipient}</p>
            <p className="mb-1"><span className="font-medium">Scheduled:</span> {f.date} {f.time}</p>
            <p className="mb-3"><span className="font-medium">Status:</span> {f.status}</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleEdit(f)}
                className="px-3 py-1 rounded-md bg-[#7A8063] text-white text-sm hover:bg-[#6A704F] transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(f.id)}
                className="px-3 py-1 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 transition"
              >
                Delete
              </button>
              {f.status === "Pending" && (
                <button
                  onClick={() => markAsSent(f.id)}
                  className="px-3 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition"
                >
                  Mark as Sent
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
