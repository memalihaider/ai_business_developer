"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports 📊</h1>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Leads Generated:</strong> 250</p>
          <p><strong>Proposals Sent:</strong> 120</p>
          <p><strong>Projects Won:</strong> 42</p>
          <Button className="bg-indigo-600 text-white mt-4">Export as PDF</Button>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Generate a report by selecting filters:</p>
          <Button className="bg-purple-600 text-white">Generate Report</Button>
        </CardContent>
      </Card>
    </div>
  )
}
