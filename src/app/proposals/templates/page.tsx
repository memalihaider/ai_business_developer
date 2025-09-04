"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function TemplatesLibrary() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const templates = [
    { id: 1, name: "Business Proposal", type: "Proposal", status: "Popular", content: "Formal business proposal format..." },
    { id: 2, name: "Freelancer Quotation", type: "Quotation", status: "New", content: "Quotation template for freelancers..." },
    { id: 3, name: "Project Invoice", type: "Invoice", status: "Standard", content: "Professional invoice format..." },
    { id: 4, name: "Follow-up Email", type: "Email", status: "Popular", content: "Polite email template for follow-ups..." },
  ];

  // Helper function for filtering
  const getFilteredTemplates = (category: string) => {
    return templates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || t.type === category;
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📑 Templates Library</h1>

      {/* Search Bar */}
      <Input
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-1/2"
      />

      {/* Tabs for Category Filtering */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Proposal">Proposals</TabsTrigger>
          <TabsTrigger value="Quotation">Quotations</TabsTrigger>
          <TabsTrigger value="Invoice">Invoices</TabsTrigger>
          <TabsTrigger value="Email">Emails</TabsTrigger>
        </TabsList>

        {/* Render templates per category */}
        {["all", "Proposal", "Quotation", "Invoice", "Email"].map((category) => (
          <TabsContent
            key={category}
            value={category}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {getFilteredTemplates(category).length === 0 ? (
              <p className="text-gray-500 text-center col-span-2">❌ No templates found</p>
            ) : (
              getFilteredTemplates(category).map((t) => (
                <Card key={t.id} className="rounded-2xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {t.name}
                      <Badge variant="outline">{t.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Category: {t.type}</p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="bg-[#7A8063] hover:bg-[#7A8055] text-white"
                        onClick={() => setSelectedTemplate(t)}
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={() => setSelectedTemplate(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{selectedTemplate?.content}</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button className="bg-[#7A8063] hover:bg-[#7A8055] text-white">
              Use this Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
