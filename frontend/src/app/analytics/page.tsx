"use client";

import { useState } from "react";
import { PerformanceView } from "@/components/analytics/PerformanceView";
import { CalendarView } from "@/components/analytics/CalendarView";
import { DailyHeatmap } from "@/components/analytics/DailyHeatmap";

const TABS = ["Performance", "Calendar"] as const;
type Tab = (typeof TABS)[number];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("Performance");
  const [focus, setFocus] = useState<{ date: Date; selectDay: boolean } | null>(null);

  const openInCalendar = (date: Date, selectDay: boolean) => {
    setFocus({ date, selectDay });
    setTab("Calendar");
  };

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
      {tab === "Performance" ? (
        <PerformanceView onPickMonth={(y, m) => openInCalendar(new Date(y, m, 1), false)} />
      ) : (
        <div className="space-y-4">
          <DailyHeatmap onPickDay={d => openInCalendar(d, true)} />
          <CalendarView focus={focus} />
        </div>
      )}
    </div>
  );
}
