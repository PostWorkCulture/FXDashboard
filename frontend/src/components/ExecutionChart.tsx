"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";
import { createSeriesMarkers } from "lightweight-charts";

interface ExecutionChartProps {
  trade: any;
}

export function ExecutionChart({ trade }: ExecutionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [ohlcv, setOhlcv] = useState<any[]>([]);

  // Fetch OHLCV for the specific symbol
  useEffect(() => {
    const fetchOhlcv = async () => {
      const basePath = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
      const symbolFile = trade.symbol.toLowerCase();
      try {
        const res = await fetch(`${basePath}/data/${symbolFile}_h1_candles.json`);
        if (res.ok) {
          const data = await res.json();
          setOhlcv(data);
        }
      } catch (err) {
        console.error("Failed to load OHLCV data", err);
      }
    };
    fetchOhlcv();
  }, [trade.symbol]);

  useEffect(() => {
    if (!chartContainerRef.current || ohlcv.length === 0) return;

    // Find the slice of data around the trade
    const entryUnix = new Date(trade.entry_time.replace(" ", "T")).getTime() / 1000;
    const exitUnix = new Date(trade.exit_time.replace(" ", "T")).getTime() / 1000;

    const entryIndex = ohlcv.findIndex(c => c.time >= entryUnix);
    const exitIndex = ohlcv.findIndex(c => c.time >= exitUnix);
    
    if (entryIndex === -1 || exitIndex === -1) return;

    // Pad 20 candles before and 20 after
    const startIdx = Math.max(0, entryIndex - 20);
    const endIdx = Math.min(ohlcv.length - 1, exitIndex + 20);
    const chartData = ohlcv.slice(startIdx, endIdx + 1);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#A1A1AA', // zinc-400
      },
      grid: {
        vertLines: { color: '#27272a' }, // zinc-800
        horzLines: { color: '#27272a' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#27272a',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(chartData);

    // Markers for Entry and Exit
    createSeriesMarkers(candlestickSeries, [
      {
        time: entryUnix as any,
        position: trade.direction === "Long" ? 'belowBar' : 'aboveBar',
        color: trade.direction === "Long" ? '#3b82f6' : '#8b5cf6',
        shape: trade.direction === "Long" ? 'arrowUp' : 'arrowDown',
        text: 'Entry',
      },
      {
        time: exitUnix as any,
        position: trade.direction === "Long" ? 'aboveBar' : 'belowBar',
        color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
        shape: 'circle',
        text: 'Exit',
      }
    ]);

    // Draw Price Lines for Entry, Stop Loss, Take Profit
    // Since we don't have explicit SL/TP prices saved, we can use MFE/MAE to estimate the bounds
    const isLong = trade.direction === "Long";
    const mfePrice = isLong ? trade.entry_price + (trade.mfe_pips * 0.0001) : trade.entry_price - (trade.mfe_pips * 0.0001);
    const maePrice = isLong ? trade.entry_price - (trade.mae_pips * 0.0001) : trade.entry_price + (trade.mae_pips * 0.0001);

    candlestickSeries.createPriceLine({
      price: trade.entry_price,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Entry',
    });

    if (trade.mfe_pips > 0) {
      candlestickSeries.createPriceLine({
        price: mfePrice,
        color: '#22c55e',
        lineWidth: 1,
        lineStyle: 3, // Dotted
        axisLabelVisible: true,
        title: 'MFE',
      });
    }

    if (trade.mae_pips > 0) {
      candlestickSeries.createPriceLine({
        price: maePrice,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'MAE',
      });
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trade, ohlcv]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
