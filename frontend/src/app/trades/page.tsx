"use client";

import { useData } from "@/lib/data-context";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TradesPage() {
  const { filteredTrades, isLoading } = useData();
  const [currentPage, setCurrentPage] = useState(1);
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
    <div className="space-y-6 pb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
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
                  <tr key={trade.id} className="hover:bg-zinc-800/50 transition-colors">
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
    </div>
  );
}
