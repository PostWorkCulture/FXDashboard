"use client";

import { useData } from "@/lib/data-context";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExecutionChart } from "@/components/ExecutionChart";

export default function TradesPage() {
  const { filteredTrades, isLoading, filters, setFilters } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const itemsPerPage = 20;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading trades...</div>;
  }

  // Sort descending by entry time (newest first)
  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime());

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
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Trades ({sortedTrades.length} records)</h2>
        </div>
        
        <div className="overflow-x-auto flex-1">
          {sortedTrades.length > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium align-top">Trades</th>
                  <th className="px-6 py-4 font-medium">
                    <div className="flex flex-col gap-2">
                      <span>Symbol</span>
                      <select 
                        className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-1 text-zinc-300 outline-none w-24"
                        value={filters.symbol}
                        onChange={(e) => setFilters(f => ({ ...f, symbol: e.target.value }))}
                      >
                        <option value="All">All</option>
                        <option value="EURUSD">EURUSD</option>
                        <option value="GBPUSD">GBPUSD</option>
                        <option value="AUDUSD">AUDUSD</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium">
                    <div className="flex flex-col gap-2">
                      <span>Side</span>
                      <select 
                        className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-1 text-zinc-300 outline-none w-24"
                        value={filters.direction}
                        onChange={(e) => setFilters(f => ({ ...f, direction: e.target.value }))}
                      >
                        <option value="All">All</option>
                        <option value="Long">Long</option>
                        <option value="Short">Short</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium">
                    <div className="flex flex-col gap-2">
                      <span>Entry</span>
                      <select 
                        className="bg-zinc-800 border border-zinc-700 text-xs rounded px-2 py-1 text-zinc-300 outline-none w-28"
                        value={filters.dateRange}
                        onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
                      >
                        <option value="All">All</option>
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Last Month">Last Month</option>
                        <option value="This Year">This Year</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium align-top">Exit</th>
                  <th className="px-6 py-4 font-medium align-top">Duration</th>
                  <th className="px-6 py-4 font-medium align-top">Entry £</th>
                  <th className="px-6 py-4 font-medium align-top">Exit £</th>
                  <th className="px-6 py-4 font-medium text-right align-top">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {currentTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    onClick={() => setSelectedTrade(trade)}
                    className={`hover:bg-zinc-800/50 transition-colors cursor-pointer ${selectedTrade?.id === trade.id ? "bg-zinc-800/80" : ""}`}
                  >
                    <td className="px-6 py-4 text-zinc-500 font-mono">
                      #{trade.id}
                      {trade.status === 'open' && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Open Trade"></span>}
                    </td>
                    <td className="px-6 py-4 font-medium">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        trade.direction === "Long" ? "bg-green-500/10 text-green-500" : "bg-pink-500/10 text-pink-500"
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{trade.entry_time.split(".")[0]}</td>
                    <td className="px-6 py-4 text-zinc-400">{trade.exit_time ? trade.exit_time.split(".")[0] : "-"}</td>
                    <td className="px-6 py-4 text-zinc-400">
                      {trade.duration_hours ? (
                        trade.duration_hours >= 24 
                          ? `${Math.floor(trade.duration_hours/24)}d ${trade.duration_hours%24}h` 
                          : `${trade.duration_hours}h`
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{trade.entry_price.toFixed(5)}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{trade.exit_price ? trade.exit_price.toFixed(5) : "-"}</td>
                    <td className={`px-6 py-4 text-right font-medium font-mono ${
                      trade.pnl >= 0 ? "text-green-500" : "text-pink-500"
                    }`}>
                      {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
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

        {/* Pagination & Stats */}
        {sortedTrades.length > 0 && (
          <div className="p-4 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between bg-zinc-900/50 gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm">
              <span className="text-zinc-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTrades.length)} of {sortedTrades.length}
              </span>
              <div className="h-4 w-px bg-zinc-700 hidden md:block"></div>
              <div className="flex items-center gap-3 text-zinc-300">
                <span className="font-medium">Total: {sortedTrades.length}</span>
                <span className="text-green-400">W: {sortedTrades.filter(t => t.pnl > 0).length}</span>
                <span className="text-pink-400">L: {sortedTrades.filter(t => t.pnl <= 0).length}</span>
                <span className="font-semibold text-white ml-1">
                  {sortedTrades.length > 0 ? (sortedTrades.filter(t => t.pnl > 0).length / sortedTrades.length * 100).toFixed(1) : "0.0"}% Win
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
              <ExecutionChart trade={selectedTrade} />
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                selectedTrade.direction === "Long" ? "bg-green-500/20 text-green-400" : "bg-pink-500/20 text-pink-400"
              }`}>
                {selectedTrade.direction}
              </span>
              <span className={`text-xl font-bold font-mono ${selectedTrade.pnl >= 0 ? "text-green-500" : "text-pink-500"}`}>
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
                <div className="font-mono text-white">{selectedTrade.exit_price ? selectedTrade.exit_price.toFixed(5) : "-"}</div>
                <div className="text-xs text-zinc-600 mt-1">{selectedTrade.exit_time ? selectedTrade.exit_time.split(" ")[1].split(".")[0] : "Open"}</div>
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
              <div>
                <div className="text-zinc-500 mb-1">Duration</div>
                <div className="font-medium text-white">
                  {selectedTrade.duration_hours ? (
                    selectedTrade.duration_hours >= 24 
                      ? `${Math.floor(selectedTrade.duration_hours/24)}d ${selectedTrade.duration_hours%24}h` 
                      : `${selectedTrade.duration_hours}h`
                  ) : "-"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">R-Multiple</div>
                <div className="font-medium text-white">{selectedTrade.r_multiple?.toFixed(2) || "-"}R</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Favorable</div>
                <div className="font-medium text-green-500">{selectedTrade.mfe_pips ? `+${selectedTrade.mfe_pips.toFixed(1)}` : "-"} pips</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Max Adverse</div>
                <div className="font-medium text-pink-500">{selectedTrade.mae_pips ? `-${selectedTrade.mae_pips.toFixed(1)}` : "-"} pips</div>
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
