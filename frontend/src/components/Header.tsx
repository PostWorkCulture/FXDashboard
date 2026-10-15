"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/data-context";
import { usePathname } from "next/navigation";
import { nextNewsEvent, type NewsEvent } from "@/lib/news";
import { FiltersMenu } from "@/components/FiltersMenu";

const PAIRS = ["All", "GBPUSD", "AUDUSD"];

export function Header() {
  const { filters, setFilters, dataUpdated } = useData();
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);
  const [nextEvent, setNextEvent] = useState<NewsEvent | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d);
      setNextEvent(nextNewsEvent(d));
    };
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);

  const titleMap: Record<string, string> = {
    "/": "Overview",
    "/trades": "Trades",
    "/analytics": "Analytics",
    "/prop": "Prop",
  };
  const title = titleMap[pathname] || "Dashboard";

  return (
    <header className="min-h-[64px] border-b border-zinc-800/70 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between px-8 py-3 sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-6 shrink-0">
        <h1 className="text-base font-semibold text-white hidden lg:block min-w-[88px]">{title}</h1>

        <div className="flex items-center gap-2 shrink-0">
          <Segmented
            options={[["backtest", "Backtest"], ["live", "Live"]]}
            value={filters.tradeType}
            onChange={v => setFilters(f => ({ ...f, tradeType: v as "backtest" | "live" }))}
          />
          <Segmented
            options={PAIRS.map(p => [p, p === "All" ? "All pairs" : p])}
            value={filters.symbol}
            onChange={v => setFilters(f => ({ ...f, symbol: v }))}
          />
          <FiltersMenu />
        </div>
      </div>

      <div className="flex items-center gap-4 self-start md:self-auto min-w-0 text-sm text-zinc-400">
        {nextEvent !== undefined && (
          <div
            className="flex items-center gap-2 min-w-0 max-w-[22rem]"
            title={nextEvent ? `Next red-folder event (UK time): ${nextEvent.currency} ${nextEvent.event}` : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {nextEvent ? (
              <>
                <span className="text-zinc-300 truncate">{nextEvent.currency} {nextEvent.event}</span>
                <span className="shrink-0 tabular-nums">
                  {new Date(nextEvent.at).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            ) : (
              <span>News calendar needs updating</span>
            )}
          </div>
        )}

        {now && (
          <div className="whitespace-nowrap tabular-nums">
            <span className="text-zinc-300">{now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
            {dataUpdated && (
              <span className="text-zinc-500" title={`Trade data last exported ${dataUpdated.toLocaleString("en-GB")}`}>
                {" · updated "}
                {dataUpdated.toDateString() === now.toDateString()
                  ? dataUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                  : dataUpdated.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function Segmented({ options, value, onChange }: { options: string[][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-zinc-800 p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            value === v ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
