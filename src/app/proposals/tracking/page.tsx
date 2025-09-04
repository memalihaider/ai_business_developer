"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";

type Proposal = {
  id: string;
  client: string;
  title: string;
  date: string;
  status: "Accepted" | "Rejected" | "Pending";
  value?: number;
};

const proposals: Proposal[] = [
  { id: "P-001", client: "Qudsia", title: "Website Redesign", date: "Aug 10, 2025", status: "Accepted", value: 1500 },
  { id: "P-002", client: "Ali",    title: "Logo Design",       date: "Aug 12, 2025", status: "Rejected", value: 900 },
  { id: "P-003", client: "Sara",   title: "Marketing Campaign", date: "Aug 15, 2025", status: "Pending",  value: 1200 },
];

function BadgeForStatus({ status }: { status: Proposal["status"] }) {
  if (status === "Accepted") {
    return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{status}</Badge>;
  }
  if (status === "Rejected") {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>; // Pending
}

export default function ProposalTrackingPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Proposal["status"] | "all">("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const total = proposals.length;
  const accepted = proposals.filter((p) => p.status === "Accepted").length;
  const rejected = proposals.filter((p) => p.status === "Rejected").length;
  const pending  = proposals.filter((p) => p.status === "Pending").length;
  const conversion = total ? Math.round((accepted / total) * 100) : 0;
  const totalValue = proposals.reduce((sum, p) => sum + (p.value ?? 0), 0);

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Proposal Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    proposals.forEach((p, idx) => {
      doc.text(
        `${p.id} | ${p.client} | ${p.title} | ${p.date} | ${p.status} | $${p.value ?? "N/A"}`,
        14,
        40 + idx * 10
      );
    });

    doc.text(`\nSummary:`, 14, 50 + proposals.length * 10);
    doc.text(`Total Proposals: ${total}`, 14, 60 + proposals.length * 10);
    doc.text(`Accepted: ${accepted}`, 14, 70 + proposals.length * 10);
    doc.text(`Rejected: ${rejected}`, 14, 80 + proposals.length * 10);
    doc.text(`Pending: ${pending}`, 14, 90 + proposals.length * 10);
    doc.text(`Conversion Rate: ${conversion}%`, 14, 100 + proposals.length * 10);
    doc.text(`Total Value Sent: $${totalValue.toLocaleString()}`, 14, 110 + proposals.length * 10);

    doc.save("proposal-report.pdf");
  };

  return (
    <div className="min-h-screen bg-[#F9FAF9] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Proposal Tracking & Analytics</h1>
            <p className="text-sm text-gray-500">Monitor proposal status and analyze performance</p>
          </div>
          <Button className="rounded-xl text-white" style={{ backgroundColor: "#7A8063" }} onClick={downloadReport}>
            Download Report
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Input
            placeholder="Search proposals by ID, client, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2"
          />
          <Select onValueChange={(val) => setFilter(val as Proposal["status"] | "all")} defaultValue="all">
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-[#7A8063] text-white">
                  <tr>
                    <th className="p-3 text-left font-medium">Proposal ID</th>
                    <th className="p-3 text-left font-medium">Client</th>
                    <th className="p-3 text-left font-medium">Title</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredProposals.length > 0 ? (
                    filteredProposals.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{p.id}</td>
                        <td className="p-3">{p.client}</td>
                        <td className="p-3">{p.title}</td>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3">
                          <BadgeForStatus status={p.status} />
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            className="rounded-xl px-4 text-white"
                            style={{ backgroundColor: "#7A8063" }}
                            onClick={() => setSelectedProposal(p)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No proposals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-4 bg-gray-100 rounded-xl">
                <div className="text-xl font-semibold text-gray-800">{total}</div>
                <div className="text-xs text-gray-600">Total Proposals</div>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <div className="text-xl font-semibold text-green-700">{accepted}</div>
                <div className="text-xs text-green-700">Accepted</div>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <div className="text-xl font-semibold text-red-700">{rejected}</div>
                <div className="text-xs text-red-700">Rejected</div>
              </div>
              <div className="p-4 bg-yellow-100 rounded-xl">
                <div className="text-xl font-semibold text-yellow-700">{pending}</div>
                <div className="text-xs text-yellow-700">Pending</div>
              </div>
              <div className="p-4 bg-[#E6E8DF] rounded-xl">
                <div className="text-xl font-semibold text-[#2C2F25]">{conversion}%</div>
                <div className="text-xs text-[#2C2F25]">Conversion</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <span className="font-medium text-gray-800">Total Value Sent:</span> ${totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal for proposal details */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-medium">ID:</span> {selectedProposal.id}</p>
              <p><span className="font-medium">Client:</span> {selectedProposal.client}</p>
              <p><span className="font-medium">Title:</span> {selectedProposal.title}</p>
              <p><span className="font-medium">Date:</span> {selectedProposal.date}</p>
              <p><span className="font-medium">Status:</span> {selectedProposal.status}</p>
              <p><span className="font-medium">Value:</span> ${selectedProposal.value ?? "N/A"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
