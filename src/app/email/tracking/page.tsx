"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Sun, Moon } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type EmailStat = {
  id: number;
  recipient: string;
  subject: string;
  date: string;
  opened: boolean;
  clicks: number;
};

export default function EmailTracking() {
  const [darkMode, setDarkMode] = useState(false);
  const [emails] = useState<EmailStat[]>([
    { id: 1, recipient: "user1@example.com", subject: "Welcome!", date: "2025-08-17", opened: true, clicks: 2 },
    { id: 2, recipient: "user2@example.com", subject: "Follow-up", date: "2025-08-16", opened: false, clicks: 0 },
    { id: 3, recipient: "user3@example.com", subject: "Promo", date: "2025-08-15", opened: true, clicks: 1 },
  ]);

  // Chart data
  const chartData = {
    labels: emails.map((e) => e.subject),
    datasets: [
      {
        label: "Opened",
        data: emails.map((e) => (e.opened ? 1 : 0)),
        backgroundColor: "#7A8063",
      },
      {
        label: "Clicks",
        data: emails.map((e) => e.clicks),
        backgroundColor: "#A3A77A",
      },
    ],
  };

  return (
    <div
      className="min-h-screen p-6 transition-colors"
      
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📊 Open & Click Tracking</h1>
      </header>

      {/* Chart Card */}
      <div className="p-4 mb-6 rounded-2xl shadow-md bg-[#FDFBEA] relative">
  <h2 className="text-sm font-semibold mb-3 flex justify-between items-center">
    Email Performance
    <span className="px-2 py-0.5 text-[10px] bg-yellow-200 text-yellow-800 rounded-full">AI Insights</span>
  </h2>
  <div className="h-40">
    <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
  </div>
</div>


      {/* Email Table Card */}
      <div
        className="p-4 rounded-2xl shadow-md overflow-x-auto"
        style={{ backgroundColor: darkMode ? "#2C2F25" : "#FDFBEA" }}
      >
        <h2 className="text-base font-semibold mb-3">Email List</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Recipient</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Date</th>
              <th className="p-2">Opened</th>
              <th className="p-2">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr
                key={email.id}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <td className="p-2">{email.recipient}</td>
                <td className="p-2">{email.subject}</td>
                <td className="p-2">{email.date}</td>
                <td className="p-2">{email.opened ? "✅" : "❌"}</td>
                <td className="p-2">{email.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
