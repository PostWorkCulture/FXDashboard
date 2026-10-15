"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import { STARTING_BALANCE, usd, pct, price, pnlClass } from "@/lib/format";
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

const toTime = (s: string | null | undefined) => (s ? new Date(s.replace(" ", "T")).getTime() : 0);

export default function Dashboard() {
  const { rawTrades, closedTrades, isLoading } = useData();

  const data = useMemo(() => {
    // Metrics (closed trades only — open positions have no result yet)
    const total_trades = closedTrades.length;
    const winning_trades = closedTrades.filter(t => t.pnl > 0).length;
    const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0;
    const total_pnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);

    const gross_profit = closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const gross_loss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profit_factor = gross_loss > 0 ? gross_profit / gross_loss : 0;

    // Equity curve and max drawdown (peak-to-trough on closed-trade equity)
    const byExit = [...closedTrades].sort((a, b) => toTime(a.exit_time) - toTime(b.exit_time));
    let equity = STARTING_BALANCE;
    let peak = STARTING_BALANCE;
    let max_dd_usd = 0;
    let max_dd_pct = 0;
    const equityMap = new Map<string, number>();
    byExit.forEach(t => {
      equity += t.pnl;
      peak = Math.max(peak, equity);
      max_dd_usd = Math.max(max_dd_usd, peak - equity);
      max_dd_pct = Math.max(max_dd_pct, ((peak - equity) / peak) * 100);
      equityMap.set((t.exit_time as string).split(" ")[0], equity);
    });
    const equityCurve = Array.from(equityMap.entries()).map(([date, eq]) => ({ date, equity: Math.round(eq) }));

    // Split point for the two-colour (above/below start) line
    const maxEq = Math.max(...equityCurve.map(i => i.equity), STARTING_BALANCE);
    const minEq = Math.min(...equityCurve.map(i => i.equity), STARTING_BALANCE);
    const equityOff = maxEq <= STARTING_BALANCE ? 1 : minEq >= STARTING_BALANCE ? 0 : (maxEq - STARTING_BALANCE) / (maxEq - minEq);

    return {
      metrics: { total_trades, win_rate, total_pnl, profit_factor, max_dd_usd, max_dd_pct, return_pct: (total_pnl / STARTING_BALANCE) * 100 },
      equityCurve,
      equityOff
    };
  }, [closedTrades]);

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
                    <div className="font-medium text-white tabular-nums">{price(trade.entry_price)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Entry Date (broker)</div>
                    <div className="font-medium text-white tabular-nums">{trade.entry_time.slice(0, 16)}</div>
                  </div>
                  {trade.sl != null && (
                    <div>
                      <div className="text-zinc-500 mb-1">Stop Loss</div>
                      <div className="font-medium text-pink-400 tabular-nums">{price(trade.sl)}</div>
                    </div>
                  )}
                  {trade.tp != null && (
                    <div>
                      <div className="text-zinc-500 mb-1">Take Profit</div>
                      <div className="font-medium text-green-400 tabular-nums">{price(trade.tp)}</div>
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
                      <span className={`font-bold tabular-nums ${pnlClass(trade.pnl)}`}>{usd(trade.pnl, { signed: true })}</span>
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
          value={usd(metrics.total_pnl, { signed: true })}
          sub={`${pct(metrics.return_pct, { signed: true })} on ${usd(STARTING_BALANCE)}`}
          trend={metrics.total_pnl > 0 ? "positive" : metrics.total_pnl < 0 ? "negative" : undefined}
        />
        <MetricCard 
          title="Win Rate" 
          value={metrics.total_trades > 0 ? pct(metrics.win_rate) : "—"}
          sub={`${metrics.total_trades.toLocaleString("en-GB")} closed ${metrics.total_trades === 1 ? "trade" : "trades"}`}
        />
        <MetricCard 
          title="Profit Factor" 
          value={metrics.profit_factor > 0 ? metrics.profit_factor.toFixed(2) : "—"}
        />
        <MetricCard 
          title="Max Drawdown" 
          value={metrics.total_trades > 0 ? pct(-metrics.max_dd_pct) : "—"}
          sub={metrics.max_dd_usd > 0 ? `${usd(-metrics.max_dd_usd)} peak to trough` : undefined}
          trend={metrics.max_dd_pct > 0 ? "negative" : undefined}
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
                  domain={[(min: number) => Math.min(min, STARTING_BALANCE), (max: number) => Math.max(max, STARTING_BALANCE)]}
                  tickFormatter={(value) => usd(value)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(value: any) => [usd(value), "Equity"]}
                />
                <ReferenceLine 
                  y={STARTING_BALANCE} 
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
            <div className="flex h-full items-center justify-center text-zinc-500">{closedTrades.length === 0 ? "No closed trades yet" : "No data available for these filters"}</div>
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
        <div className={`text-3xl font-bold tabular-nums ${
          trend === "positive" ? "text-green-500" : trend === "negative" ? "text-pink-500" : "text-white"
        }`}>
          {value}
        </div>
        {sub && <div className="text-sm text-zinc-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
