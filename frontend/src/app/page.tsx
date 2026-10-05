"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity,
  LayoutDashboard,
  Wallet,
  Settings,
  Bell,
  PieChart as PieChartIcon
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

interface Metrics {
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  profit_factor: number;
}

interface Trade {
  id: number;
  symbol: string;
  direction: string;
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  is_win: boolean;
}

interface EquityPoint {
  date: string;
  equity: number;
}

interface Breakdowns {
  direction: {name: string, value: number}[];
  symbols: {name: string, value: number}[];
  day_of_week: {name: string, pnl: number}[];
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const [tradeType, setTradeType] = useState<"backtest" | "live">("backtest");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdowns | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, tradesRes, equityRes, breakdownsRes] = await Promise.all([
          fetch(`http://localhost:8000/api/metrics?trade_type=${tradeType}`),
          fetch(`http://localhost:8000/api/trades?trade_type=${tradeType}`),
          fetch(`http://localhost:8000/api/equity-curve?trade_type=${tradeType}`),
          fetch(`http://localhost:8000/api/breakdowns?trade_type=${tradeType}`)
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (tradesRes.ok) setTrades(await tradesRes.json());
        if (equityRes.ok) setEquityCurve(await equityRes.json());
        if (breakdownsRes.ok) setBreakdowns(await breakdownsRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [tradeType]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-zinc-950" />
            </div>
            ZellaClone
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<Wallet size={20} />} label="Trades" />
          <NavItem icon={<PieChartIcon size={20} />} label="Reports" />
          <NavItem icon={<Activity size={20} />} label="Performance" />
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">Overview</h1>
            
            {/* Type Toggle */}
            <div className="bg-zinc-900 p-1 rounded-lg border border-zinc-800 flex">
              <button 
                onClick={() => setTradeType("backtest")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tradeType === "backtest" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                Backtest
              </button>
              <button 
                onClick={() => setTradeType("live")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tradeType === "live" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                Live Trading
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
              <Bell size={20} className="text-zinc-400" />
            </button>
            <div className="w-8 h-8 bg-zinc-700 rounded-full border border-zinc-600"></div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Net P&L" 
              value={`$${metrics?.total_pnl?.toLocaleString() || "0.00"}`}
              icon={<Wallet className="text-green-500" />}
              trend={metrics && metrics.total_pnl >= 0 ? "positive" : "negative"}
            />
            <MetricCard 
              title="Win Rate" 
              value={`${metrics?.win_rate?.toFixed(1) || "0"}%`}
              icon={<Target className="text-blue-500" />}
            />
            <MetricCard 
              title="Profit Factor" 
              value={metrics?.profit_factor?.toFixed(2) || "0.00"}
              icon={<Activity className="text-purple-500" />}
            />
            <MetricCard 
              title="Total Trades" 
              value={metrics?.total_trades?.toString() || "0"}
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
                <div className="flex h-full items-center justify-center text-zinc-500">No data available</div>
              )}
            </div>
          </div>

          {/* Breakdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Long vs Short Pie Chart */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">Long vs Short P&L</h2>
              <div className="h-64 w-full">
                {breakdowns?.direction && breakdowns.direction.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdowns.direction}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {breakdowns.direction.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex h-full items-center justify-center text-zinc-500">No data available</div>
                )}
              </div>
            </div>

            {/* Day of Week Bar Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">P&L by Day of Week</h2>
              <div className="h-64 w-full">
                {breakdowns?.day_of_week && breakdowns.day_of_week.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdowns.day_of_week} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        cursor={{fill: '#27272a'}}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {breakdowns.day_of_week.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex h-full items-center justify-center text-zinc-500">No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Trades Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Trades</h2>
            </div>
            <div className="overflow-x-auto">
              {trades.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
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
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-zinc-800/50 transition-colors">
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
                        <td className="px-6 py-4 text-zinc-400">{trade.entry_price.toFixed(5)}</td>
                        <td className="px-6 py-4 text-zinc-400">{trade.exit_price.toFixed(5)}</td>
                        <td className={`px-6 py-4 text-right font-medium ${
                          trade.is_win ? "text-green-500" : "text-red-500"
                        }`}>
                          {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No trades found for {tradeType} mode.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active 
        ? "bg-zinc-800 text-white font-medium" 
        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
    }`}>
      {icon}
      <span>{label}</span>
    </button>
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
