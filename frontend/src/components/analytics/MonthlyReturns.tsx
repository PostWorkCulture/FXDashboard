"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { monthlyReturns } from "@/lib/stats";
import { pct } from "@/lib/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Diverging cell shade: green for gains, pink for losses, stronger with size (caps at ±cap%). */
export function returnShade(r: number | null, cap = 10): string | undefined {
  if (r == null || Math.abs(r) < 0.05) return undefined;
  const a = 0.12 + Math.min(Math.abs(r) / cap, 1) * 0.5;
  return r > 0 ? `rgba(34,197,94,${a.toFixed(2)})` : `rgba(236,72,153,${a.toFixed(2)})`;
}

/** Year × month grid of % returns, the classic fund tear-sheet view. Click a month to open it in the calendar. */
export function MonthlyReturns({ onPickMonth }: { onPickMonth?: (year: number, month: number) => void }) {
  const { closedTrades } = useData();
  const rows = useMemo(() => monthlyReturns(closedTrades), [closedTrades]);
  const [hover, setHover] = useState<{ y: number; m: number } | null>(null);

  if (rows.length === 0) return null;

  return (
    <div className="border border-zinc-800/70 rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-300">Monthly returns</h2>
        <span className="text-xs text-zinc-500">% of account at the start of each month · click a month to open it</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr className="text-zinc-500">
              <th className="text-left font-normal pr-2 py-1">Year</th>
              {MONTHS.map(m => <th key={m} className="font-normal py-1 w-[7%]">{m}</th>)}
              <th className="font-normal py-1 pl-2 text-right">Year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.year}>
                <td className="text-zinc-400 pr-2">{row.year}</td>
                {row.months.map((r, m) => {
                  const isHover = hover?.y === row.year && hover?.m === m;
                  return (
                    <td key={m} className="p-0">
                      <button
                        disabled={r == null}
                        onMouseEnter={() => setHover({ y: row.year, m })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => r != null && onPickMonth?.(row.year, m)}
                        title={r == null ? undefined : `${MONTHS[m]} ${row.year}: ${pct(r, { signed: true })}`}
                        className={`w-full h-8 rounded-[4px] text-center transition-all ${
                          r == null ? "text-zinc-700 cursor-default" : "text-zinc-100 hover:ring-1 hover:ring-zinc-300 cursor-pointer"
                        } ${isHover ? "scale-105" : ""}`}
                        style={{ background: returnShade(r) ?? (r == null ? "transparent" : "rgba(63,63,70,0.35)") }}
                      >
                        {r == null ? "·" : `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(1)}`}
                      </button>
                    </td>
                  );
                })}
                <td className="pl-2 text-right">
                  <span className={`font-medium ${row.total > 0 ? "text-green-500" : row.total < 0 ? "text-pink-500" : "text-zinc-300"}`}>
                    {pct(row.total, { signed: true })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
