"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";


export default function EmailAutomationPage() {
  const [darkMode, setDarkMode] = useState(false);

  const cards = [
    {
      title: "✍ Email Composer",
      desc: "Create and customize professional emails with AI-powered suggestions.",
      href: "/email/composer",
    },
    {
      title: "🔁 Automated Sequences",
      desc: "Build automated workflows to send emails based on triggers.",
      href: "/email/sequences",
    },
    {
      title: "⏰ Follow-up Scheduler",
      desc: "Schedule personalized follow-ups to stay connected with leads.",
      href: "/email/followups",
    },
    {
      title: "📊 Open & Click Tracking",
      desc: "Track email opens and link clicks with detailed analytics.",
      href: "/email/tracking",
    },
  ];

  return (
    
      <div
        className="min-h-screen transition-colors"
        
      >
        {/* Header */}
        <header
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 shadow-md rounded-b-xl transition-colors duration-300 gap-3 sm:gap-0"
          
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-[#7A8063] text-xl">📧</span>
              Email Automation
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Smart tools to compose, automate, and track emails.
            </p>
          </div>

          
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="p-4 rounded-xl shadow hover:shadow-lg hover:scale-[1.01] transition-all duration-200 block"
                style={{
                  backgroundColor: darkMode ? "#E5E7EB" : "#F9FAFB",
                  color: darkMode ? "#1F2937" : "#1F2937",
                }}
              >
                <h2
                  className="text-lg font-semibold mb-1 tracking-tight transition-colors duration-200"
                  style={{ color: "#7A8063" }}
                >
                  {card.title}
                </h2>
                <p className="text-xs leading-snug opacity-80">{card.desc}</p>

                {/* Hover effect for title */}
                <style jsx>{`
                  a:hover h2 {
                    color: #7A8055;
                  }
                `}</style>
              </Link>
            ))}
          </div>
        </main>
      </div>
    
  );
}
