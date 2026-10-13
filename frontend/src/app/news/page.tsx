"use client";

import { useState, useMemo } from "react";
import { FolderIcon, Calendar as CalendarIcon, Clock } from "lucide-react";

// Helper to ensure every event always starts with the day of the week
function parseDayAndDate(ev: { day?: string; date: string }) {
  if (ev.day) {
    return { day: ev.day, date: ev.date };
  }

  const trimmed = (ev.date || "").trim();
  const dayMatch = trimmed.match(/^([A-Za-z]{3,9})[,\s]+(.*)$/);
  const validDays: Record<string, string> = {
    mon: "Mon", monday: "Mon",
    tue: "Tue", tues: "Tue", tuesday: "Tue",
    wed: "Wed", wednesday: "Wed",
    thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
    fri: "Fri", friday: "Fri",
    sat: "Sat", saturday: "Sat",
    sun: "Sun", sunday: "Sun",
  };

  if (dayMatch && validDays[dayMatch[1].toLowerCase()]) {
    return {
      day: validDays[dayMatch[1].toLowerCase()],
      date: dayMatch[2].trim()
    };
  }

  try {
    const year = 2026;
    const dateWithYear = trimmed.includes("202") ? trimmed : `${trimmed} ${year}`;
    const parsed = new Date(Date.parse(dateWithYear));
    if (!isNaN(parsed.getTime())) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return { day: days[parsed.getDay()], date: trimmed };
    }
  } catch {}

  return { day: "-", date: trimmed };
}

