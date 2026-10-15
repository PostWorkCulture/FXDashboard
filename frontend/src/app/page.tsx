"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import { STARTING_BALANCE, usd, pct, price, pnlClass } from "@/lib/format";
import { equitySeries, byExit, rolling, sample } from "@/lib/stats";
import { EquityDrawdown } from "@/components/charts/EquityDrawdown";
import { Sparkline, useCountUp } from "@/components/charts/Sparkline";
import { OpenTradeGauge } from "@/components/OpenTradeGauge";

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

    const curve = equitySeries(closedTrades);
    // Max drawdown on a per-trade basis (finer than the daily curve)
    let eq = STARTING_BALANCE, peak = STARTING_BALANCE, max_dd_usd = 0, max_dd_pct = 0;
    for (const t of byExit(closedTrades)) {
      eq += t.pnl;
      peak = Math.max(peak, eq);
      max_dd_usd = Math.max(max_dd_usd, peak - eq);
      max_dd_pct = Math.max(max_dd_pct, ((peak - eq) / peak) * 100);
    }
    const roll = rolling(closedTrades, 30);

    return {
      metrics: { total_trades, win_rate, total_pnl, profit_factor, max_dd_usd, max_dd_pct, return_pct: (total_pnl / STARTING_BALANCE) * 100 },
      curve,
      spark: {
        equity: sample(curve.map(p => p.equity)),
        winRate: sample(roll.winRate),
        profitFactor: sample(roll.profitFactor),
        drawdown: sample(curve.map(p => p.drawdown)),
      },
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

  const { metrics, curve, spark } = data;

  return (
    <div className="space-y-8 pb-8">
      {/* Current / Recent Trades */}
      {currentOrRecentTrades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Open & recent trades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentOrRecentTrades.map(trade => (
              <div key={trade.id} className={`p-6 rounded-xl border border-zinc-800/70 flex flex-col gap-4`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{trade.symbol}</span>
                    <span className={`text-xs ${trade.direction === 'Long' ? 'text-green-500' : 'text-pink-500'}`}>{trade.direction}</span>
                  </div>
                  {trade.status === 'open' ? (
                    <span className="text-xs text-zinc-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Open</span>
                  ) : (
                    <span className="text-xs text-zinc-500">Closed</span>
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
                </div>

                {trade.status === 'open' && <OpenTradeGauge trade={trade} />}

                <div className="text-sm pt-3 border-t border-zinc-800/70">
                  <div className="text-zinc-500 mb-1">Trigger</div>
                  <div className="text-zinc-300">{trade.trigger_reason || trade.setup || "System execution"}</div>
                </div>

                {trade.status === 'closed' && (
                  <div className="text-sm flex flex-col">
                    <div className="text-zinc-500 mb-1">Exit</div>
                    <div className="text-zinc-300 flex-1">{trade.exit_reason || "Position closed."}</div>
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-zinc-800/50">
                      <span className="text-zinc-500">Result</span>
                      <span className={`font-bold tabular-nums ${pnlClass(trade.pnl)}`}>{usd(trade.pnl, { signed: true })}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs with trend sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Net P&L"
          value={metrics.total_pnl}
          format={v => usd(v, { signed: true })}
          sub={`${pct(metrics.return_pct, { signed: true })} on ${usd(STARTING_BALANCE)}`}
          tone={metrics.total_pnl > 0 ? "pos" : metrics.total_pnl < 0 ? "neg" : undefined}
          spark={spark.equity}
          sparkBaseline={STARTING_BALANCE}
          sparkLabel="Equity"
        />
        <KpiCard
          title="Win Rate"
          value={metrics.win_rate}
          format={v => (metrics.total_trades > 0 ? pct(v) : "—")}
          sub={`${metrics.total_trades.toLocaleString("en-GB")} closed ${metrics.total_trades === 1 ? "trade" : "trades"}`}
          spark={spark.winRate}
          sparkLabel="Rolling 30 trades"
        />
        <KpiCard
          title="Profit Factor"
          value={metrics.profit_factor}
          format={v => (metrics.profit_factor > 0 ? v.toFixed(2) : "—")}
          spark={spark.profitFactor}
          sparkBaseline={1}
          sparkLabel="Rolling 30 trades"
        />
        <KpiCard
          title="Max Drawdown"
          value={-metrics.max_dd_pct}
          format={v => (metrics.total_trades > 0 ? pct(v) : "—")}
          sub={metrics.max_dd_usd > 0 ? `${usd(-metrics.max_dd_usd)} peak to trough` : undefined}
          tone={metrics.max_dd_pct > 0 ? "neg" : undefined}
          spark={spark.drawdown}
          sparkColor="#ec4899"
          sparkLabel="Drawdown"
        />
      </div>

      {/* Equity curve + underwater drawdown */}
      <div className="border border-zinc-800/70 rounded-xl p-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Equity curve</h2>
        {curve.length > 0 ? (
          <EquityDrawdown data={curve} />
        ) : (
          <div className="h-40 flex items-center justify-center text-zinc-500">
            {closedTrades.length === 0 ? "No closed trades yet" : "No data available for these filters"}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, format, sub, tone, spark, sparkBaseline, sparkColor, sparkLabel }: {
  title: string; value: number; format: (v: number) => string; sub?: string; tone?: "pos" | "neg";
  spark: number[]; sparkBaseline?: number; sparkColor?: string; sparkLabel?: string;
}) {
  const v = useCountUp(value);
  return (
    <div className="border border-zinc-800/70 rounded-xl p-5 flex flex-col gap-2 overflow-hidden">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <div className={`text-2xl font-semibold tabular-nums ${tone === "pos" ? "text-green-500" : tone === "neg" ? "text-pink-500" : "text-white"}`}>
        {format(v)}
      </div>
      <div className="text-sm text-zinc-500 min-h-5">{sub}</div>
      {spark.length > 1 && (
        <div className="mt-1" title={sparkLabel}>
          <Sparkline values={spark} baseline={sparkBaseline} color={sparkColor ?? (tone === "neg" ? "#ec4899" : tone === "pos" ? "#22c55e" : "#a1a1aa")} />
        </div>
      )}
    </div>
  );
}
