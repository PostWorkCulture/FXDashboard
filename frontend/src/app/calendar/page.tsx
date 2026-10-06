"use client";

import { useData } from "@/lib/data-context";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from "date-fns";

export default function CalendarPage() {
  const { filteredTrades, isLoading } = useData();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Compute Daily Aggregates
  const dailyData = useMemo(() => {
    const map = new Map<string, { pnl: number; trades: number; wins: number; symbols: Set<string> }>();
    filteredTrades.forEach(t => {
      const dateStr = t.entry_time.split(" ")[0]; // YYYY-MM-DD
      if (!map.has(dateStr)) {
        map.set(dateStr, { pnl: 0, trades: 0, wins: 0, symbols: new Set() });
      }
      const dayData = map.get(dateStr)!;
      dayData.pnl += t.pnl;
      dayData.trades += 1;
      if (t.is_win) dayData.wins += 1;
      dayData.symbols.add(t.symbol);
    });
    return map;
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading calendar...</div>;
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDayStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDayTrades = selectedDayStr 
    ? filteredTrades.filter(t => t.entry_time.startsWith(selectedDayStr))
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      {/* Calendar Grid */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-bold text-white">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="p-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto">
          {calendarDays.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const data = dailyData.get(dateStr);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            
            let bgColor = "bg-zinc-900";
            if (data) {
              if (data.pnl > 0) bgColor = "bg-green-500/10 hover:bg-green-500/20";
              else if (data.pnl < 0) bgColor = "bg-pink-500/10 hover:bg-pink-500/20";
              else bgColor = "bg-zinc-800/50 hover:bg-zinc-800";
            } else {
              bgColor = "bg-zinc-900 hover:bg-zinc-800/50";
            }

            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[100px] border-r border-b border-zinc-800/50 p-2 cursor-pointer transition-colors flex flex-col ${bgColor} ${
                  !isCurrentMonth ? "opacity-30" : ""
                } ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
              >
                <div className="text-right">
                  <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? "bg-blue-500 text-white w-6 h-6 rounded-full inline-flex items-center justify-center" : "text-zinc-300"}`}>
                    {format(day, "d")}
                  </span>
                </div>
                {data && (
                  <div className="mt-auto space-y-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {Array.from(data.symbols).map(sym => (
                        <span key={sym} className="text-[10px] leading-none px-1 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          {sym.replace("USD", "")}
                        </span>
                      ))}
                    </div>
                    <div className={`text-sm font-bold ${data.pnl >= 0 ? "text-green-500" : "text-pink-500"}`}>
                      {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-500 flex justify-between">
                      <span>{data.trades} trades</span>
                      <span>{Math.round((data.wins / data.trades) * 100)}% W</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-out / Side Panel for Selected Day */}
      {selectedDay && (
        <div className="w-full lg:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">{format(selectedDay, "EEEE, MMM d, yyyy")}</h3>
              <p className="text-sm text-zinc-400">{selectedDayTrades.length} trades taken</p>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-white transition-colors">
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedDayTrades.length > 0 ? (
              selectedDayTrades.map(trade => (
                <div key={trade.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                        trade.direction === "Long" ? "bg-green-500/20 text-green-400" : "bg-pink-500/20 text-pink-400"
                      }`}>
                        {trade.direction}
                      </span>
                      <span className="font-bold">{trade.symbol}</span>
                    </div>
                    <div className={`font-mono font-bold ${trade.pnl >= 0 ? "text-green-500" : "text-pink-500"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div>Entry: <span className="text-zinc-200">{trade.entry_price.toFixed(5)}</span></div>
                    <div>Exit: <span className="text-zinc-200">{trade.exit_price.toFixed(5)}</span></div>
                    <div>Duration: <span className="text-zinc-200">{trade.duration_hours?.toFixed(1) || "-"}h</span></div>
                    <div>R-Mult: <span className="text-zinc-200">{trade.r_multiple?.toFixed(2) || "-"}R</span></div>
                  </div>
                  
                  {trade.setup && (
                    <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-2 mt-2">
                      <span className="bg-zinc-800 px-2 py-1 rounded-md">Setup: {trade.setup}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-10">No trades taken on this day.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
