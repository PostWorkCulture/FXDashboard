"use client";

import { useData } from "@/lib/data-context";
import { useMemo } from "react";
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
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";

export default function ReportsPage() {
  const { filteredTrades, isLoading } = useData();

  const data = useMemo(() => {
    if (filteredTrades.length === 0) return null;

    // Drawdown Calculation
    let current_equity = 10000.0;
    let peak_equity = 10000.0;
    const drawdownCurve: any[] = [];
    
    [...filteredTrades].sort((a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime()).forEach(t => {
      current_equity += t.pnl;
      if (current_equity > peak_equity) {
        peak_equity = current_equity;
      }
      const drawdown = peak_equity > 0 ? ((current_equity - peak_equity) / peak_equity) * 100 : 0;
      
      const date = t.exit_time.split(" ")[0];
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
    const longWin = longs.length > 0 ? (longs.filter(t => t.is_win).length / longs.length) * 100 : 0;
    const shortWin = shorts.length > 0 ? (shorts.filter(t => t.is_win).length / shorts.length) * 100 : 0;
    
    const winRateData = [
      { name: "Longs", winRate: Number(longWin.toFixed(1)) },
      { name: "Shorts", winRate: Number(shortWin.toFixed(1)) }
    ];

    // Execution Efficiency (MFE vs PNL)
    const scatterData = filteredTrades.map(t => ({
      pnl: t.pnl,
      mfe: t.mfe_pips || 0,
      mae: t.mae_pips || 0,
      r_multiple: t.r_multiple || 0,
      id: t.id
    })).filter(t => t.mfe !== 0 || t.mae !== 0);

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

    return { drawdownCurve, hourlyBreakdown, winRateData, scatterData, tradesPerMonth };
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading reports...</div>;
  }

  if (!data) {
    return <div className="flex h-full items-center justify-center text-zinc-500">No data available to generate reports.</div>;
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Trades Per Month Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Trades Taken per Month</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tradesPerMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                cursor={{fill: '#27272a'}}
              />
              <Bar dataKey="trades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hourly Performance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">P&L by Hour of Day</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" stroke="#d4d4d8" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  cursor={{fill: '#27272a'}}
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {data.hourlyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ec4899'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Side */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Win Rate by Side (%)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.winRateData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  cursor={{fill: '#27272a'}}
                  formatter={(value: any) => `${value}%`}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={40}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Execution Efficiency */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Execution Efficiency (MFE vs Net P&L)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" dataKey="mfe" name="MFE (pips)" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="pnl" name="PnL ($)" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
              <ZAxis type="number" range={[40, 40]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }} 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                formatter={(value: any, name: any) => name === "PnL ($)" ? `$${value.toFixed(2)}` : `${value.toFixed(1)} pips`}
              />
              <Scatter name="Trades" data={data.scatterData} fill="#3b82f6" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Drawdown (%)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.drawdownCurve} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#ec4899' }}
                formatter={(value: any) => `${value}%`}
              />
              <Area type="monotone" dataKey="drawdown" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorDd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
