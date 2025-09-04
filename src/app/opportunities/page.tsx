"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OpportunityFilters from "@/components/opportunity-components/filters";
import OpportunityRadar from "@/components/opportunity-components/radar";
import OpportunityAlerts from "@/components/opportunity-components/alerts";
import OpportunityList from "@/components/opportunity-components/list";
import { Download, RefreshCw } from "lucide-react";

export default function OpportunityPage() {
  const [opportunities, setOpportunities] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [filters, setFilters] = React.useState({ industry: "", location: "" });

  // Mock scanning function
  const scanOpportunities = () => {
    const mockData = [
      { id: 1, title: "AI Marketing Platform", industry: "Tech", value: "$250K" },
      { id: 2, title: "Healthcare SaaS Tool", industry: "Healthcare", value: "$500K" },
      { id: 3, title: "Eco-Friendly Packaging", industry: "Retail", value: "$150K" },
      { id: 4, title: "FinTech Mobile App", industry: "Finance", value: "$300K" },
    ];
    setOpportunities(mockData);

    setAlerts((prev) => [
      ...prev,
      { id: prev.length + 1, message: "🔎 New opportunities scanned and added." },
    ]);
  };

  // Export report to CSV
  const exportReport = () => {
    if (opportunities.length === 0) {
      alert("⚠️ No opportunities to export.");
      return;
    }

    const rows = [["ID", "Title", "Industry", "Value"]];
    opportunities.forEach((o) => {
      rows.push([o.id, o.title, o.industry, o.value]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "opportunity_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock alerts on first load
  React.useEffect(() => {
    setAlerts([
      { id: 1, message: "✨ AI opportunity detected in Tech Industry" },
      { id: 2, message: "💡 Healthcare funding opportunity spotted" },
    ]);
  }, []);

  return (
    <div className="p-6 bg-gray-50 rounded-2xl shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
           Opportunities
        </h2>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={scanOpportunities}
            className="flex items-center gap-2 bg-[#7A8063] hover:bg-[#6a7258] text-white rounded-xl px-5 py-2 shadow-md transition-all hover:scale-105"
          >
            <RefreshCw size={16} /> Scan Now
          </Button>
          <Button
            variant="outline"
            onClick={exportReport}
            className="flex items-center gap-2 border-[#7A8063] text-[#7A8063] hover:bg-[#f4f4f0] rounded-xl px-5 py-2 shadow-sm transition-all hover:scale-105"
          >
            <Download size={16} /> Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            🔍 Opportunity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityFilters filters={filters} setFilters={setFilters} />
        </CardContent>
      </Card>

      {/* Radar + Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <OpportunityRadar opportunities={opportunities} />
        <OpportunityAlerts alerts={alerts} />
      </div>

      {/* List Section */}
      <div className="mt-6">
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              📋 Matched Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length > 0 ? (
              <OpportunityList opportunities={opportunities} />
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No opportunities scanned yet. Click <strong>Scan Now</strong> to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
