"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Upload, Download, Columns, Users, Lightbulb } from "lucide-react";

// Helper to load/save from localStorage
const storageKey = "ai_leads_module";
const loadLeads = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};
const saveLeads = (data: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
};

export default function LeadsModule() {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [view, setView] = useState<"table" | "pipeline">("table");

  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  const addLead = () => {
    const newLead = {
      id: Date.now(),
      name: "",
      email: "",
      phone: "",
      company: "",
      value: "",
      status: "New",
      owner: "",
      priority: "Medium",
      tags: [],
      notes: "",
      activities: [],
    };
    const updated = [newLead, ...leads];
    setLeads(updated);
    saveLeads(updated);
    setSelected(newLead);
  };

  const updateLead = (field: string, value: any) => {
    if (!selected) return;
    const updatedLeads = leads.map((l) =>
      l.id === selected.id ? { ...l, [field]: value } : l
    );
    setLeads(updatedLeads);
    saveLeads(updatedLeads);
    setSelected({ ...selected, [field]: value });
  };

  const deleteLead = (id: number) => {
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);
    saveLeads(updated);
    if (selected?.id === id) setSelected(null);
  };

  const filteredLeads = leads.filter((l) =>
    [l.name, l.email, l.company, l.owner].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // CSV Export
  const exportCSV = () => {
    const csv = [
      ["Name", "Email", "Phone", "Company", "Value", "Status", "Owner"].join(","),
      ...leads.map((l) =>
        [l.name, l.email, l.phone, l.company, l.value, l.status, l.owner].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // CSV Import
  const importCSV = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const text = event.target.result;
      const rows = text.split("\n").slice(1);
      const imported = rows.map((r: string) => {
        const [name, email, phone, company, value, status, owner] = r.split(",");
        return {
          id: Date.now() + Math.random(),
          name,
          email,
          phone,
          company,
          value,
          status: status || "New",
          owner,
          notes: "",
          activities: [],
          priority: "Medium",
          tags: [],
        };
      });
      const merged = [...imported, ...leads];
      setLeads(merged);
      saveLeads(merged);
    };
    reader.readAsText(file);
  };

  // Keyboard shortcuts
  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("searchBox")?.focus();
      }
      if (e.key.toLowerCase() === "n") {
        addLead();
      }
      if (e.key.toLowerCase() === "k") {
        setView((v) => (v === "table" ? "pipeline" : "table"));
      }
    },
    [addLead]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [handleKeys]);

  return (
    <div className="flex h-screen bg-gray-50" style={{ fontFamily: "sans-serif" }}>
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-3 flex items-center gap-2 bg-[#7A8063] text-white">
          <Search className="w-4 h-4" />
          <input
            id="searchBox"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="flex-1 p-1 bg-transparent outline-none placeholder-white"
          />
        </div>

        <div className="flex justify-between p-2">
          <button
            onClick={addLead}
            className="flex items-center gap-1 text-sm px-3 py-1 bg-[#7A8063] text-white rounded hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>

          <div className="flex gap-2">
            <label className="cursor-pointer flex items-center gap-1 text-sm bg-gray-200 px-2 rounded">
              <Upload className="w-4 h-4" />
              <input type="file" hidden onChange={importCSV} />
            </label>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 text-sm bg-gray-200 px-2 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((l) => (
            <div
              key={l.id}
              onClick={() => setSelected(l)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                selected?.id === l.id ? "bg-[#F4F4EE]" : ""
              }`}
            >
              <div className="font-semibold">{l.name || "Untitled Lead"}</div>
              <div className="text-xs text-gray-600">{l.company}</div>
              <div className="text-xs text-gray-500">{l.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selected ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {selected.name || "Untitled Lead"}
              </h2>
              <button
                onClick={() => deleteLead(selected.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Name"
                value={selected.name}
                onChange={(e) => updateLead("name", e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Email"
                value={selected.email}
                onChange={(e) => updateLead("email", e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Phone"
                value={selected.phone}
                onChange={(e) => updateLead("phone", e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Company"
                value={selected.company}
                onChange={(e) => updateLead("company", e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Deal Value"
                value={selected.value}
                onChange={(e) => updateLead("value", e.target.value)}
                className="border p-2 rounded"
              />
              <select
                value={selected.status}
                onChange={(e) => updateLead("status", e.target.value)}
                className="border p-2 rounded"
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Proposal</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>

            <textarea
              placeholder="Notes"
              value={selected.notes}
              onChange={(e) => updateLead("notes", e.target.value)}
              className="w-full border p-2 rounded h-32"
            />

            <div className="bg-[#F4F4EE] p-3 rounded">
              <div className="flex items-center gap-2 text-[#7A8063] font-semibold">
                <Lightbulb className="w-4 h-4" /> Smart Suggestions
              </div>
              <p className="text-sm mt-1">
                Draft outreach messages or ideas here...
              </p>
              <textarea className="w-full border mt-2 p-2 rounded h-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select or add a lead to view details
          </div>
        )}
      </div>
    </div>
  );
}
