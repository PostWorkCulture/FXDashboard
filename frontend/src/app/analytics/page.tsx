"use client";

import { useState } from "react";
import { PerformanceView } from "@/components/analytics/PerformanceView";
import { CalendarView } from "@/components/analytics/CalendarView";

const TABS = ["Performance", "Calendar"] as const;
type Tab = (typeof TABS)[number];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("Performance");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Performance" ? <PerformanceView /> : <CalendarView />}
    </div>
  );
}
