"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries, createSeriesMarkers, UTCTimestamp } from "lightweight-charts";
import type { Trade } from "@/lib/data-context";

// Candle times and trade times are both broker server time. Candles are exported as if that wall-clock
// time were UTC, so trade strings must be parsed as UTC too (no local-timezone shift).
const toUnix = (s: string) => Math.floor(Date.parse(s.replace(" ", "T") + "Z") / 1000);

export function ExecutionChart({ trade }: { trade: Trade }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [ohlcv, setOhlcv] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
    setError(null);
    fetch(`${basePath}/data/${trade.symbol.toLowerCase()}_h1_candles.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setOhlcv)
      .catch(() => setError("No candle data for this pair"));
  }, [trade.symbol]);

  useEffect(() => {
    if (!chartContainerRef.current || ohlcv.length === 0) return;

    const entryUnix = toUnix(trade.entry_time);
    const exitUnix = trade.exit_time ? toUnix(trade.exit_time) : ohlcv[ohlcv.length - 1].time;
    const entryIndex = ohlcv.findIndex(c => c.time >= entryUnix);
    let exitIndex = ohlcv.findIndex(c => c.time >= exitUnix);
    if (entryIndex === -1) { setError("Trade is outside the exported candle range"); return; }
    if (exitIndex === -1) exitIndex = ohlcv.length - 1;

    const chartData = ohlcv.slice(Math.max(0, entryIndex - 20), Math.min(ohlcv.length, exitIndex + 21));

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#A1A1AA" },
      grid: { vertLines: { color: "#27272a" }, horzLines: { color: "#27272a" } },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "#27272a" },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ec4899", borderVisible: false, wickUpColor: "#22c55e", wickDownColor: "#ec4899",
      priceFormat: { type: "price", precision: 5, minMove: 0.00001 },
    });
    series.setData(chartData);

    const isLong = trade.direction === "Long";
    const markers: any[] = [{
      time: ohlcv[entryIndex].time as UTCTimestamp,
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#22c55e" : "#ec4899",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: "Entry",
    }];
    if (trade.exit_time) {
      markers.push({
        time: ohlcv[exitIndex].time as UTCTimestamp,
        position: isLong ? "aboveBar" : "belowBar",
        color: trade.pnl >= 0 ? "#22c55e" : "#ec4899",
        shape: "circle",
        text: trade.exit_reason ? `Exit: ${trade.exit_reason}` : "Exit",
      });
    }
    createSeriesMarkers(series, markers);

    series.createPriceLine({ price: trade.entry_price, color: "#a1a1aa", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Entry" });
    if (trade.sl != null) series.createPriceLine({ price: trade.sl, color: "#ec4899", lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "SL" });
    if (trade.tp != null) series.createPriceLine({ price: trade.tp, color: "#22c55e", lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "TP" });
    if (trade.mfe_pips) {
      const p = isLong ? trade.entry_price + trade.mfe_pips * 0.0001 : trade.entry_price - trade.mfe_pips * 0.0001;
      series.createPriceLine({ price: p, color: "#22c55e", lineWidth: 1, lineStyle: 3, axisLabelVisible: false, title: "MFE" });
    }
    if (trade.mae_pips) {
      const p = isLong ? trade.entry_price - trade.mae_pips * 0.0001 : trade.entry_price + trade.mae_pips * 0.0001;
      series.createPriceLine({ price: p, color: "#ec4899", lineWidth: 1, lineStyle: 3, axisLabelVisible: false, title: "MAE" });
    }

    chart.timeScale().fitContent();
    const onResize = () => chartContainerRef.current && chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [trade, ohlcv]);

  if (error) return <div className="flex h-full items-center justify-center text-sm text-zinc-500">{error}</div>;
  return <div ref={chartContainerRef} className="w-full h-full" />;
}
