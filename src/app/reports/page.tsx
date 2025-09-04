"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download, FileText, Edit3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"

// Utility: export to CSV
const exportToCSV = (data: any[], filename: string) => {
  const csvRows = [
    ["Month", "Sales", "Revenue"],
    ...data.map((row) => [row.name, row.sales, row.revenue]),
  ]
  const csvContent =
    "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Utility: export to PDF (simple)
const exportToPDF = async () => {
  const element = document.getElementById("report-area")
  if (!element) return
  const html2pdf = (await import("html2pdf.js")).default
  html2pdf().from(element).save("Report.pdf")
}

export default function ReportsPage() {
  const [reportData] = useState([
    { name: "Jan", sales: 2400, revenue: 4000 },
    { name: "Feb", sales: 1398, revenue: 3000 },
    { name: "Mar", sales: 9800, revenue: 5000 },
    { name: "Apr", sales: 3908, revenue: 3500 },
    { name: "May", sales: 4800, revenue: 6000 },
    { name: "Jun", sales: 3800, revenue: 4500 },
  ])

  const [notes, setNotes] = useState("")

  return (
    <div className="p-6 space-y-6" id="report-area">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7A8063] to-[#4A503D] bg-clip-text text-transparent">
          Reports & Analytics
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => exportToCSV(reportData, "Report.csv")}
            className="bg-[#7A8063] hover:bg-[#4A503D] text-white rounded-xl px-4"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={exportToPDF}
            className="bg-[#4A503D] hover:bg-[#7A8063] text-white rounded-xl px-4"
          >
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date Range</Label>
            <Input type="date" className="mt-1" />
          </div>
          <div>
            <Label>Report Type</Label>
            <select className="w-full p-2 border rounded-md mt-1 focus:ring-2 focus:ring-[#7A8063]">
              <option>Sales Report</option>
              <option>Revenue Report</option>
              <option>Customer Report</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-[#7A8063] hover:bg-[#4A503D] text-white rounded-xl">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Sales & Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#7A8063" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" fill="#4A503D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Working Area */}
      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#7A8063]" /> Analyst Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#7A8063] min-h-[150px]"
            placeholder="Write insights, observations, or strategy notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button className="mt-4 bg-[#4A503D] hover:bg-[#7A8063] text-white rounded-xl">
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
