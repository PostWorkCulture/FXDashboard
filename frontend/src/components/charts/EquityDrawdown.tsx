"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { EquityPoint } from "@/lib/stats";
import { STARTING_BALANCE, usd, pct } from "@/lib/format";

const GREEN = "#22c55e";
const PINK = "#ec4899";
const AXIS = { stroke: "#71717a", fontSize: 11, tickLine: false, axisLine: false } as const;
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Equity curve with an "underwater" drawdown chart beneath it, sharing one hover line. */
export function EquityDrawdown({ data }: { data: EquityPoint[] }) {
  if (data.length === 0) return null;

  const eqs = data.map(d => d.equity);
  const lo = Math.min(...eqs, STARTING_BALANCE);
  const hi = Math.max(...eqs, STARTING_BALANCE);
  const step = hi - lo > 40000 ? 20000 : hi - lo > 10000 ? 5000 : 1000;
  const domain: [number, number] = [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  // Where the start line falls (0 = top, 1 = bottom) so the fill turns pink below it
  const split = hi === lo ? 0 : Math.min(1, Math.max(0, (domain[1] - STARTING_BALANCE) / (domain[1] - domain[0])));
  const worst = Math.min(...data.map(d => d.drawdown));

  return (
    <div className="w-full">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId="equity" margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="eqStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={split} stopColor={GREEN} />
                <stop offset={split} stopColor={PINK} />
              </linearGradient>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={GREEN} stopOpacity={0.22} />
                <stop offset={split} stopColor={GREEN} stopOpacity={0.02} />
                <stop offset={split} stopColor={PINK} stopOpacity={0.02} />
                <stop offset="1" stopColor={PINK} stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f1f23" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis {...AXIS} domain={domain} allowDecimals={false} width={72} tickFormatter={v => usd(v)} />
            <Tooltip
              cursor={{ stroke: "#52525b", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as EquityPoint;
                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs tabular-nums space-y-0.5">
                    <div className="text-zinc-400">{fmtDate(p.date)}</div>
                    <div className="text-white">Equity {usd(p.equity)}</div>
                    <div className="text-zinc-400">Return {pct(((p.equity - STARTING_BALANCE) / STARTING_BALANCE) * 100, { signed: true })}</div>
                    <div className="text-zinc-400">Drawdown {p.drawdown === 0 ? "at peak" : pct(p.drawdown)}</div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={STARTING_BALANCE} stroke="#3f3f46" strokeDasharray="3 3"
              label={{ position: "insideTopRight", value: `Start ${usd(STARTING_BALANCE)}`, fill: "#71717a", fontSize: 11 }} />
            <Area type="monotone" dataKey="equity" stroke="url(#eqStroke)" strokeWidth={2} fill="url(#eqFill)"
              baseValue={domain[0]} dot={false} activeDot={{ r: 4, stroke: "#09090b", strokeWidth: 2, fill: "#fafafa" }}
              isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-baseline justify-between mt-4 mb-1">
        <span className="text-xs text-zinc-500">Drawdown from peak</span>
        <span className="text-xs text-zinc-500 tabular-nums">worst {pct(worst)}</span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId="equity" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PINK} stopOpacity={0.05} />
                <stop offset="1" stopColor={PINK} stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f1f23" vertical={false} />
            <XAxis dataKey="date" {...AXIS} minTickGap={60}
              tickFormatter={d => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "2-digit" })} />
            <YAxis {...AXIS} width={72} domain={[Math.floor(worst / 10) * 10, 0]} tickFormatter={v => (v === 0 ? "0%" : `\u2212${Math.abs(Math.round(v))}%`)} tickCount={3} />
            <Tooltip cursor={{ stroke: "#52525b", strokeWidth: 1 }} content={() => null} />
            <Area type="monotone" dataKey="drawdown" stroke={PINK} strokeWidth={1.5} fill="url(#ddFill)" baseValue={0}
              dot={false} activeDot={{ r: 3, stroke: "#09090b", strokeWidth: 2, fill: PINK }} isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
