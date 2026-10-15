"use client";

import { useEffect, useState } from "react";
import { useData } from "@/lib/data-context";
import { Target, Clock, ShieldAlert, Newspaper } from "lucide-react";
import { usd, pct as fmtPct } from "@/lib/format";
import { ChallengePaths } from "@/components/prop/ChallengePaths";

// Everything on this page comes from public/data/strategy.json, written by python/export_dashboard.py
// from the same config the EA and backtest use - nothing here is typed in by hand.
interface PairCfg { rsi_low: number; rsi_high: number; sl: number; tp: number; bad_days: number[]; bad_hours: number[]; cost_pips: number }
interface PhaseStats { pass?: number; fail?: number; running?: number; median_days_to_pass?: number | null; windows?: number }
interface Strategy {
  version: string; generated: string; period: [string, string];
  pairs: Record<string, PairCfg>;
  portfolio: { start_balance: number; risk_pct: number; max_open: number; daily_guard_pct: number; daily_hard_stop_pct: number };
  backtest: { trades: number; final_balance: number; max_dd_pct: number; per_pair: Record<string, { trades: number; win_rate: number; profit_factor: number; pnl: number }> };
  prop: { phase1: PhaseStats; phase2: PhaseStats; rules: string };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PropPage() {
  const { filters } = useData();
  const [s, setS] = useState<Strategy | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
    fetch(`${basePath}/data/strategy.json`).then(r => (r.ok ? r.json() : Promise.reject())).then(setS).catch(() => setErr(true));
  }, []);

  if (err) return <div className="py-12 text-center text-zinc-500">strategy.json not found - run python/export_dashboard.py</div>;
  if (!s) return <div className="flex h-full items-center justify-center text-zinc-500">Loading strategy...</div>;

  const pairs = Object.entries(s.pairs).filter(([p]) => filters.symbol === "All" || p === filters.symbol);
  const pf = s.portfolio;
  const pct = (v?: number) => (v == null ? "—" : fmtPct(v));

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* Challenge outlook (portfolio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {([["Phase 1", "8% target", s.prop.phase1], ["Phase 2", "5% target", s.prop.phase2]] as const).map(([name, tgt, st]) => (
          <div key={name} className="border border-zinc-800/70 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"><Clock size={18} /></div>
              <div>
                <h3 className="font-semibold text-white">{name} <span className="text-zinc-500 font-normal">({tgt})</span></h3>
                <p className="text-xs text-zinc-500">Backtested challenge starts every 7 days, {st.windows ?? "-"} windows</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50"><div className="text-xs text-zinc-500">Pass</div><div className="text-xl font-bold text-green-500">{pct(st.pass)}</div></div>
              <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50"><div className="text-xs text-zinc-500">Fail</div><div className="text-xl font-bold text-pink-500">{pct(st.fail)}</div></div>
              <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50"><div className="text-xs text-zinc-500">Median days</div><div className="text-xl font-bold text-white">{st.median_days_to_pass ?? "-"}</div></div>
            </div>
          </div>
        ))}
      </div>

      <ChallengePaths phases={[{ label: "Phase 1", target: 8 }, { label: "Phase 2", target: 5 }]} />

      {/* Pair rule cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pairs.map(([pair, c]) => {
          const bt = s.backtest.per_pair[pair];
          return (
            <div key={pair} className="border border-zinc-800/70 rounded-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">{pair}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">EA v{s.version}</span>
              </div>
              <div className="p-6 space-y-3 text-sm text-zinc-300">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Algo Rules</h4>
                <Rule label="Long">H1 RSI(14) closes below {c.rsi_low} (previous bar at or above {c.rsi_low}).</Rule>
                <Rule label="Short">H1 RSI(14) closes above {c.rsi_high} (previous bar at or below {c.rsi_high}).</Rule>
                <Rule label="Execution">Market order at the open of the next H1 bar.</Rule>
                <Rule label="Risk/Reward">SL {c.sl} pips / TP {c.tp} pips (1:{(c.tp / c.sl).toFixed(0)}). Opposite signal closes and reverses.</Rule>
                <Rule label="Time filters">
                  {c.bad_days.length || c.bad_hours.length
                    ? `Blocked days: ${c.bad_days.map(d => DAYS[d]).join(", ") || "none"}; hours: ${c.bad_hours.join(", ") || "none"}`
                    : "None. Day/hour filters were dropped in v4 because they failed out-of-sample."}
                </Rule>
                {bt && (
                  <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-zinc-800/50 text-center">
                    <Stat k="Trades" v={bt.trades.toString()} />
                    <Stat k="Win rate" v={fmtPct(bt.win_rate)} />
                    <Stat k="Profit factor" v={bt.profit_factor.toFixed(2)} />
                    <Stat k="Backtest P&L" v={usd(bt.pnl, { signed: true })} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio protection */}
      <div className="border border-zinc-800/70 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert size={20} className="text-zinc-400" />
          <h3 className="font-semibold text-white">Account Protection (all pairs)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat k="Risk per trade" v={`${pf.risk_pct}% of balance`} />
          <Stat k="Max open positions" v={pf.max_open.toString()} />
          <Stat k="Daily entry guard" v={`${pf.daily_guard_pct}%`} />
          <Stat k="Daily hard stop" v={`${pf.daily_hard_stop_pct}%`} />
        </div>
        <ul className="mt-4 space-y-1 text-sm text-zinc-400 list-disc list-inside">
          <li>No new trade if today&apos;s closed loss + open risk + the new trade&apos;s risk could exceed {pf.daily_guard_pct}% of the day&apos;s starting balance.</li>
          <li>If equity drops {pf.daily_hard_stop_pct}% below the day&apos;s starting balance, all EA trades close and trading stops until the next server day.</li>
          <li>Trading stops automatically once the phase target and minimum profitable days are both reached.</li>
        </ul>
        <div className="flex items-start gap-2 mt-4 text-sm text-zinc-400">
          <Newspaper size={16} className="mt-0.5 shrink-0" />
          <span>News filter (live only): no new entries within 60 minutes before or 30 minutes after a high-impact USD or base-currency event. Not included in the backtest; MT5&apos;s calendar has no history in the Strategy Tester.</span>
        </div>
      </div>

      <div className="text-xs text-zinc-600 flex items-center gap-2">
        <Target size={12} /> Backtest {s.period[0].slice(0, 10)} to {s.period[1].slice(0, 10)} (broker time): {s.backtest.trades} trades,
        {usd(pf.start_balance)} to {usd(s.backtest.final_balance)}, max drawdown {fmtPct(s.backtest.max_dd_pct)}. Rules: {s.prop.rules}. Generated {s.generated}.
      </div>
    </div>
  );
}

function Rule({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2 shrink-0"></div>
      <div><span className="font-semibold text-white">{label}:</span> {children}</div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
      <div className="text-xs text-zinc-500">{k}</div>
      <div className="font-semibold text-white">{v}</div>
    </div>
  );
}