export default function NewsPage() {
  const [timeFilter, setTimeFilter] = useState<"week" | "month">("week");

  const newsEvents = [
    // --- THIS WEEK (Oct 13 - Oct 18, 2026) ---
    { day: "Tue", date: "Oct 13", time: "07:00 AM", currency: "EUR", impact: "Medium", event: "German Final CPI m/m", actual: "0.6%", forecast: "0.6%", previous: "0.6%", isThisWeek: true },
    { day: "Tue", date: "Oct 13", time: "09:00 AM", currency: "USD", impact: "Medium", event: "NFIB Small Business Index", actual: "91.5", forecast: "91.2", previous: "91.2", isThisWeek: true },
    { day: "Tue", date: "Oct 13", time: "02:00 PM", currency: "USD", impact: "High", event: "FOMC Member Waller Speaks", actual: "", forecast: "", previous: "", isThisWeek: true },
    { day: "Tue", date: "Oct 13", time: "04:30 PM", currency: "GBP", impact: "Medium", event: "BoE Exec Director Breeden Speaks", actual: "", forecast: "", previous: "", isThisWeek: true },
    { day: "Wed", date: "Oct 14", time: "01:30 PM", currency: "USD", impact: "High", event: "CPI m/m & y/y", actual: "", forecast: "0.6%", previous: "0.4%", isThisWeek: true },
    { day: "Wed", date: "Oct 14", time: "01:30 PM", currency: "USD", impact: "High", event: "Core CPI m/m", actual: "", forecast: "0.2%", previous: "0.3%", isThisWeek: true },
    { day: "Wed", date: "Oct 14", time: "03:30 PM", currency: "GBP", impact: "High", event: "BoE Governor Bailey Speaks", actual: "", forecast: "", previous: "", isThisWeek: true },
    { day: "Wed", date: "Oct 14", time: "07:00 PM", currency: "USD", impact: "Medium", event: "Fed Beige Book", actual: "", forecast: "", previous: "", isThisWeek: true },
    { day: "Thu", date: "Oct 15", time: "01:30 AM", currency: "AUD", impact: "High", event: "Employment Change & Unemployment Rate", actual: "", forecast: "25.0K", previous: "47.5K", isThisWeek: true },
    { day: "Thu", date: "Oct 15", time: "01:30 PM", currency: "USD", impact: "High", event: "Retail Sales m/m", actual: "", forecast: "0.3%", previous: "0.1%", isThisWeek: true },
    { day: "Thu", date: "Oct 15", time: "01:30 PM", currency: "USD", impact: "High", event: "PPI m/m & Core PPI", actual: "", forecast: "0.2%", previous: "0.2%", isThisWeek: true },
    { day: "Thu", date: "Oct 15", time: "01:30 PM", currency: "USD", impact: "High", event: "Unemployment Claims", actual: "", forecast: "205K", previous: "200K", isThisWeek: true },
    { day: "Fri", date: "Oct 16", time: "10:00 AM", currency: "EUR", impact: "High", event: "Eurozone Final CPI y/y", actual: "", forecast: "1.8%", previous: "2.2%", isThisWeek: true },
    { day: "Fri", date: "Oct 16", time: "01:30 PM", currency: "USD", impact: "Medium", event: "Import Price Index m/m", actual: "", forecast: "-0.1%", previous: "-0.3%", isThisWeek: true },

    // --- LATER THIS MONTH (Oct 19 - Oct 31, 2026) ---
    { day: "Tue", date: "Oct 20", time: "07:00 AM", currency: "GBP", impact: "High", event: "Claimant Count Change & Unemployment Rate", actual: "", forecast: "12.5K", previous: "15.2K", isThisWeek: false },
    { day: "Tue", date: "Oct 20", time: "10:00 AM", currency: "EUR", impact: "High", event: "German ZEW Economic Sentiment", actual: "", forecast: "36.5", previous: "34.7", isThisWeek: false },
    { day: "Wed", date: "Oct 21", time: "07:00 AM", currency: "GBP", impact: "High", event: "CPI y/y (UK Inflation)", actual: "", forecast: "2.1%", previous: "2.2%", isThisWeek: false },
    { day: "Thu", date: "Oct 22", time: "01:30 PM", currency: "USD", impact: "High", event: "Unemployment Claims", actual: "", forecast: "208K", previous: "205K", isThisWeek: false },
    { day: "Fri", date: "Oct 23", time: "08:30 AM", currency: "EUR", impact: "High", event: "Flash Manufacturing & Services PMI", actual: "", forecast: "46.2", previous: "45.8", isThisWeek: false },
    { day: "Fri", date: "Oct 23", time: "09:30 AM", currency: "GBP", impact: "High", event: "Flash Manufacturing & Services PMI", actual: "", forecast: "51.8", previous: "51.5", isThisWeek: false },
    { day: "Fri", date: "Oct 23", time: "02:45 PM", currency: "USD", impact: "High", event: "Flash Manufacturing & Services PMI", actual: "", forecast: "50.2", previous: "49.8", isThisWeek: false },
    { day: "Wed", date: "Oct 28", time: "01:30 AM", currency: "AUD", impact: "High", event: "CPI q/q (Australia Q3 Inflation)", actual: "", forecast: "0.8%", previous: "1.0%", isThisWeek: false },
    { day: "Wed", date: "Oct 28", time: "07:00 PM", currency: "USD", impact: "High", event: "Federal Reserve (FOMC) Rate Decision", actual: "", forecast: "4.75%", previous: "5.00%", isThisWeek: false },
    { day: "Wed", date: "Oct 28", time: "07:30 PM", currency: "USD", impact: "High", event: "FOMC Press Conference", actual: "", forecast: "", previous: "", isThisWeek: false },
    { day: "Thu", date: "Oct 29", time: "01:15 PM", currency: "EUR", impact: "High", event: "ECB Interest Rate Decision", actual: "", forecast: "3.25%", previous: "3.50%", isThisWeek: false },
    { day: "Thu", date: "Oct 29", time: "01:30 PM", currency: "USD", impact: "High", event: "Advance GDP q/q", actual: "", forecast: "2.8%", previous: "3.0%", isThisWeek: false },
  ];

  const filteredEvents = useMemo(() => {
    if (timeFilter === "week") {
      return newsEvents.filter(ev => ev.isThisWeek);
    }
    return newsEvents;
  }, [timeFilter]);

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon size={20} className="text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">News Calendar</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
            {filteredEvents.length} events
          </span>
        </div>

        {/* Filters for This Week / This Month */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1 self-start sm:self-auto">
          <button 
            onClick={() => setTimeFilter("week")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              timeFilter === "week" 
                ? "bg-zinc-800 text-white shadow drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeFilter("month")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              timeFilter === "month" 
                ? "bg-zinc-800 text-white shadow drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            This Month
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 p-6">
        <p className="text-sm text-zinc-400 mb-6">
          High and medium impact economic events affecting EUR, GBP, AUD, and USD for {timeFilter === "week" ? "this trading week" : "the current month"}.
        </p>
        
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Day / Date</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Currency</th>
                <th className="px-6 py-4 font-medium text-center">Impact</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium text-right">Actual</th>
                <th className="px-6 py-4 font-medium text-right">Forecast</th>
                <th className="px-6 py-4 font-medium text-right">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredEvents.map((ev, i) => {
                const { day, date } = parseDayAndDate(ev);
                const isHigh = ev.impact === "High";
                const folderColor = isHigh ? "#ef4444" : "#f59e0b";
                return (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-xs">
                          {day}
                        </span>
                        <span className="text-zinc-300 font-medium">{date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                      <Clock size={14} /> {ev.time}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-200">{ev.currency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center" title={`${ev.impact} Impact`}>
                        <FolderIcon size={18} fill={folderColor} stroke={folderColor} className="drop-shadow-sm" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-200 font-medium">{ev.event}</td>
                    <td className={`px-6 py-4 text-right font-mono ${ev.actual ? 'text-white font-semibold' : 'text-zinc-600'}`}>
                      {ev.actual || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">
                      {ev.forecast || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">
                      {ev.previous || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
