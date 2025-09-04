"use client";

import React, { useState, useRef } from "react";

// This file is a single-file React component for a simple CRM + Kanban pipeline.
// It uses Tailwind classes and assumes shadcn/ui components are available at the paths below.
// The component is intentionally self-contained so you can copy-paste into a Next.js app.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Types
type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
};

type Deal = {
  id: string;
  title: string;
  contactId?: string;
  value?: number;
  stage: string;
  notes?: string[];
  reminder?: string | null;
  autoProposalSent?: boolean; // demo automation flag
};

const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function CRMModule() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "c1", name: "Ayesha Khan", email: "ayesha@example.com", phone: "0300-1111111", tags: ["hot"] },
    { id: "c2", name: "Bilal Ahmed", email: "bilal@example.com" },
  ]);

  const [deals, setDeals] = useState<Deal[]>([
    { id: "d1", title: "Website Redesign", contactId: "c1", value: 2500, stage: "Lead", notes: ["Intro call done"], reminder: null, autoProposalSent: false },
    { id: "d2", title: "SEO Retainer", contactId: "c2", value: 800, stage: "Qualified", notes: [], reminder: "2025-08-28", autoProposalSent: false },
  ]);

  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);

  // Dialog states
  const [openContact, setOpenContact] = useState(false);
  const [openDeal, setOpenDeal] = useState(false);

  // form states
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", tags: "" });
  const [dealForm, setDealForm] = useState({ title: "", contactId: "", value: "", stage: stages[0], notes: "", autoProposalSent: false });

  // Simple id generator
  const idCounter = useRef(10);
  function nextId(prefix = "id") {
    idCounter.current += 1;
    return `${prefix}${idCounter.current}`;
  }

  // Contact handlers
  function saveContact() {
    if (!contactForm.name.trim()) return alert("Name is required");
    const newContact: Contact = {
      id: nextId("c"),
      name: contactForm.name.trim(),
      email: contactForm.email.trim() || undefined,
      phone: contactForm.phone.trim() || undefined,
      tags: contactForm.tags ? contactForm.tags.split(",").map(t => t.trim()) : undefined,
    };
    setContacts(prev => [newContact, ...prev]);
    setContactForm({ name: "", email: "", phone: "", tags: "" });
    setOpenContact(false);
  }

  // Deal handlers
  function saveDeal() {
    if (!dealForm.title.trim()) return alert("Deal title required");
    const newDeal: Deal = {
      id: nextId("d"),
      title: dealForm.title.trim(),
      contactId: dealForm.contactId || undefined,
      value: dealForm.value ? Number(dealForm.value) : undefined,
      stage: dealForm.stage,
      notes: dealForm.notes ? [dealForm.notes] : [],
      reminder: null,
      autoProposalSent: dealForm.autoProposalSent,
    };
    setDeals(prev => [newDeal, ...prev]);
    setDealForm({ title: "", contactId: "", value: "", stage: stages[0], notes: "", autoProposalSent: false });
    setOpenDeal(false);

    // Demo automation: if autoProposalSent is true, automatically move to 'Proposal' stage
    if (newDeal.autoProposalSent) {
      setTimeout(() => {
        setDeals(prev => prev.map(d => (d.id === newDeal.id ? { ...d, stage: "Proposal" } : d)));
      }, 600); // small delay to simulate background automation
    }
  }

  function addNoteToDeal(dealId: string, note: string) {
    setDeals(prev => prev.map(d => (d.id === dealId ? { ...d, notes: [...(d.notes || []), note] } : d)));
  }

  function changeDealStage(dealId: string, stage: string) {
    setDeals(prev => prev.map(d => (d.id === dealId ? { ...d, stage } : d)));
  }

  function setReminder(dealId: string, date: string) {
    setDeals(prev => prev.map(d => (d.id === dealId ? { ...d, reminder: date } : d)));
  }

  // Simple drag and drop using HTML5 DnD
  function onDragStart(e: React.DragEvent, dealId: string) {
    e.dataTransfer.setData("text/plain", dealId);
  }

  function onDrop(e: React.DragEvent, stage: string) {
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;
    changeDealStage(dealId, stage);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  // Quick analytics: count deals per stage
  const stageCounts = stages.reduce<Record<string, number>>((acc, s) => {
    acc[s] = deals.filter(d => d.stage === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 ">
      <header className="flex items-center justify-between">
        <h1 className="text-lg text-[#7A8055] font-bold">CRM & Deal Pipeline</h1>
        <div className="flex gap-2">
          <Button className="text-sm text-white bg-[#7A8063] hover:bg-[#7A8055]" onClick={() => setOpenContact(true)}>+ Add Contact</Button>
          <Button className="text-sm text-white bg-[#7A8063] hover:bg-[#7A8055]" onClick={() => setOpenDeal(true)}>+ Add Deal</Button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-6 border border-#7A8055">
        <div className="col-span-1 bg-white p-4 rounded-lg  dark:bg-black shadow-smborder border-#7A8055">
          <h2 className="font-medium text-[#7A8055]">Contacts</h2>
          <ul className="mt-3 space-y-2 max-h-64 overflow-auto">
            {contacts.map(c => (
              <li key={c.id} className="border rounded p-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs">{c.email || c.phone}</div>
                    <div className="text-xs mt-1">{(c.tags || []).join(", ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{deals.filter(d => d.contactId === c.id).length} deals</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 bg-white p-4  dark:bg-black  dark:text-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[#7A8055]">Pipeline</h2>
            <div className="text-sm  text-[#7A8055]">Total deals: {deals.length}</div>
          </div>

          <div className="mt-4  overflow-auto">
            <div className="flex gap-4 dark:bg-black min-h-[300px]">
              {stages.map(stage => (
                <div key={stage} className="w-64 bg-gray-50 dark:bg-black rounded p-3 shadow-inner" onDragOver={onDragOver} onDrop={(e) => onDrop(e, stage)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{stage}</div>
                    <div className="text-xs text-gray-500">{stageCounts[stage] || 0}</div>
                  </div>

                  <div className="dark:bg-black space-y-2">
                    {deals.filter(d => d.stage === stage).map(d => (
                      <div key={d.id} draggable onDragStart={(e) => onDragStart(e, d.id)} className="dark:bg-black bg-white p-3 rounded shadow cursor-grab">
                        <div className=" dark:bg-black flex items-start justify-between">
                          <div>
                            <div className=" dark:bg-black font-semibold">{d.title}</div>
                            <div className="text-xs">{contacts.find(c => c.id === d.contactId)?.name || "(no contact)"}</div>
                            <div className="text-xs mt-1">Value: {d.value ? `$${d.value}` : "-"}</div>
                          </div>
                          <div className=" dark:bg-black text-right">
                            <div className="text-xs">{d.reminder ? `Reminder: ${d.reminder}` : ""}</div>
                            <div className="text-xs mt-2 flex flex-col gap-1">
                              <select aria-label="Deal Stage" value={d.stage} onChange={(e) => changeDealStage(d.id, e.target.value)} className="text-sm border rounded px-2 py-1">
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button className="text-lg text-white rounded-lg bg-[#7A8055]" onClick={() => { const note = prompt("Add note:"); if (note) addNoteToDeal(d.id, note); }}>+ Note</button>
                              <button className="text-lg text-white rounded-lg bg-[#7A8055] " onClick={() => { const date = prompt("Set reminder (YYYY-MM-DD):"); if (date) setReminder(d.id, date); }}>+ Reminder</button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-[#7A8055]">
                          {(d.notes || []).slice(-2).map((n, idx) => <div key={idx}>• {n}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white  dark:bg-black p-4 rounded-lg shadow-sm">
        <h2 className="font-medium text-[#7A8055]">Quick Analytics</h2>
        <div className="mt-3 grid grid-cols-6 gap-3">
          {stages.map(s => (
            <div key={s} className="p-3 border rounded">
              <div className="text-xs">{s}</div>
              <div className="font-semibold text-lg">{stageCounts[s] || 0}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Contact Dialog */}
      <Dialog open={openContact} onOpenChange={setOpenContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#7A8063]">Add Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2 text-[#7A8063]">
            <Input placeholder="Name" value={contactForm.name} onChange={(e: any) => setContactForm(prev => ({ ...prev, name: e.target.value }))} />
            <Input placeholder="Email" value={contactForm.email} onChange={(e: any) => setContactForm(prev => ({ ...prev, email: e.target.value }))} />
            <Input placeholder="Phone" value={contactForm.phone} onChange={(e: any) => setContactForm(prev => ({ ...prev, phone: e.target.value }))} />
            <Input placeholder="Tags (comma separated)" value={contactForm.tags} onChange={(e: any) => setContactForm(prev => ({ ...prev, tags: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-white bg-[#7A8063] hover:bg-[#7A8055] hover:text-white"onClick={() => setOpenContact(false)}>Cancel</Button>
            <Button className="text-white bg-[#7A8063] hover:bg-[#7A8055] hover:text-white" onClick={saveContact}>Save Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={openDeal} onOpenChange={setOpenDeal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#7A8063]">Add Deal</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Input placeholder="Deal title" value={dealForm.title} onChange={(e: any) => setDealForm(prev => ({ ...prev, title: e.target.value }))} />
            <select aria-label="Deal Stage" value={dealForm.contactId} onChange={(e) => setDealForm(prev => ({ ...prev, contactId: e.target.value }))} className="w-full border rounded px-2 py-2">
              <option value="">(no contact)</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Value (USD)" value={dealForm.value} onChange={(e: any) => setDealForm(prev => ({ ...prev, value: e.target.value }))} />

            <select aria-label="Deal Stage" value={dealForm.stage} onChange={(e) => setDealForm(prev => ({ ...prev, stage: e.target.value }))} className="w-full border rounded px-2 py-2">
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <Textarea placeholder="Notes" value={dealForm.notes} onChange={(e: any) => setDealForm(prev => ({ ...prev, notes: e.target.value }))} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={dealForm.autoProposalSent} onChange={(e) => setDealForm(prev => ({ ...prev, autoProposalSent: e.target.checked }))} />
              <span className="text-sm">Simulate: proposal already sent (auto-move to Proposal)</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-white bg-[#7A8063] hover:bg-[#7A8055] hover:text-white" onClick={() => setOpenDeal(false)}>Cancel</Button>
            <Button className="text-white bg-[#7A8063] hover:bg-[#7A8055] hover:text-white" onClick={saveDeal}>Save Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
