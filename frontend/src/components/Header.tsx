"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/data-context";
import { FilterX, Calendar } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const { filters, setFilters } = useData();
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState<{ day: string; date: string } | null>(null);

  useEffect(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const updateDate = () => {
      const d = new Date();
      setCurrentDate({
        day: days[d.getDay()],
        date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
      });
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);
    return () => clearInterval(timer);
  }, []);

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
            
            <div className="flex items-center gap-1 px-1">
              <button 
                onClick={() => setFilters(f => ({ ...f, symbol: "All" }))}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  filters.symbol === "All" ? "bg-zinc-800 text-white shadow drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                ALL
              </button>
              <button 
                onClick={() => togglePair("EURUSD")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  filters.symbol === "EURUSD" ? "bg-zinc-800 text-blue-400 shadow drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                EURUSD
              </button>
              <button 
                onClick={() => togglePair("GBPUSD")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  filters.symbol === "GBPUSD" ? "bg-zinc-800 text-pink-400 shadow drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                GBPUSD
              </button>
              <button 
                onClick={() => togglePair("AUDUSD")}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                  filters.symbol === "AUDUSD" ? "bg-zinc-800 text-green-400 shadow drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]" : "text-zinc-400 hover:text-white"
                }`}
              >
                AUDUSD
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

      {/* Top Right Date Display */}
      <div className="flex items-center gap-2.5 self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm shadow-xs shrink-0">
        <Calendar size={15} className="text-zinc-400" />
        {currentDate ? (
          <span className="text-zinc-300 font-medium">
            <span className="text-white font-bold">{currentDate.day}</span>, {currentDate.date}
          </span>
        ) : (
          <span className="text-zinc-500 font-mono text-xs">--</span>
        )}
      </div>

    </header>
  );
}
