"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import { 
  BarChart3, 
  Target, 
  Activity,
  Wallet,
  ClipboardCheck
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Dashboard() {
  const { filteredTrades, isLoading, filters, setFilters } = useData();

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
    [...filteredTrades].sort((a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime()).forEach(t => {
      current_equity += t.pnl;
      const date = t.exit_time.split(" ")[0];
      equityMap.set(date, current_equity);
    });
    const equityCurve = Array.from(equityMap.entries()).map(([date, equity]) => ({ date, equity }));

    // Breakdowns
    const long_pnl = filteredTrades.filter(t => t.direction === "Long").reduce((sum, t) => sum + t.pnl, 0);
    const short_pnl = filteredTrades.filter(t => t.direction === "Short").reduce((sum, t) => sum + t.pnl, 0);
    const directionBreakdown = [
      { name: "Long", value: Math.max(long_pnl, 0) }, // Pie charts need positive values for slice size, but wait PNL can be negative. 
      // Actually TradeZella uses absolute values for volume or win counts for pies, or just filters. 
      // Let's use Win/Loss counts for the pie to avoid negative slice issues, or just Profit vs Loss.
    ];

    // Better Pie: Long vs Short Trade Volume (count)
    const long_count = filteredTrades.filter(t => t.direction === "Long").length;
    const short_count = filteredTrades.filter(t => t.direction === "Short").length;
    const sideCountBreakdown = [
      { name: "Long", value: long_count },
      { name: "Short", value: short_count }
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

    return {
      metrics: { total_trades, win_rate, total_pnl, profit_factor },
      equityCurve,
      sideCountBreakdown,
      dowBreakdown
    };
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Loading data...</div>;
  }

  const { metrics, equityCurve, sideCountBreakdown, dowBreakdown } = data;

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      if (payload.dayIndex !== undefined) {
        // Toggle day filter
        setFilters(f => ({
          ...f,
          dayOfWeek: f.dayOfWeek === payload.dayIndex ? null : payload.dayIndex
        }));
      }
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.name) {
      // Toggle side filter
      setFilters(f => ({
        ...f,
        direction: f.direction === data.name ? "All" : data.name
      }));
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard 
          title="Net P&L" 
          value={`$${metrics.total_pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={<Wallet className="text-green-500" />}
          trend={metrics.total_pnl >= 0 ? "positive" : "negative"}
        />
        <MetricCard 
          title="Win Rate" 
          value={`${metrics.win_rate.toFixed(1)}%`}
          icon={<Target className="text-blue-500" />}
        />
        <MetricCard 
          title="Profit Factor" 
          value={metrics.profit_factor.toFixed(2)}
          icon={<Activity className="text-purple-500" />}
        />
        <MetricCard 
          title="Discipline Score" 
          value="100%"
          icon={<ClipboardCheck className="text-yellow-500" />}
          trend="positive"
        />
        <MetricCard 
          title="Total Trades" 
          value={metrics.total_trades.toString()}
          icon={<BarChart3 className="text-orange-500" />}
        />
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Equity Curve</h2>
        <div className="h-80 w-full">
          {equityCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">No data available for these filters</div>
          )}
        </div>
      </div>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Long vs Short Pie Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Long vs Short Volume</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Click to filter</span>
          </div>
          <div className="h-64 w-full cursor-pointer">
            {sideCountBreakdown.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sideCountBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={handlePieClick}
                  >
                    {sideCountBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={filters.direction === "All" || filters.direction === entry.name ? 1 : 0.3}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    formatter={(value: any) => `${value} trades`}
                  />
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
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Click bar to filter</span>
          </div>
          <div className="h-64 w-full cursor-pointer">
            {dowBreakdown.some(d => d.pnl !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
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
                          fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} 
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

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: "positive" | "negative" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-3xl font-bold ${
          trend === "positive" ? "text-green-500" : trend === "negative" ? "text-red-500" : "text-white"
        }`}>
          {value}
        </div>
      </div>
    </div>
  );
}
