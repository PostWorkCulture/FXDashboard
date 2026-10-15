"use client";

import { useEffect, useMemo, useState } from "react";
import type { Trade } from "@/lib/data-context";
import { challengePaths, type ChallengePath } from "@/lib/stats";
import { pct } from "@/lib/format";

const W = 900, H = 320, PAD = { l: 44, r: 16, t: 12, b: 28 };
const COLORS = { pass: "#22c55e", fail: "#ec4899", open: "#a1a1aa" };

/** Every backtested challenge attempt drawn as a faint path, with the median bold and the target / loss limit marked. */
export function ChallengePaths({ phases }: { phases: { label: string; target: number }[] }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [phase, setPhase] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const base = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
    fetch(`${base}/data/raw_trades-backtest.json`)
      .then(r => (r.ok ? r.json() : []))
      .then((ts: Trade[]) => setTrades(ts.filter(t => t.exit_time != null && t.status !== "open")))
      .catch(() => {});
  }, []);

  const target = phases[phase]?.target ?? 8;
  const paths = useMemo(
    () => challengePaths(trades, { target, maxLoss: 10, dailyLoss: 5, windowDays: 180, everyDays: 7, minProfitDays: 3 }),
    [trades, target]
  );

  const { median, yMin, yMax } = useMemo(() => {
    // Median across attempts for each day, holding each attempt at its final value once it ends
    const at = (p: ChallengePath, day: number) => {
      let v = 0;
      for (const pt of p.points) { if (pt.day > day) break; v = pt.pct; }
      return v;
    };
    const median: { day: number; pct: number }[] = [];
    for (let d = 0; d <= 180; d += 3) {
      const vs = paths.map(p => at(p, d)).sort((a, b) => a - b);
      if (vs.length) median.push({ day: d, pct: vs[Math.floor(vs.length / 2)] });
    }
    const all = paths.flatMap(p => p.points.map(pt => pt.pct));
    return { median, yMin: Math.min(-12, ...all), yMax: Math.max(target + 4, ...all) };
  }, [paths, target]);

  if (!paths.length) return null;

  const x = (d: number) => PAD.l + (d / 180) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const line = (pts: { day: number; pct: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.pct).toFixed(1)}`).join("");
  const counts = { pass: paths.filter(p => p.outcome === "pass").length, fail: paths.filter(p => p.outcome === "fail").length };
  const h = hover !== null ? paths[hover] : null;
  const yTicks = [-10, -5, 0, 5, 10, 15, 20].filter(v => v >= yMin && v <= yMax);

  return (
    <div className="border border-zinc-800/70 rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
        <h2 className="text-sm font-medium text-zinc-300">Challenge attempts</h2>
        <div className="flex items-center rounded-lg border border-zinc-800 p-0.5">
          {phases.map((p, i) => (
            <button key={p.label} onClick={() => setPhase(i)}
              className={`px-3 py-1 rounded-md text-sm ${phase === i ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        {paths.length} attempts started a week apart, replayed from the backtest trades ({counts.pass} reach the target, {counts.fail} breach a limit).
        A quick replay for the picture; the pass rates above come from the full prop simulation.
      </p>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
          {yTicks.map(v => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "#3f3f46" : "#1f1f23"} />
              <text x={PAD.l - 6} y={y(v) + 4} fontSize={11} textAnchor="end" fill="#71717a">{v > 0 ? `+${v}%` : `${v}%`}</text>
            </g>
          ))}
          {[0, 30, 60, 90, 120, 150, 180].map(d => (
            <text key={d} x={x(d)} y={H - 8} fontSize={11} textAnchor="middle" fill="#71717a">{d === 0 ? "Day 0" : d}</text>
          ))}

          {paths.map((p, i) => (
            <path key={p.start} d={line(p.points)} fill="none" stroke={COLORS[p.outcome]}
              strokeOpacity={hover === null ? 0.13 : hover === i ? 1 : 0.05} strokeWidth={hover === i ? 2 : 1}
              onMouseEnter={() => setHover(i)} className="transition-[stroke-opacity] duration-150" />
          ))}

          <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="#22c55e" strokeDasharray="5 4" />
          <text x={PAD.l + 6} y={y(target) - 6} fontSize={11} fill="#22c55e">Target +{target}%</text>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(-10)} y2={y(-10)} stroke="#ec4899" strokeDasharray="5 4" />
          <text x={PAD.l + 6} y={y(-10) + 14} fontSize={11} fill="#ec4899">Max loss −10%</text>

          <path d={line(median)} fill="none" stroke="#fafafa" strokeWidth={2.5} pointerEvents="none" />
          <text x={x(median[median.length - 1].day) - 4} y={y(median[median.length - 1].pct) - 8} fontSize={11} textAnchor="end" fill="#fafafa">Median</text>
        </svg>

        {h && (
          <div className="pointer-events-none absolute top-2 left-14 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs tabular-nums">
            <div className="text-zinc-400">Started {new Date(h.start + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            <div style={{ color: COLORS[h.outcome] }}>
              {h.outcome === "pass" ? `Passed in ${h.days} days` : h.outcome === "fail" ? `Failed on day ${h.days}` : "Ran out of time"}
              {" · "}{pct(h.points[h.points.length - 1].pct, { signed: true })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
