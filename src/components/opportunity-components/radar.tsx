"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Opportunity {
  id: number;
  title: string;
  industry: string;
  value: string;
}

interface Props {
  opportunities: Opportunity[];
}

export default function OpportunityRadar({ opportunities }: Props) {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-800">
          🌐 Opportunity Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <p className="text-sm text-gray-500">No opportunities available yet.</p>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-3 rounded-xl border border-gray-100 bg-[#f9fafb] hover:bg-[#7A8055]/10 transition"
              >
                <p className="text-sm font-semibold text-[#7A8063]">
                  {opp.title}
                </p>
                <p className="text-xs text-gray-500">
                  {opp.industry} • {opp.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
