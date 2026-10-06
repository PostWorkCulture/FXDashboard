"use client";

import { useData } from "@/lib/data-context";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExecutionChart } from "@/components/ExecutionChart";

export default function TradesPage() {
  const { filteredTrades, ohlcv, isLoading } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const itemsPerPage = 20;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading trades...</div>;
  }

  // Sort descending by exit time
  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(b.exit_time).getTime() - new Date(a.exit_time).getTime());

  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTrades = sortedTrades.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full pb-8">
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Trade Log ({sortedTrades.length} records)</h2>
        </div>
        
        <div className="overflow-x-auto flex-1">
          {sortedTrades.length > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Trade ID</th>
                  <th className="px-6 py-4 font-medium">Symbol</th>
                  <th className="px-6 py-4 font-medium">Side</th>
                  <th className="px-6 py-4 font-medium">Entry Date</th>
                  <th className="px-6 py-4 font-medium">Exit Date</th>
                  <th className="px-6 py-4 font-medium">Entry Price</th>
                  <th className="px-6 py-4 font-medium">Exit Price</th>
                  <th className="px-6 py-4 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {currentTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    onClick={() => setSelectedTrade(trade)}
                    className={`hover:bg-zinc-800/50 transition-colors cursor-pointer ${selectedTrade?.id === trade.id ? "bg-zinc-800/80" : ""}`}
                  >
                    <td className="px-6 py-4 text-zinc-500 font-mono">#{trade.id}</td>
                    <td className="px-6 py-4 font-medium">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        trade.direction === "Long" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{trade.entry_time.split(".")[0]}</td>
                    <td className="px-6 py-4 text-zinc-400">{trade.exit_time.split(".")[0]}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{trade.entry_price.toFixed(5)}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{trade.exit_price.toFixed(5)}</td>
                    <td className={`px-6 py-4 text-right font-medium font-mono ${
                      trade.is_win ? "text-green-500" : "text-red-500"
                    }`}>
                      {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center text-zinc-500">
              No trades match the current filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <span className="text-sm text-zinc-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTrades.length)} of {sortedTrades.length} trades
            </span>
            <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Slide-out / Side Panel for Selected Trade */}
      {selectedTrade && (
        <div className="w-full xl:w-[600px] shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-300">
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
              <ExecutionChart trade={selectedTrade} ohlcv={ohlcv} />
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                selectedTrade.direction === "Long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {selectedTrade.direction}
              </span>
              <span className={`text-xl font-bold font-mono ${selectedTrade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {selectedTrade.pnl >= 0 ? "+" : ""}${selectedTrade.pnl.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 mb-1">Entry Price</div>
                <div className="font-mono text-white">{selectedTrade.entry_price.toFixed(5)}</div>
                <div className="text-xs text-zinc-600 mt-1">{selectedTrade.entry_time.split(" ")[1].split(".")[0]}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Exit Price</div>
                <div className="font-mono text-white">{selectedTrade.exit_price.toFixed(5)}</div>
                <div className="text-xs text-zinc-600 mt-1">{selectedTrade.exit_time.split(" ")[1].split(".")[0]}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <div>
                <div className="text-zinc-500 mb-1">Duration</div>
                <div className="font-medium text-white">{selectedTrade.duration_hours?.toFixed(1) || "-"} hrs</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">R-Multiple</div>
                <div className="font-medium text-white">{selectedTrade.r_multiple?.toFixed(2) || "-"}R</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Favorable</div>
                <div className="font-medium text-green-500">+{selectedTrade.mfe_pips?.toFixed(1) || "-"} pips</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Adverse</div>
                <div className="font-medium text-red-500">-{selectedTrade.mae_pips?.toFixed(1) || "-"} pips</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Setup / Playbook</span>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded bg-zinc-800 border-zinc-700" defaultChecked />
                    <span className="text-zinc-400 normal-case">Rules Followed</span>
                  </div>
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
                  defaultValue={selectedTrade.notes || ""}
                />
                <button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md transition-colors">
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
