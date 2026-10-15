"use client";

import { useEffect, useState } from "react";
import type { Trade } from "@/lib/data-context";
import { price as fmtPrice, rMultiple } from "@/lib/format";

const PIP = 0.0001; // GBPUSD / AUDUSD

/** SL → TP bar showing where the last known price sits, with open R and pips. */
export function OpenTradeGauge({ trade }: { trade: Trade }) {
  const [last, setLast] = useState<{ close: number; time: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const base = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
    fetch(`${base}/data/${trade.symbol.toLowerCase()}_h1_candles.json`)
      .then(r => (r.ok ? r.json() : []))
      .then((c: { time: number; close: number }[]) => {
        if (alive && c.length) setLast({ close: c[c.length - 1].close, time: c[c.length - 1].time });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [trade.symbol]);

  if (trade.sl == null || trade.tp == null) return null;

  // Candle times are broker time stored as if UTC; ignore prices from before the trade opened
  const entryTs = Date.parse(trade.entry_time.replace(" ", "T") + "Z") / 1000;
  const stale = last !== null && last.time < entryTs;
  if (stale) {
    return (
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-zinc-800/80" />
        <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
          <span>SL {fmtPrice(trade.sl)}</span>
          <span>TP {fmtPrice(trade.tp)}</span>
        </div>
        <div className="text-xs text-zinc-500">No price data since entry yet: run data_pipeline.py to refresh the candles.</div>
      </div>
    );
  }

  const isLong = trade.direction === "Long";
  const risk = Math.abs(trade.entry_price - trade.sl);
  const lo = Math.min(trade.sl, trade.tp);
  const hi = Math.max(trade.sl, trade.tp);
  // 0% = stop loss end, 100% = take profit end, whichever side of the chart they sit
  const pos = (p: number) => {
    const f = (p - lo) / (hi - lo);
    const fromSl = trade.sl! < trade.tp! ? f : 1 - f;
    return Math.min(100, Math.max(0, fromSl * 100));
  };
  const entryPos = pos(trade.entry_price);
  const move = last ? (isLong ? last.close - trade.entry_price : trade.entry_price - last.close) : 0;
  const r = last && risk > 0 ? move / risk : null;
  const pips = last ? move / PIP : null;
  const nowPos = last ? pos(last.close) : null;
  const winning = move >= 0;

  return (
    <div className="space-y-2">
      <div className="relative h-2 rounded-full bg-zinc-800/80 overflow-visible">
        {/* Shaded span from entry to current price */}
        {nowPos !== null && (
          <div
            className={`absolute top-0 h-2 rounded-full ${winning ? "bg-green-500/60" : "bg-pink-500/60"} transition-all duration-700`}
            style={{ left: `${Math.min(entryPos, nowPos)}%`, width: `${Math.abs(nowPos - entryPos)}%` }}
          />
        )}
        {/* Entry tick */}
        <div className="absolute -top-1 h-4 w-px bg-zinc-400" style={{ left: `${entryPos}%` }} title={`Entry ${fmtPrice(trade.entry_price)}`} />
        {/* Current price marker */}
        {nowPos !== null && (
          <div
            className="absolute -top-1.5 h-5 w-1.5 -ml-[3px] rounded-full bg-white ring-2 ring-zinc-950 transition-all duration-700"
            style={{ left: `${nowPos}%` }}
            title={`Last ${fmtPrice(last!.close)}`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
        <span>SL {fmtPrice(trade.sl)}</span>
        <span>TP {fmtPrice(trade.tp)}</span>
      </div>
      {last && (
        <div className="flex items-baseline justify-between text-sm tabular-nums">
          <span className={winning ? "text-green-500" : "text-pink-500"}>
            {rMultiple(r)} · {pips! >= 0 ? "+" : "−"}{Math.abs(pips!).toFixed(1)} pips
          </span>
          <span className="text-xs text-zinc-500" title="Close of the latest H1 candle in the exported data (broker time)">
            last {fmtPrice(last.close)} · {new Date(last.time * 1000).toLocaleString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
    </div>
  );
}
