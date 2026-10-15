"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export default function Dashboard() {
  const { rawTrades, filteredTrades, isLoading } = useData();

  const data = useMemo(() => {
    // Metrics
    const total_trades = filteredTrades.length;
    const winning_trades = filteredTrades.filter(t => t.is_win).length;
    const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0;
    const total_pnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const gross_profit = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const gross_loss = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profit_factor = gross_loss > 0 ? gross_profit / gross_loss : 0;

    // Equity Curve
    let current_equity = 25000.0;
    const equityMap = new Map();
    [...filteredTrades]
      .filter(t => t.exit_time)
      .sort((a, b) => new Date(a.exit_time as string).getTime() - new Date(b.exit_time as string).getTime())
      .forEach(t => {
      current_equity += t.pnl;
      const date = (t.exit_time as string).split(" ")[0];
      equityMap.set(date, current_equity);
    });
    const equityCurve = Array.from(equityMap.entries()).map(([date, equity]) => ({ date, equity: Math.round((equity as number) * 100) / 100 }));

    // Max drawdown ($, peak-to-trough on closed-trade equity)
    let peak = 25000.0;
    let max_drawdown = 0;
    let running = 25000.0;
    [...filteredTrades]
      .filter(t => t.exit_time)
      .sort((a, b) => new Date(a.exit_time as string).getTime() - new Date(b.exit_time as string).getTime())
      .forEach(t => {
        running += t.pnl;
        peak = Math.max(peak, running);
        max_drawdown = Math.max(max_drawdown, peak - running);
      });

    // Calculate split offset for Equity Curve
    const maxEq = Math.max(...equityCurve.map(i => i.equity), 25000);
    const minEq = Math.min(...equityCurve.map(i => i.equity), 25000);
    let equityOff = 0;
    if (maxEq <= 25000) {
      equityOff = 1;
    } else if (minEq >= 25000) {
      equityOff = 0;
    } else {
      equityOff = (maxEq - 25000) / (maxEq - minEq);
    }

    return {
      metrics: { total_trades, win_rate, total_pnl, profit_factor, max_drawdown },
      equityCurve,
      equityOff
    };
  }, [filteredTrades]);

  const now = new Date();
  const currentOrRecentTrades = useMemo(() => {
    return rawTrades.filter(t => {
      if (t.status === "open") return true;
      if (t.status === "closed" && t.exit_time) {
        const exitDate = new Date((t.exit_time as string).replace(" ", "T"));
        const diffHours = (now.getTime() - exitDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48; // closed within 2 days
      }
      return false;
    }).sort((a, b) => {
      if (a.status === "open" && b.status !== "open") return -1;
      if (a.status !== "open" && b.status === "open") return 1;
      return new Date(b.entry_time.replace(" ", "T")).getTime() - new Date(a.entry_time.replace(" ", "T")).getTime();
    });
  }, [rawTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading data...</div>;
  }

  const { metrics, equityCurve, equityOff } = data;

  return (
    <div className="space-y-8 pb-8">
      {/* Current / Recent Trades */}
      {currentOrRecentTrades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Current & Recent Trades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentOrRecentTrades.map(trade => (
              <div key={trade.id} className={`p-6 rounded-xl border ${trade.status === 'open' ? 'bg-zinc-900 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-zinc-900/80 border-zinc-800'} flex flex-col gap-4`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-white">{trade.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-500/20 text-green-500' : 'bg-pink-500/20 text-pink-500'}`}>{trade.direction}</span>
                  </div>
                  {trade.status === 'open' ? (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> Open</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">Closed</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-zinc-500 mb-1">Entry Price</div>
                    <div className="font-medium text-white">{trade.entry_price}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Entry Date (broker)</div>
                    <div className="font-medium text-white">{trade.entry_time}</div>
                  </div>
                  {trade.sl != null && (
                    <div>
                      <div className="text-zinc-500 mb-1">Stop Loss</div>
                      <div className="font-medium text-pink-400">{trade.sl}</div>
                    </div>
                  )}
                  {trade.tp != null && (
                    <div>
                      <div className="text-zinc-500 mb-1">Take Profit</div>
                      <div className="font-medium text-green-400">{trade.tp}</div>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-950 p-4 rounded-lg text-sm border border-zinc-800/50">
                  <div className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Trigger Reason</div>
                  <div className="text-zinc-300">{trade.trigger_reason || trade.setup || "System execution"}</div>
                </div>

                {trade.status === 'closed' && (
                  <div className="bg-zinc-950 p-4 rounded-lg text-sm border border-zinc-800/50 flex flex-col h-full">
                    <div className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Exit Reason</div>
                    <div className="text-zinc-300 flex-1">{trade.exit_reason || "Position closed."}</div>
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-zinc-800/50">
                      <span className="text-zinc-500 text-xs uppercase tracking-wider">Final P&L</span>
                      <span className={`font-bold ${trade.pnl > 0 ? 'text-green-500' : 'text-pink-500'}`}>${trade.pnl.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Net P&L" 
          value={`$${metrics.total_pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          trend={metrics.total_pnl >= 0 ? "positive" : "negative"}
        />
        <MetricCard 
          title="Win Rate" 
          value={`${metrics.win_rate.toFixed(1)}%`}
          sub={`${metrics.total_trades.toLocaleString()} trades`}
        />
        <MetricCard 
          title="Profit Factor" 
          value={metrics.profit_factor.toFixed(2)}
        />
        <MetricCard 
          title="Max Drawdown" 
          value={`-$${metrics.max_drawdown.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          trend={metrics.max_drawdown > 0 ? "negative" : undefined}
        />
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Equity Curve</h2>
        <div className="h-80 w-full">
          {equityCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurve} margin={{ top: 10, right: 0, left: 30, bottom: 0 }}>
                <defs>
                  <linearGradient id="strokeEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={equityOff} stopColor="#22c55e" stopOpacity={1}/>
                    <stop offset={equityOff} stopColor="#ec4899" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#d4d4d8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#d4d4d8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[minEq => Math.min(minEq, 25000), maxEq => Math.max(maxEq, 25000)]}
                  tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <ReferenceLine 
                  y={25000} 
                  stroke="#52525b" 
                  strokeDasharray="3 3" 
                  label={{ position: 'left', value: 'Start', fill: '#a1a1aa', fontSize: 12 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="url(#strokeEquity)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">No data available for these filters</div>
          )}
        </div>
      </div>

    </div>
  );
}

function MetricCard({ title, value, trend, sub }: { title: string, value: string, trend?: "positive" | "negative", sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      </div>
      <div>
        <div className={`text-3xl font-bold ${
          trend === "positive" ? "text-green-500" : trend === "negative" ? "text-pink-500" : "text-white"
        }`}>
          {value}
        </div>
        {sub && <div className="text-sm text-zinc-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
