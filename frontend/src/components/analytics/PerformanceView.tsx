"use client";

import { useData } from "@/lib/data-context";
import { STARTING_BALANCE, usd, pct } from "@/lib/format";
import { MonthlyReturns } from "@/components/analytics/MonthlyReturns";
import { TradeQuality } from "@/components/analytics/TradeQuality";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  
  
  
} from "recharts";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PerformanceView({ onPickMonth }: { onPickMonth?: (year: number, month: number) => void } = {}) {
  const { closedTrades: filteredTrades, isLoading, filters, setFilters } = useData();
  const router = useRouter();

  const data = useMemo(() => {
    if (filteredTrades.length === 0) return null;

    // Drawdown Calculation
    let current_equity = STARTING_BALANCE;
    let peak_equity = STARTING_BALANCE;
    const drawdownCurve: any[] = [];
    
    [...filteredTrades]
      .filter(t => t.exit_time)
      .sort((a, b) => new Date(a.exit_time as string).getTime() - new Date(b.exit_time as string).getTime())
      .forEach(t => {
      current_equity += t.pnl;
      if (current_equity > peak_equity) {
        peak_equity = current_equity;
      }
      const drawdown = peak_equity > 0 ? ((current_equity - peak_equity) / peak_equity) * 100 : 0;
      
      const date = (t.exit_time as string).split(" ")[0];
      // Only keep max drawdown for a day to smooth the chart
      const existing = drawdownCurve.find(d => d.date === date);
      if (existing) {
        existing.drawdown = Math.min(existing.drawdown, drawdown);
      } else {
        drawdownCurve.push({ date, drawdown: Number(drawdown.toFixed(2)) });
      }
    });

    // Hourly Performance (By Entry Time)
    const hourlyPnl = new Array(24).fill(0);
    filteredTrades.forEach(t => {
      const date = new Date(t.entry_time.replace(" ", "T"));
      const hour = date.getHours();
      hourlyPnl[hour] += t.pnl;
    });
    const hourlyBreakdown = hourlyPnl.map((pnl, h) => ({ hour: `${h.toString().padStart(2, '0')}:00`, pnl }));

    // Win Rate by Side
    const longs = filteredTrades.filter(t => t.direction === "Long");
    const shorts = filteredTrades.filter(t => t.direction === "Short");
    const longWin = longs.length > 0 ? (longs.filter(t => t.pnl > 0).length / longs.length) * 100 : 0;
    const shortWin = shorts.length > 0 ? (shorts.filter(t => t.pnl > 0).length / shorts.length) * 100 : 0;
    
    const winRateData = [
      { name: "Longs", winRate: Number(longWin.toFixed(1)) },
      { name: "Shorts", winRate: Number(shortWin.toFixed(1)) }
    ];

    // Top 3 and Bottom 3 Trades
    const sortedByPnl = [...filteredTrades].sort((a, b) => b.pnl - a.pnl);
    const top3Trades = sortedByPnl.slice(0, 3);
    const bottom3Trades = [...sortedByPnl].reverse().slice(0, 3);

    // Trades Per Month
    const monthlyMap = new Map<string, number>();
    filteredTrades.forEach(t => {
      const monthStr = t.entry_time.substring(0, 7); // YYYY-MM
      monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + 1);
    });
    const tradesPerMonth = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => {
        // format YYYY-MM to short month name (e.g. Sep 26)
        const d = new Date(month + "-01");
        return {
          month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          trades: count
        };
      });

    // P&L by entry day (Mon-Sun)
    const dowPnl = [0, 0, 0, 0, 0, 0, 0];
    filteredTrades.forEach(t => {
      const jsDay = new Date(t.entry_time.replace(" ", "T")).getDay();
      dowPnl[jsDay === 0 ? 6 : jsDay - 1] += t.pnl;
    });
    const dowBreakdown = dowPnl.slice(0, 5).map((pnl, i) => ({ name: DAYS[i], pnl, dayIndex: i })); // FX trades Mon-Fri

    return { drawdownCurve, hourlyBreakdown, winRateData, top3Trades, bottom3Trades, tradesPerMonth, dowBreakdown };
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading reports...</div>;
  }

  if (!data) {
    return <div className="flex h-full items-center justify-center text-zinc-500">No data available to generate reports.</div>;
  }

  return (
    <div className="space-y-4 pb-8">
      <MonthlyReturns onPickMonth={onPickMonth} />


      {/* Trades Per Month Chart */}
      <div className="border border-zinc-800/70 rounded-xl p-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Trades per month</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tradesPerMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: 12 }}
                cursor={{fill: '#27272a'}}
              />
              <Bar dataKey="trades" fill="#52525b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hourly Performance */}
        <div className="border border-zinc-800/70 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">P&L by entry hour <span className="text-sm font-normal text-zinc-500">(broker time)</span></h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyBreakdown} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => usd(val)} width={64} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: 12 }}
                  cursor={{fill: '#27272a'}}
                  formatter={(value: any) => [usd(value, { signed: true }), "P&L"]}
                />
                <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                  {data.hourlyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ec4899'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P&L by entry day (click a bar to filter Trades) */}
        <div className="border border-zinc-800/70 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">P&L by entry day</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.dowBreakdown}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                onClick={(e: any) => {
                  const p = e?.activePayload?.[0]?.payload;
                  if (p?.dayIndex !== undefined) {
                    setFilters(f => ({ ...f, dayOfWeek: p.dayIndex }));
                    router.push("/trades");
                  }
                }}
              >
                <CartesianGrid stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => usd(val)} width={64} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: 12 }}
                  cursor={{ fill: '#27272a' }}
                  formatter={(value: any) => [usd(value, { signed: true }), "P&L"]}
                />
                <Bar dataKey="pnl" radius={[2, 2, 0, 0]} className="cursor-pointer">
                  {data.dowBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? '#22c55e' : '#ec4899'}
                      opacity={filters.dayOfWeek === null || filters.dayOfWeek === entry.dayIndex ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <TradeQuality />

      {/* Win Rate by Side + Top and Bottom Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Win Rate by Side */}
        <div className="border border-zinc-800/70 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Win rate by side</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.winRateData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid stroke="#1f1f23" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: 12 }}
                  cursor={{fill: '#27272a'}}
                  formatter={(value: any) => [pct(value), "Win rate"]}
                />
                <Bar dataKey="winRate" radius={[0, 2, 2, 0]} barSize={28}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#ec4899" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-zinc-800/70 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Best 3 trades</h2>
          <div className="divide-y divide-zinc-800/70">
            {data.top3Trades.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-white">{t.symbol} <span className="ml-1 text-zinc-500 tabular-nums">#{t.id}</span></div>
                  <div className="text-sm text-zinc-500">{t.entry_time.split(" ")[0]}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-500 tabular-nums">{usd(t.pnl, { signed: true })}</div>
                  <div className="text-xs text-zinc-500">{t.direction}</div>
                </div>
              </div>
            ))}
            {data.top3Trades.length === 0 && <div className="text-zinc-500">No trades taken</div>}
          </div>
        </div>

        <div className="border border-zinc-800/70 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Worst 3 trades</h2>
          <div className="divide-y divide-zinc-800/70">
            {data.bottom3Trades.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-white">{t.symbol} <span className="ml-1 text-zinc-500 tabular-nums">#{t.id}</span></div>
                  <div className="text-sm text-zinc-500">{t.entry_time.split(" ")[0]}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-pink-500 tabular-nums">{usd(t.pnl, { signed: true })}</div>
                  <div className="text-xs text-zinc-500">{t.direction}</div>
                </div>
              </div>
            ))}
            {data.bottom3Trades.length === 0 && <div className="text-zinc-500">No trades taken</div>}
          </div>
        </div>
      </div>

      {/* Drawdown Chart */}
      <div className="border border-zinc-800/70 rounded-xl p-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Drawdown</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.drawdownCurve} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => pct(val)} width={56} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: 12 }}
                itemStyle={{ color: '#e4e4e7' }}
                formatter={(value: any) => [pct(value), "Drawdown"]}
              />
              <Area type="monotone" dataKey="drawdown" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorDd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
