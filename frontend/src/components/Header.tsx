"use client";

import { useData } from "@/lib/data-context";
import { Bell, FilterX } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const { filters, setFilters } = useData();
  const pathname = usePathname();

  const titleMap: Record<string, string> = {
    "/": "Overview",
    "/calendar": "Calendar View",
    "/trades": "Trade Log",
    "/reports": "Detailed Reports",
  };
  const title = titleMap[pathname] || "Dashboard";

  return (
    <header className="h-auto min-h-[64px] border-b border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between px-8 py-4 sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold hidden lg:block min-w-[120px]">{title}</h1>
        
        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <div className="flex items-center border-r border-zinc-700/50 pr-2 mr-2">
              <button 
                onClick={() => setFilters(f => ({ ...f, tradeType: "backtest" }))}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.tradeType === "backtest" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                Backtest
              </button>
              <button 
                onClick={() => setFilters(f => ({ ...f, tradeType: "live" }))}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.tradeType === "live" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                Live
              </button>
            </div>
            
            <select 
              className="bg-transparent text-sm font-medium text-zinc-300 outline-none cursor-pointer border-none py-1.5 pl-2 pr-4 appearance-none"
              value={filters.symbol}
              onChange={(e) => setFilters(f => ({ ...f, symbol: e.target.value }))}
            >
              <option value="All">All Pairs</option>
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
              <option value="AUDUSD">AUDUSD</option>
            </select>
            <div className="pointer-events-none pr-3 text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {/* Clear active day filter if any */}
          {filters.dayOfWeek !== null && (
            <button 
              onClick={() => setFilters(f => ({ ...f, dayOfWeek: null }))}
              className="flex items-center gap-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-sm transition-colors border border-blue-500/20"
            >
              Day Filter Active <FilterX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <Bell size={20} className="text-zinc-400" />
        </button>
        <div className="w-8 h-8 bg-zinc-700 rounded-full border border-zinc-600 shrink-0"></div>
      </div>
    </header>
  );
}
