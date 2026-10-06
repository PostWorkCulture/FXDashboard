"use client";

import { FolderIcon, FolderOpen, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function NewsPage() {
  const newsEvents = [
    { date: "Oct 06", time: "08:30 AM", currency: "USD", impact: "High", event: "Non-Farm Employment Change", actual: "254K", forecast: "147K", previous: "159K" },
    { date: "Oct 06", time: "08:30 AM", currency: "USD", impact: "High", event: "Unemployment Rate", actual: "4.1%", forecast: "4.2%", previous: "4.2%" },
    { date: "Oct 07", time: "02:00 AM", currency: "GBP", impact: "High", event: "BoE Gov Bailey Speaks", actual: "", forecast: "", previous: "" },
    { date: "Oct 08", time: "01:00 AM", currency: "AUD", impact: "High", event: "RBA Meeting Minutes", actual: "", forecast: "", previous: "" },
    { date: "Oct 09", time: "02:00 PM", currency: "USD", impact: "High", event: "FOMC Meeting Minutes", actual: "", forecast: "", previous: "" },
    { date: "Oct 10", time: "08:30 AM", currency: "USD", impact: "High", event: "CPI m/m", actual: "", forecast: "0.1%", previous: "0.2%" },
    { date: "Oct 10", time: "08:30 AM", currency: "USD", impact: "High", event: "Core CPI m/m", actual: "", forecast: "0.2%", previous: "0.3%" },
    { date: "Oct 17", time: "08:15 AM", currency: "EUR", impact: "High", event: "Main Refinancing Rate", actual: "", forecast: "3.40%", previous: "3.65%" },
    { date: "Oct 17", time: "08:45 AM", currency: "EUR", impact: "High", event: "ECB Press Conference", actual: "", forecast: "", previous: "" },
  ];

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon size={20} className="text-zinc-400" />
          Economic Calendar (Red Folder)
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
