"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useData } from "@/lib/data-context";

const SIDES = ["All", "Long", "Short"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]; // dayOfWeek 0-4
const RANGES = ["All", "Today", "This Week", "This Month", "Last Month", "This Year"] as const;

/** Secondary filters (side, entry day, date range) tucked into one popover. */
export function FiltersMenu() {
  const { filters, setFilters } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const active =
    (filters.direction !== "All" ? 1 : 0) + (filters.dayOfWeek !== null ? 1 : 0) + (filters.dateRange !== "All" ? 1 : 0);

  const reset = () => setFilters(f => ({ ...f, direction: "All", dayOfWeek: null, dateRange: "All" }));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
          active ? "border-zinc-600 text-white" : "border-zinc-800 text-zinc-400 hover:text-white"
        }`}
        aria-expanded={open}
      >
        <SlidersHorizontal size={14} />
        Filters
        {active > 0 && <span className="tabular-nums text-xs bg-zinc-700 text-white rounded px-1.5">{active}</span>}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4 z-30 shadow-xl shadow-black/40">
          <Group label="Side">
            {SIDES.map(s => (
              <Chip key={s} on={filters.direction === s} onClick={() => setFilters(f => ({ ...f, direction: s }))}>{s}</Chip>
            ))}
          </Group>

          <Group label="Entry day">
            <Chip on={filters.dayOfWeek === null} onClick={() => setFilters(f => ({ ...f, dayOfWeek: null }))}>All</Chip>
            {DAYS.map((d, i) => (
              <Chip key={d} on={filters.dayOfWeek === i} onClick={() => setFilters(f => ({ ...f, dayOfWeek: i }))}>{d}</Chip>
            ))}
          </Group>

          <Group label="Date range">
            {RANGES.map(r => (
              <Chip key={r} on={filters.dateRange === r} onClick={() => setFilters(f => ({ ...f, dateRange: r }))}>{r}</Chip>
            ))}
          </Group>

          {active > 0 && (
            <button onClick={reset} className="text-sm text-zinc-400 hover:text-white">Clear filters</button>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-sm transition-colors ${
        on ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
