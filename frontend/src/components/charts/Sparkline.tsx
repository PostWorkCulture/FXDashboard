"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Tiny trend line drawn behind a KPI. Pure SVG, no axes. */
export function Sparkline({ values, color = "#a1a1aa", baseline }: { values: number[]; color?: string; baseline?: number }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const W = 100, H = 32;
  const lo = Math.min(...values, baseline ?? Infinity);
  const hi = Math.max(...values, baseline ?? -Infinity);
  const y = (v: number) => (hi === lo ? H / 2 : H - ((v - lo) / (hi - lo)) * (H - 2) - 1);
  const x = (i: number) => (i / (values.length - 1)) * W;
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-8 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sf${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.25} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {baseline !== undefined && (
        <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} stroke="#3f3f46" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      )}
      <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#sf${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Animates a number from 0 to `target` on mount / change (skipped for reduced motion). */
export function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(target);
  const from = useRef(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(a + (target - a) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
