"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { dailyPnl } from "@/lib/stats";
import { usd } from "@/lib/format";

const DAY_MS = 86400000;
const CELL = 11;
const GAP = 2;
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri"];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** GitHub-style grid of every trading day (Mon–Fri), one row per year, shaded by that day's P&L. */
export function DailyHeatmap({ onPickDay }: { onPickDay?: (day: Date) => void }) {
  const { closedTrades } = useData();
  const daily = useMemo(() => dailyPnl(closedTrades), [closedTrades]);
  const [tip, setTip] = useState<{ x: number; y: number; day: string } | null>(null);

  const { years, cap } = useMemo(() => {
    const keys = Array.from(daily.keys()).sort();
    if (!keys.length) return { years: [] as number[], cap: 1 };
    const vals = Array.from(daily.values()).map(v => Math.abs(v.pnl)).sort((a, b) => a - b);
    // Scale to the 90th percentile so one huge day doesn't wash out the rest
    const cap = vals[Math.floor(vals.length * 0.9)] || 1;
    const y0 = Number(keys[0].slice(0, 4));
    const y1 = Number(keys[keys.length - 1].slice(0, 4));
    return { years: Array.from({ length: y1 - y0 + 1 }, (_, i) => y1 - i), cap };
  }, [daily]);

  if (!years.length) return null;

  const shade = (pnl: number) => {
    const a = 0.25 + Math.min(Math.abs(pnl) / cap, 1) * 0.75;
    return pnl > 0 ? `rgba(34,197,94,${a.toFixed(2)})` : pnl < 0 ? `rgba(236,72,153,${a.toFixed(2)})` : "#3f3f46";
  };
  const tipData = tip ? daily.get(tip.day) : undefined;

  return (
    <div className="border border-zinc-800/70 rounded-xl p-6 relative">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-300">Every trading day</h2>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>Loss</span>
          {[1, 0.6, 0.3].map(f => <span key={`l${f}`} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: shade(-cap * f) }} />)}
          <span className="w-2.5 h-2.5 rounded-[2px] bg-zinc-900" />
          {[0.3, 0.6, 1].map(f => <span key={`w${f}`} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: shade(cap * f) }} />)}
          <span>Win</span>
        </div>
      </div>

      <div className="overflow-x-auto space-y-3" onMouseLeave={() => setTip(null)}>
        {years.map(year => {
          // Weeks start on the Monday on or before 1 Jan
          const jan1 = new Date(Date.UTC(year, 0, 1));
          const start = new Date(jan1.getTime() - ((jan1.getUTCDay() + 6) % 7) * DAY_MS);
          const weeks = Math.ceil((Date.UTC(year, 11, 31) - start.getTime()) / DAY_MS / 7) + 1;
          let total = 0;
          const cells: React.ReactNode[] = [];
          const monthLabels: React.ReactNode[] = [];
          for (let w = 0; w < weeks; w++) {
            for (let d = 0; d < 5; d++) {
              const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
              if (date.getUTCFullYear() !== year) continue;
              const key = iso(date);
              const v = daily.get(key);
              if (v) total += v.pnl;
              cells.push(
                <rect
                  key={key}
                  x={28 + w * (CELL + GAP)}
                  y={14 + d * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={v ? shade(v.pnl) : "#18181b"}
                  className={v ? "cursor-pointer hover:stroke-zinc-200" : ""}
                  strokeWidth={1}
                  onMouseEnter={e => {
                    if (!v) return setTip(null);
                    const box = (e.currentTarget.ownerSVGElement?.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
                    const r = e.currentTarget.getBoundingClientRect();
                    setTip({ x: r.left - box.left + CELL / 2, y: r.top - box.top, day: key });
                  }}
                  onClick={() => v && onPickDay?.(new Date(key + "T00:00:00"))}
                />
              );
              if (d === 0 && date.getUTCDate() <= 7) {
                monthLabels.push(
                  <text key={`m${key}`} x={28 + w * (CELL + GAP)} y={9} fontSize={9} fill="#71717a">
                    {date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                  </text>
                );
              }
            }
          }
          const width = 28 + weeks * (CELL + GAP) + 64;
          return (
            <svg key={year} width={width} height={14 + 5 * (CELL + GAP)} className="block">
              <text x={0} y={9} fontSize={10} fill="#a1a1aa" fontWeight={500}>{year}</text>
              {WEEKDAYS.map((l, i) => l && <text key={l} x={0} y={14 + i * (CELL + GAP) + 9} fontSize={9} fill="#52525b">{l}</text>)}
              {monthLabels}
              {cells}
              <text x={width - 4} y={14 + 2 * (CELL + GAP) + 9} fontSize={11} textAnchor="end"
                fill={total > 0 ? "#22c55e" : total < 0 ? "#ec4899" : "#a1a1aa"} className="tabular-nums">
                {total === 0 ? "—" : usd(total, { signed: true })}
              </text>
            </svg>
          );
        })}
      </div>

      {tip && tipData && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs tabular-nums whitespace-nowrap"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          <div className="text-zinc-400">{new Date(tip.day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
          <div className={tipData.pnl > 0 ? "text-green-500" : tipData.pnl < 0 ? "text-pink-500" : "text-zinc-300"}>
            {usd(tipData.pnl, { signed: true })} · {tipData.trades} {tipData.trades === 1 ? "trade" : "trades"}
          </div>
        </div>
      )}
    </div>
  );
}
