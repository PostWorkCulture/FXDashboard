"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useData, type Trade } from "@/lib/data-context";
import { usd, rMultiple } from "@/lib/format";

const AXIS = { stroke: "#71717a", fontSize: 11, tickLine: false, axisLine: false } as const;

/** MAE vs MFE per trade: how far each trade went against you vs in your favour, with the SL / TP distances drawn in. */
export function TradeQuality() {
  const { closedTrades, filters, setFilters } = useData();
  const router = useRouter();
  const [levels, setLevels] = useState<{ sl: number; tp: number } | null>(null);

  useEffect(() => {
    const base = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
    fetch(`${base}/data/strategy.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => {
        if (!s?.pairs) return;
        const pairs = Object.entries(s.pairs as Record<string, { sl: number; tp: number }>)
          .filter(([p]) => filters.symbol === "All" || p === filters.symbol)
          .map(([, c]) => c);
        // Only draw the lines when every shown pair shares the same distances
        if (pairs.length && pairs.every(c => c.sl === pairs[0].sl && c.tp === pairs[0].tp)) setLevels({ sl: pairs[0].sl, tp: pairs[0].tp });
        else setLevels(null);
      })
      .catch(() => {});
  }, [filters.symbol]);

  const { wins, losses, maxX, maxY } = useMemo(() => {
    const pts = closedTrades
      .filter(t => t.mae_pips != null && t.mfe_pips != null)
      .map(t => ({ x: t.mae_pips as number, y: t.mfe_pips as number, t }));
    return {
      wins: pts.filter(p => p.t.pnl > 0),
      losses: pts.filter(p => p.t.pnl <= 0),
      maxX: Math.max(10, ...pts.map(p => p.x)),
      maxY: Math.max(10, ...pts.map(p => p.y)),
    };
  }, [closedTrades]);

  if (wins.length + losses.length === 0) return null;

  const open = (t: Trade) => {
    setFilters(f => ({ ...f, selectedTradeId: t.id }));
    router.push("/trades");
  };
  const round = (v: number) => Math.ceil(v / 50) * 50;
  const ticks = (max: number) => Array.from({ length: round(max) / 50 + 1 }, (_, i) => i * 50);

  return (
    <div className="border border-zinc-800/70 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm font-medium text-zinc-300">Trade quality</h2>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Win ({wins.length})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500" />Loss ({losses.length})</span>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Each dot is a trade: how far it went against you (MAE) and in your favour (MFE), in pips. Click a dot to open the trade.
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
            <CartesianGrid stroke="#1f1f23" />
            <XAxis type="number" dataKey="x" {...AXIS} domain={[0, round(maxX)]} ticks={ticks(maxX)}
              label={{ value: "Max adverse (pips)", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }} />
            <YAxis type="number" dataKey="y" {...AXIS} domain={[0, round(maxY)]} ticks={ticks(maxY)} width={48}
              label={{ value: "Max favourable (pips)", angle: -90, position: "insideLeft", offset: 12, fill: "#71717a", fontSize: 11 }} />
            {levels && (
              <>
                <ReferenceLine x={levels.sl} stroke="#52525b" strokeDasharray="4 3"
                  label={{ value: `SL ${levels.sl}`, position: "insideTopRight", fill: "#a1a1aa", fontSize: 11 }} />
                <ReferenceLine y={levels.tp} stroke="#52525b" strokeDasharray="4 3"
                  label={{ value: `TP ${levels.tp}`, position: "insideTopRight", fill: "#a1a1aa", fontSize: 11 }} />
              </>
            )}
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { t } = payload[0].payload as { t: Trade };
                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs tabular-nums space-y-0.5">
                    <div className="text-white">{t.symbol} #{t.id} · {t.direction}</div>
                    <div className="text-zinc-400">{t.entry_time.slice(0, 16)}</div>
                    <div className={t.pnl > 0 ? "text-green-500" : "text-pink-500"}>{usd(t.pnl, { signed: true })} · {rMultiple(t.r_multiple)}</div>
                    <div className="text-zinc-400">MAE {t.mae_pips?.toFixed(1)} · MFE {t.mfe_pips?.toFixed(1)} pips</div>
                    {t.exit_reason && <div className="text-zinc-500">{t.exit_reason}</div>}
                  </div>
                );
              }}
            />
            <Scatter data={losses} fill="#ec4899" fillOpacity={0.55} shape="circle" className="cursor-pointer"
              onClick={(p: any) => open(p.payload?.t ?? p.t)} isAnimationActive={false} />
            <Scatter data={wins} fill="#22c55e" fillOpacity={0.7} shape="circle" className="cursor-pointer"
              onClick={(p: any) => open(p.payload?.t ?? p.t)} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
