"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Alert {
  id: number;
  message: string;
}

interface Props {
  alerts: Alert[];
}

export default function OpportunityAlerts({ alerts }: Props) {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-800">
          🔔 Industry Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">No alerts right now.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="p-3 rounded-xl bg-[#7A8063]/10 text-gray-800 hover:bg-[#7A8055]/20 transition"
              >
                {alert.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
