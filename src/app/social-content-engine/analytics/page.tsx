"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ----------------------
// Insights Card
// ----------------------
interface InsightsCardProps {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
}

function InsightsCard({ title, value, change, positive = true }: InsightsCardProps) {
  return (
    <Card className="rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-base font-bold text-[#7A8063]">{value}</p>
        <p
          className={`text-[10px] mt-1 ${
            positive ? "text-green-600" : "text-red-600"
          }`}
        >
          {positive ? "▲" : "▼"} {change}
        </p>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Mock Data Variants
// ----------------------
const performanceDataWeek = [
  { name: "Mon", impressions: 400, clicks: 240 },
  { name: "Tue", impressions: 300, clicks: 139 },
  { name: "Wed", impressions: 500, clicks: 280 },
  { name: "Thu", impressions: 478, clicks: 190 },
  { name: "Fri", impressions: 589, clicks: 200 },
  { name: "Sat", impressions: 439, clicks: 150 },
  { name: "Sun", impressions: 649, clicks: 300 },
];

const performanceDataMonth = [
  { name: "Week 1", impressions: 2000, clicks: 1000 },
  { name: "Week 2", impressions: 2500, clicks: 1200 },
  { name: "Week 3", impressions: 2700, clicks: 1400 },
  { name: "Week 4", impressions: 3000, clicks: 1600 },
];

const performanceDataYear = [
  { name: "Jan", impressions: 10000, clicks: 4500 },
  { name: "Feb", impressions: 12000, clicks: 5000 },
  { name: "Mar", impressions: 13000, clicks: 5200 },
  { name: "Apr", impressions: 15000, clicks: 6000 },
  { name: "May", impressions: 16000, clicks: 7000 },
  { name: "Jun", impressions: 14000, clicks: 5800 },
];

const postsDataMonth = [
  { month: "Jan", published: 30, drafts: 12 },
  { month: "Feb", published: 25, drafts: 18 },
  { month: "Mar", published: 40, drafts: 15 },
  { month: "Apr", published: 35, drafts: 20 },
  { month: "May", published: 50, drafts: 22 },
  { month: "Jun", published: 45, drafts: 17 },
];

// ----------------------
// Combined Chart Card
// ----------------------
function CombinedChart({
  filter,
}: {
  filter: "This Week" | "This Month" | "This Year";
}) {
  const [view, setView] = React.useState<"performance" | "posts">("performance");

  // Pick performance dataset based on filter
  const performanceData =
    filter === "This Week"
      ? performanceDataWeek
      : filter === "This Month"
      ? performanceDataMonth
      : performanceDataYear;

  return (
    <Card className="rounded-lg shadow-sm border border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm font-semibold text-gray-800">
          {view === "performance" ? "📊 Post Performance" : "📝 Published vs Drafts"}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "performance" ? "default" : "outline"}
            className={`text-[10px] px-3 py-1 rounded-md ${
              view === "performance"
                ? "bg-[#7A8063] text-white hover:bg-[#7A8055]"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setView("performance")}
          >
            Performance
          </Button>
          <Button
            size="sm"
            variant={view === "posts" ? "default" : "outline"}
            className={`text-[10px] px-3 py-1 rounded-md ${
              view === "posts"
                ? "bg-[#7A8063] text-white hover:bg-[#7A8055]"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setView("posts")}
          >
            Posts
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {view === "performance" ? (
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="impressions" stroke="#7A8063" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#7A8055" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={postsDataMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ fontSize: "10px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="published" fill="#7A8063" radius={[3, 3, 0, 0]} />
                <Bar dataKey="drafts" fill="#7A8055" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Export Utilities
// ----------------------
function exportToCSV() {
  const rows = [
    ["Metric", "Value"],
    ["Total Impressions", "12.5K"],
    ["Engagement Rate", "4.2%"],
    ["Followers Gained", "1.1K"],
  ];
  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((e) => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "analytics.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportToPDF() {
  const input = document.getElementById("analytics-dashboard");
  if (!input) return;

  const canvas = await html2canvas(input, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save("analytics.pdf");
}

// ----------------------
// Main Analytics Dashboard
// ----------------------
export default function Analytics() {
  const [filter, setFilter] = React.useState<"This Week" | "This Month" | "This Year">("This Week");

  return (
    <div id="analytics-dashboard" className="p-5 bg-gray-50 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800"> Analytics </h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border rounded px-3 py-1 text-xs text-gray-700 shadow-sm focus:border-[#7A8063] focus:ring-[#7A8063]"
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <Button
            onClick={exportToCSV}
            className="bg-[#7A8063] hover:bg-[#7A8055] text-white px-3 py-1 rounded-md text-xs shadow"
          >
            Export CSV
          </Button>
          <Button
            onClick={exportToPDF}
            className="bg-[#7A8063] hover:bg-[#7A8055] text-white px-3 py-1 rounded-md text-xs shadow"
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid gap-3 md:grid-cols-3 mb-4">
        <InsightsCard title="Total Impressions" value={filter === "This Year" ? "85K" : filter === "This Month" ? "22K" : "12.5K"} change="+12%" positive />
        <InsightsCard title="Engagement Rate" value={filter === "This Year" ? "4.8%" : filter === "This Month" ? "4.5%" : "4.2%"} change="+0.8%" positive />
        <InsightsCard title="Followers Gained" value={filter === "This Year" ? "12K" : filter === "This Month" ? "3.4K" : "1.1K"} change="+5%" positive />
      </div>

      {/* Combined Chart Section */}
      <CombinedChart filter={filter} />
    </div>
  );
}
