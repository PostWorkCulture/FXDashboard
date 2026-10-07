"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/lib/data-context";
import { 
  BarChart3, 
  Target, 
  Activity,
  Wallet,
  ClipboardCheck
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  Legend
} from "recharts";
import { useRouter } from "next/navigation";

const COLORS = ['#22c55e', '#ec4899', '#3b82f6', '#f59e0b', '#8b5cf6'];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Dashboard() {
  const { rawTrades, filteredTrades, isLoading, filters, setFilters } = useData();
  const router = useRouter();

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
    let current_equity = 10000.0;
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

    // Breakdowns
    const long_pnl = filteredTrades.filter(t => t.direction === "Long").reduce((sum, t) => sum + t.pnl, 0);
    const short_pnl = filteredTrades.filter(t => t.direction === "Short").reduce((sum, t) => sum + t.pnl, 0);
    const directionBreakdown = [
      { name: "Long", value: Math.max(long_pnl, 0) }, // Pie charts need positive values for slice size, but wait PNL can be negative. 
      // Actually TradeZella uses absolute values for volume or win counts for pies, or just filters. 
      // Let's use Win/Loss counts for the pie to avoid negative slice issues, or just Profit vs Loss.
    ];

    // Win Rate by Side (%)
    const long_trades = filteredTrades.filter(t => t.direction === "Long");
    const short_trades = filteredTrades.filter(t => t.direction === "Short");
    const long_win_rate = long_trades.length > 0 ? (long_trades.filter(t => t.pnl > 0).length / long_trades.length) * 100 : 0;
    const short_win_rate = short_trades.length > 0 ? (short_trades.filter(t => t.pnl > 0).length / short_trades.length) * 100 : 0;
    const sideWinRateBreakdown = [
      { name: "Long", value: Math.round(long_win_rate), fill: "#22c55e" },
      { name: "Short", value: Math.round(short_win_rate), fill: "#ec4899" }
    ];

    // Day of Week PNL
    const dowPnl = [0, 0, 0, 0, 0, 0, 0];
    filteredTrades.forEach(t => {
      const entryDate = new Date(t.entry_time.replace(" ", "T"));
      const jsDay = entryDate.getDay();
      const adjustedDay = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun
      dowPnl[adjustedDay] += t.pnl;
    });
    
    // We want to return all 7 days so they can be clicked
    const dowBreakdown = dowPnl.map((pnl, i) => ({ name: DAYS[i], pnl: pnl, dayIndex: i }));

    // Calculate split offset for Equity Curve
    const maxEq = Math.max(...equityCurve.map(i => i.equity), 10000);
    const minEq = Math.min(...equityCurve.map(i => i.equity), 10000);
    let equityOff = 0;
    if (maxEq <= 10000) {
      equityOff = 1;
    } else if (minEq >= 10000) {
      equityOff = 0;
    } else {
      equityOff = (maxEq - 10000) / (maxEq - minEq);
    }

    return {
      metrics: { total_trades, win_rate, total_pnl, profit_factor },
      equityCurve,
      equityOff,
      sideWinRateBreakdown,
      dowBreakdown
    };
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading data...</div>;
  }

  const { metrics, equityCurve, equityOff, sideWinRateBreakdown, dowBreakdown } = data;

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      if (payload.dayIndex !== undefined) {
        setFilters(f => ({ ...f, dayOfWeek: payload.dayIndex }));
        router.push("/trades");
      }
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.name) {
      setFilters(f => ({ ...f, direction: data.name }));
      router.push("/trades");
    }
  };

  const now = new Date();
  const currentOrRecentTrades = useMemo(() => {
    return rawTrades.filter(t => {
      if (t.status === "open") return true;
      if (t.status === "closed" && t.exit_time) {
        const exitDate = new Date(t.exit_time.replace(" ", "T"));
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
                    <div className="text-zinc-500 mb-1">Entry Date</div>
                    <div className="font-medium text-white">{trade.entry_time}</div>
                  </div>
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
        />
        <MetricCard 
          title="Profit Factor" 
          value={metrics.profit_factor.toFixed(2)}
        />
        <MetricCard 
          title="Total Trades" 
          value={metrics.total_trades.toString()}
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
                  domain={[minEq => Math.min(minEq, 10000), maxEq => Math.max(maxEq, 10000)]}
                  tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <ReferenceLine 
                  y={10000} 
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

      {/* Trades Link */}
      <Link href="/trades" className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Trades</h3>
            <p className="text-sm text-zinc-400">View detailed trade log and execution data</p>
          </div>
        </div>
        <div className="text-zinc-500 group-hover:text-white transition-colors px-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </Link>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Long vs Short Pie Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Win Rate by Side (%)</h2>
          </div>
          <div className="h-64 w-full">
            {sideWinRateBreakdown.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sideWinRateBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={6}
                    cornerRadius={6}
                    stroke="none"
                    dataKey="value"
                  >
                    {sideWinRateBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill} 
                        stroke="none"
                        opacity={filters.direction === "All" || filters.direction === entry.name ? 1 : 0.3}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#d4d4d8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">No data</div>
            )}
          </div>
        </div>

        {/* Day of Week Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">P&L by Entry Day</h2>
          </div>
          <div className="h-64 w-full">
            {dowBreakdown.some(d => d.pnl !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    cursor={{fill: '#27272a'}}
                    formatter={(value: any) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {dowBreakdown.map((entry, index) => {
                      const isActive = filters.dayOfWeek === null || filters.dayOfWeek === entry.dayIndex;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.pnl >= 0 ? '#22c55e' : '#ec4899'} 
                          opacity={isActive ? 1 : 0.3}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend }: { title: string, value: string, trend?: "positive" | "negative" }) {
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
      </div>
    </div>
  );
}
