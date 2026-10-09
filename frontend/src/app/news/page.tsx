"use client";

import { FolderIcon, FolderOpen, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function NewsPage() {
  const newsEvents = [
    { date: "Oct 08", time: "09:30 AM", currency: "GBP", impact: "High", event: "BoE Credit Conditions Survey", actual: "Released", forecast: "", previous: "" },
    { date: "Oct 08", time: "12:30 PM", currency: "EUR", impact: "High", event: "ECB Monetary Policy Meeting Accounts", actual: "Released", forecast: "", previous: "" },
    { date: "Oct 08", time: "01:30 PM", currency: "USD", impact: "High", event: "Unemployment Claims", actual: "200K", forecast: "197K", previous: "202K" },
    { date: "Oct 09", time: "03:00 AM", currency: "EUR", impact: "Medium", event: "Italian Industrial Production m/m", actual: "", forecast: "0.2%", previous: "0.1%" },
    { date: "Oct 09", time: "09:00 AM", currency: "USD", impact: "High", event: "Prelim UoM Consumer Sentiment", actual: "", forecast: "70.5", previous: "70.1" },
    { date: "Oct 09", time: "09:00 AM", currency: "USD", impact: "Medium", event: "Prelim UoM Inflation Expectations", actual: "", forecast: "3.1%", previous: "3.2%" },
    { date: "Oct 09", time: "03:00 PM", currency: "USD", impact: "Medium", event: "FOMC Member Collins Speaks", actual: "", forecast: "", previous: "" },
    { date: "Oct 14", time: "01:30 PM", currency: "USD", impact: "High", event: "CPI m/m & y/y", actual: "", forecast: "0.2%", previous: "0.2%" },
    { date: "Oct 15", time: "01:30 PM", currency: "USD", impact: "High", event: "Retail Sales & Core PPI", actual: "", forecast: "0.3%", previous: "0.1%" },
    { date: "Oct 28", time: "07:00 PM", currency: "USD", impact: "High", event: "Federal Reserve (FOMC) Meeting", actual: "", forecast: "4.75%", previous: "5.00%" },
  ];

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon size={20} className="text-zinc-400" />
          News
        </h2>
      </div>
      
      <div className="overflow-x-auto flex-1 p-6">
        <p className="text-sm text-zinc-400 mb-6">High impact (Red Folder) events affecting EUR, GBP, AUD, and USD.</p>
        
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
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
              {newsEvents.map((ev, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-300">{ev.date}</td>
                  <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                    <Clock size={14} /> {ev.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-zinc-200">{ev.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <FolderIcon size={18} fill="#ef4444" stroke="#ef4444" className="drop-shadow-sm" />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
