"use client";

import { useData } from "@/lib/data-context";
import { FilterX } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const { filters, setFilters } = useData();
  const pathname = usePathname();

  const titleMap: Record<string, string> = {
    "/": "Overview",
    "/calendar": "Calendar",
    "/trades": "Trades",
    "/reports": "Reports",
    "/summaries": "Summaries",
    "/news": "News",
    "/prop": "Prop",
  };
  const title = titleMap[pathname] || "Dashboard";

  const togglePair = (pair: string) => {
    setFilters(f => ({ ...f, symbol: f.symbol === pair ? "All" : pair }));
  };

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
            
            <div className="flex items-center gap-2 px-1">
              <button 
                onClick={() => setFilters(f => ({ ...f, symbol: "All" }))}
                className={`p-1 rounded-lg transition-all hover:scale-105 ${filters.symbol === "All" ? "bg-zinc-800 shadow-sm border border-zinc-700/50" : "hover:bg-zinc-800/50 border border-transparent"}`}
                title="All Pairs"
              >
                <div className={`w-16 h-16 rounded-md overflow-hidden ${filters.symbol === "All" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900" : ""}`}>
                  <img src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/all.jpg`} className="w-full h-full object-cover scale-[1.35] brightness-125 contrast-125" />
                </div>
              </button>
              <button 
                onClick={() => togglePair("EURUSD")}
                className={`p-1 rounded-lg transition-all hover:scale-105 ${filters.symbol === "EURUSD" ? "bg-zinc-800 shadow-sm border border-zinc-700/50" : "hover:bg-zinc-800/50 border border-transparent"}`}
                title="EURUSD"
              >
                <img src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/eurusd.jpg`} className={`w-16 h-16 rounded-md object-cover brightness-125 contrast-125 ${filters.symbol === "EURUSD" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900" : ""}`} />
              </button>
              <button 
                onClick={() => togglePair("GBPUSD")}
                className={`p-1 rounded-lg transition-all hover:scale-105 ${filters.symbol === "GBPUSD" ? "bg-zinc-800 shadow-sm border border-zinc-700/50" : "hover:bg-zinc-800/50 border border-transparent"}`}
                title="GBPUSD"
              >
                <img src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/gbpusd.jpg`} className={`w-16 h-16 rounded-md object-cover brightness-125 contrast-125 ${filters.symbol === "GBPUSD" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900" : ""}`} />
              </button>
              <button 
                onClick={() => togglePair("AUDUSD")}
                className={`p-1 rounded-lg transition-all hover:scale-105 ${filters.symbol === "AUDUSD" ? "bg-zinc-800 shadow-sm border border-zinc-700/50" : "hover:bg-zinc-800/50 border border-transparent"}`}
                title="AUDUSD"
              >
                <img src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/audusd.jpg`} className={`w-16 h-16 rounded-md object-cover brightness-125 contrast-125 ${filters.symbol === "AUDUSD" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900" : ""}`} />
              </button>
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

    </header>
  );
}
