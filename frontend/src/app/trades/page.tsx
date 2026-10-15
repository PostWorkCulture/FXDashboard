"use client";

import { useData } from "@/lib/data-context";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExecutionChart } from "@/components/ExecutionChart";
import { usd, price, pct, rMultiple, duration, pnlClass, isClosed } from "@/lib/format";

export default function TradesPage() {
  const { filteredTrades, isLoading, filters, setFilters } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const itemsPerPage = 20;

  // Journal notes are kept in this browser (the site is static, there is no server to save to)
  const notesKey = (t: any) => `pwcfx-notes-${t.trade_type}-${t.id}`;
  useEffect(() => {
    if (!selectedTrade) return;
    let saved = "";
    try { saved = localStorage.getItem(notesKey(selectedTrade)) ?? ""; } catch {}
    setNotes(saved || selectedTrade.notes || "");
    setNotesSaved(false);
  }, [selectedTrade]);
  const saveNotes = () => {
    try { localStorage.setItem(notesKey(selectedTrade), notes); setNotesSaved(true); } catch {}
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading trades...</div>;
  }

  // Sort descending by entry time (newest first)
  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(b.entry_time.replace(" ", "T")).getTime() - new Date(a.entry_time.replace(" ", "T")).getTime());
  const closed = sortedTrades.filter(isClosed);
  const wins = closed.filter(t => t.pnl > 0).length;

  // Auto-open selected trade from global filter link
  if (filters.selectedTradeId && !selectedTrade) {
    const t = sortedTrades.find(trade => trade.id === filters.selectedTradeId);
    if (t) {
      setSelectedTrade(t);
      // Clear it so we don't get stuck if user closes the modal
      setTimeout(() => setFilters(f => ({ ...f, selectedTradeId: null })), 100);
    }
  }

  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTrades = sortedTrades.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full pb-8">
      <div className="flex-1 border border-zinc-800/70 rounded-xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Trades <span className="text-zinc-500 font-normal">({sortedTrades.length.toLocaleString("en-GB")})</span></h2>
        </div>
        
        <div className="overflow-x-auto flex-1">
          {sortedTrades.length > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 border-b border-zinc-800/70">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Pair</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">Entry</th>
                  <th className="px-4 py-3 font-medium">Day</th>
                  <th className="px-4 py-3 font-medium">Exit</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium text-right">Entry Price</th>
                  <th className="px-4 py-3 font-medium text-right">Exit Price</th>
                  <th className="px-4 py-3 font-medium text-right">P&L</th>
                  <th className="px-4 py-3 font-medium text-right">R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {currentTrades.map((trade) => {
                  const entryDate = new Date(trade.entry_time.replace(" ", "T"));
                  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  const dayName = days[entryDate.getDay()];
                  return (
                  <tr 
                    key={trade.id} 
                    onClick={() => setSelectedTrade(trade)}
                    className={`hover:bg-zinc-900 transition-colors cursor-pointer ${selectedTrade?.id === trade.id ? "bg-zinc-900" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-zinc-500 font-mono">
                      #{trade.id}
                      {trade.status === 'open' && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-400" title="Open trade"></span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{trade.symbol}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        trade.direction === "Long" ? "text-green-500" : "text-pink-500"
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{trade.entry_time.slice(0, 16)}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{dayName}</td>
                    <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{trade.exit_time ? trade.exit_time.slice(0, 16) : "—"}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{duration(trade.duration_hours)}</td>
                    <td className="px-4 py-2.5 text-zinc-400 text-right tabular-nums">{price(trade.entry_price)}</td>
                    <td className="px-4 py-2.5 text-zinc-400 text-right tabular-nums">{price(trade.exit_price)}</td>
                    <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${isClosed(trade) ? pnlClass(trade.pnl) : "text-zinc-400"}`}>
                      {isClosed(trade) ? usd(trade.pnl, { signed: true }) : "Open"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-400 tabular-nums">{rMultiple(trade.r_multiple)}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center text-zinc-500">
              No trades match the current filters.
            </div>
          )}
        </div>

        {/* Pagination & Stats */}
        {sortedTrades.length > 0 && (
          <div className="p-4 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm">
              <span className="text-zinc-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTrades.length)} of {sortedTrades.length}
              </span>
              <div className="h-4 w-px bg-zinc-700 hidden md:block"></div>
              <div className="flex items-center gap-3 text-zinc-300">
                <span>{closed.length} closed</span>
                <span>W {wins}</span>
                <span>L {closed.length - wins}</span>
                <span className="font-semibold text-white ml-1">
                  {pct(closed.length > 0 ? (wins / closed.length) * 100 : 0)} win rate
                </span>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-out / Side Panel for Selected Trade */}
      {selectedTrade && (
        <div className="w-full xl:w-[600px] shrink-0 border border-zinc-800/70 rounded-xl flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Trade #{selectedTrade.id}</h3>
              <p className="text-sm text-zinc-400">{selectedTrade.symbol} • {selectedTrade.entry_time.split(" ")[0]}</p>
            </div>
            <button onClick={() => setSelectedTrade(null)} className="text-zinc-500 hover:text-white transition-colors">
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Chart Area */}
            <div className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <ExecutionChart trade={selectedTrade} />
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                selectedTrade.direction === "Long" ? "text-green-500" : "text-pink-500"
              }`}>
                {selectedTrade.direction}
              </span>
              <span className={`text-xl font-bold tabular-nums ${isClosed(selectedTrade) ? pnlClass(selectedTrade.pnl) : "text-zinc-400"}`}>
                {isClosed(selectedTrade) ? usd(selectedTrade.pnl, { signed: true }) : "Open"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 mb-1">Entry Price</div>
                <div className="text-white tabular-nums">{price(selectedTrade.entry_price)}</div>
                <div className="text-xs text-zinc-600 mt-1">{selectedTrade.entry_time.slice(0, 16)}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Exit Price</div>
                <div className="text-white tabular-nums">{price(selectedTrade.exit_price)}</div>
                <div className="text-xs text-zinc-600 mt-1">{selectedTrade.exit_time ? selectedTrade.exit_time.slice(0, 16) : "Open"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <div className="col-span-2 mb-2 pb-2 border-b border-zinc-800/50">
                <div className="text-zinc-500 mb-1">Trigger Reason</div>
                <div className="font-medium text-white">{selectedTrade.trigger_reason || "-"}</div>
              </div>
              {selectedTrade.status === "closed" && (
                <div className="col-span-2 mb-2 pb-2 border-b border-zinc-800/50">
                  <div className="text-zinc-500 mb-1">Exit Reason</div>
                  <div className="font-medium text-white">{selectedTrade.exit_reason || "-"}</div>
                </div>
              )}
              {(selectedTrade.sl != null || selectedTrade.tp != null) && (
                <>
                  <div>
                    <div className="text-zinc-500 mb-1">Stop Loss</div>
                    <div className="text-white tabular-nums">{price(selectedTrade.sl)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Take Profit</div>
                    <div className="text-white tabular-nums">{price(selectedTrade.tp)}</div>
                  </div>
                </>
              )}
              <div>
                <div className="text-zinc-500 mb-1">Duration</div>
                <div className="font-medium text-white">{duration(selectedTrade.duration_hours)}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">R-Multiple</div>
                <div className="font-medium text-white tabular-nums">{rMultiple(selectedTrade.r_multiple)}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Favourable</div>
                <div className="font-medium text-green-500">{selectedTrade.mfe_pips != null ? `+${selectedTrade.mfe_pips.toFixed(1)} pips` : "—"}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Adverse</div>
                <div className="font-medium text-pink-500">{selectedTrade.mae_pips != null ? `\u2212${selectedTrade.mae_pips.toFixed(1)} pips` : "—"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Setup
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-white">
                  {selectedTrade.setup || "No setup tagged"}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Journal Notes</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-white h-24 outline-none focus:border-zinc-600 transition-colors resize-none"
                  placeholder="Write your reflections here..."
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                />
                <button onClick={saveNotes} className="mt-2 w-full bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium py-2 rounded-md transition-colors">
                  {notesSaved ? "Saved (this browser)" : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
