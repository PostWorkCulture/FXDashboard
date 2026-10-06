"use client";

import { useData } from "@/lib/data-context";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function SummariesPage() {
  const { filteredTrades, isLoading, setFilters } = useData();
  const router = useRouter();

  const handleFilterNav = (update: any) => {
    setFilters(f => ({ ...f, ...update }));
    router.push("/trades");
  };

  const observations = useMemo(() => {
    if (filteredTrades.length === 0) return null;

    const totalTrades = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.pnl > 0).length;
    const winRate = ((wins / totalTrades) * 100).toFixed(1);
    const netPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);

    // Current Month Story
    const now = new Date();
    const currentMonthTrades = filteredTrades.filter(t => {
      const d = new Date(t.entry_time.replace(" ", "T"));
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const cmNet = currentMonthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const cmWins = currentMonthTrades.filter(t => t.pnl > 0).length;
    const cmWinRate = currentMonthTrades.length > 0 ? ((cmWins / currentMonthTrades.length) * 100).toFixed(1) : "0.0";
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[now.getMonth()];

    // Day of week analysis
    const days = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun, 1=Mon
    const daysCount = [0, 0, 0, 0, 0, 0, 0];
    filteredTrades.forEach(t => {
      const d = new Date(t.entry_time.replace(" ", "T")).getDay();
      days[d] += t.pnl;
      daysCount[d] += 1;
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let bestDayIdx = -1;
    let worstDayIdx = -1;
    let bestDayPnl = -Infinity;
    let worstDayPnl = Infinity;

    days.forEach((pnl, idx) => {
      if (daysCount[idx] > 0) {
        if (pnl > bestDayPnl) { bestDayPnl = pnl; bestDayIdx = idx; }
        if (pnl < worstDayPnl) { worstDayPnl = pnl; worstDayIdx = idx; }
      }
    });

    // Side analysis
    const longs = filteredTrades.filter(t => t.direction === "Long");
    const shorts = filteredTrades.filter(t => t.direction === "Short");
    const longPnl = longs.reduce((sum, t) => sum + t.pnl, 0);
    const shortPnl = shorts.reduce((sum, t) => sum + t.pnl, 0);

    // Unusual trades (High MAE but won)
    const unusual = filteredTrades
      .filter(t => t.is_win && (t.mae_pips || 0) > 30) // taking heat
      .sort((a, b) => (b.mae_pips || 0) - (a.mae_pips || 0))
      .slice(0, 3);

    return {
      totalTrades,
      winRate,
      netPnl,
      currentMonth: {
        name: currentMonthName,
        trades: currentMonthTrades.length,
        pnl: cmNet,
        winRate: cmWinRate
      },
      bestDay: { name: bestDayIdx >= 0 ? dayNames[bestDayIdx] : "N/A", idx: bestDayIdx, pnl: bestDayPnl },
      worstDay: { name: worstDayIdx >= 0 ? dayNames[worstDayIdx] : "N/A", idx: worstDayIdx, pnl: worstDayPnl },
      longPnl,
      shortPnl,
      unusual
    };
  }, [filteredTrades]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Generating summaries...</div>;
  }

  if (!observations) {
    return <div className="flex h-full items-center justify-center text-zinc-500">No data available for summaries.</div>;
  }

  const { currentMonth, bestDay, worstDay, longPnl, shortPnl, unusual } = observations;

  return (
    <div className="max-w-4xl space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Automated Summaries</h1>
        <p className="text-zinc-400">Dynamic insights generated from your algorithm's recent execution data.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4">Current Month Update ({currentMonth.name})</h2>
        <p className="text-zinc-300 leading-relaxed">
          So far in <button onClick={() => handleFilterNav({ dateRange: "This Month" })} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">{currentMonth.name}</button>, the strategy has taken <strong className="text-white">{currentMonth.trades}</strong> trades, 
          generating a net P&L of <strong className={currentMonth.pnl >= 0 ? "text-green-500" : "text-pink-500"}>
            {currentMonth.pnl >= 0 ? "+" : ""}${currentMonth.pnl.toFixed(2)}
          </strong>. 
          The win rate stands at <strong className="text-white">{currentMonth.winRate}%</strong> for this period. 
          {currentMonth.trades > 0 && currentMonth.pnl > 0 ? " The algorithm is performing well and capitalizing on current market conditions." : ""}
          {currentMonth.trades > 0 && currentMonth.pnl < 0 ? " The algorithm is experiencing some drawdown this month. Continue to monitor if market regime has shifted." : ""}
          {currentMonth.trades === 0 ? " The algorithm has not executed any trades yet this month." : ""}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4">Strategic Optimizations & Trends</h2>
        <ul className="space-y-4 text-zinc-300 leading-relaxed list-disc list-inside">
          <li>
            <strong>Day of Week Bias:</strong> The algorithm performs best on <button onClick={() => handleFilterNav({ dayOfWeek: bestDay.idx })} className="text-green-500 hover:text-green-400 underline underline-offset-2 transition-colors">{bestDay.name}s</button> (${bestDay.pnl.toFixed(2)} Net P&L). 
            Conversely, <button onClick={() => handleFilterNav({ dayOfWeek: worstDay.idx })} className="text-pink-500 hover:text-pink-400 underline underline-offset-2 transition-colors">{worstDay.name}s</button> have been the weakest link (${worstDay.pnl.toFixed(2)}). 
            <em> Suggestion: Consider running a backtest with {worstDay.name} disabled to see if the overall Profit Factor improves.</em>
          </li>
          <li>
            <strong>Directional Edge:</strong> <button onClick={() => handleFilterNav({ direction: "Long" })} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Long trades</button> have contributed <strong className={longPnl >= 0 ? "text-green-500" : "text-pink-500"}>${longPnl.toFixed(2)}</strong>, 
            while <button onClick={() => handleFilterNav({ direction: "Short" })} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Short trades</button> have contributed <strong className={shortPnl >= 0 ? "text-green-500" : "text-pink-500"}>${shortPnl.toFixed(2)}</strong>. 
            {longPnl > shortPnl * 1.5 ? " The strategy exhibits a heavy long bias. Make sure it survives prolonged bear markets." : ""}
            {shortPnl > longPnl * 1.5 ? " The strategy exhibits a heavy short bias." : ""}
          </li>
        </ul>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4">Unusual Trade Execution</h2>
        <p className="text-zinc-300 leading-relaxed mb-4">
          The following trades successfully hit their Profit Targets, but took an unusually high amount of heat (Maximum Adverse Excursion) before recovering. 
          Review these setups to see if Stop Losses were placed too tightly or if entry criteria were slightly early.
        </p>
        <div className="space-y-3">
          {unusual.map(t => (
            <div key={t.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
              <div>
                <button 
                  onClick={() => handleFilterNav({ selectedTradeId: t.id })}
                  className="font-mono text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  #{t.id}
                </button>
                <span className="ml-3 text-white">{t.symbol}</span>
                <span className="ml-3 text-sm text-zinc-500">{t.entry_time.split(" ")[0]}</span>
              </div>
              <div className="text-sm">
                Took <strong className="text-pink-500">-{(t.mae_pips || 0).toFixed(1)} pips</strong> of heat
              </div>
            </div>
          ))}
          {unusual.length === 0 && (
            <div className="text-zinc-500 text-sm">No unusual heat detected on winning trades. Entries are highly precise!</div>
          )}
        </div>
      </div>
    </div>
  );
}
