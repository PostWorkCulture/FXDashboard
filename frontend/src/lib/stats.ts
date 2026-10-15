// Derived series for the dashboard charts. All inputs are CLOSED trades.
import type { Trade } from "@/lib/data-context";
import { STARTING_BALANCE } from "@/lib/format";

export const toDate = (s: string) => new Date(s.replace(" ", "T"));
export const dayKey = (s: string) => s.slice(0, 10); // "YYYY-MM-DD" (broker date)

export function byExit(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => toDate(a.exit_time as string).getTime() - toDate(b.exit_time as string).getTime());
}

export interface EquityPoint {
  date: string;      // YYYY-MM-DD of exit
  equity: number;    // account balance after the day's last exit
  drawdown: number;  // % below running peak (<= 0)
}

/** End-of-day equity and underwater (drawdown %) series. */
export function equitySeries(closed: Trade[]): EquityPoint[] {
  let equity = STARTING_BALANCE;
  let peak = STARTING_BALANCE;
  const out = new Map<string, EquityPoint>();
  for (const t of byExit(closed)) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    const d = dayKey(t.exit_time as string);
    const dd = ((equity - peak) / peak) * 100;
    const prev = out.get(d);
    out.set(d, { date: d, equity, drawdown: prev ? Math.min(prev.drawdown, dd) : dd });
  }
  return Array.from(out.values()).map(p => ({ ...p, equity: Math.round(p.equity), drawdown: Math.round(p.drawdown * 10) / 10 }));
}

/** Net P&L per exit day. */
export function dailyPnl(closed: Trade[]): Map<string, { pnl: number; trades: number }> {
  const m = new Map<string, { pnl: number; trades: number }>();
  for (const t of closed) {
    const d = dayKey(t.exit_time as string);
    const v = m.get(d) ?? { pnl: 0, trades: 0 };
    v.pnl += t.pnl;
    v.trades += 1;
    m.set(d, v);
  }
  return m;
}

export interface YearRow {
  year: number;
  months: (number | null)[]; // % return per month, null = no trades
  total: number;             // compounded % for the year
}

/** Monthly % returns (P&L / equity at month start), compounded into a yearly total. */
export function monthlyReturns(closed: Trade[]): YearRow[] {
  let equity = STARTING_BALANCE;
  const pnlByMonth = new Map<string, { pnl: number; startEq: number }>();
  for (const t of byExit(closed)) {
    const k = (t.exit_time as string).slice(0, 7);
    if (!pnlByMonth.has(k)) pnlByMonth.set(k, { pnl: 0, startEq: equity });
    pnlByMonth.get(k)!.pnl += t.pnl;
    equity += t.pnl;
  }
  const years = new Map<number, YearRow>();
  for (const [k, v] of pnlByMonth) {
    const y = Number(k.slice(0, 4));
    const m = Number(k.slice(5, 7)) - 1;
    if (!years.has(y)) years.set(y, { year: y, months: Array(12).fill(null), total: 0 });
    years.get(y)!.months[m] = (v.pnl / v.startEq) * 100;
  }
  for (const row of years.values()) {
    row.total = (row.months.reduce<number>((acc, r) => acc * (1 + (r ?? 0) / 100), 1) - 1) * 100;
  }
  return Array.from(years.values()).sort((a, b) => b.year - a.year);
}

/** Evenly sample a series down to at most n points (keeps first and last). */
export function sample<T>(xs: T[], n = 60): T[] {
  if (xs.length <= n) return xs;
  const step = (xs.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => xs[Math.round(i * step)]);
}

/** Rolling win rate (%) and profit factor over the last `w` trades, one point per trade. */
export function rolling(closed: Trade[], w = 30): { winRate: number[]; profitFactor: number[] } {
  const xs = byExit(closed);
  const winRate: number[] = [];
  const profitFactor: number[] = [];
  for (let i = w - 1; i < xs.length; i++) {
    const win = xs.slice(i - w + 1, i + 1);
    const gp = win.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const gl = -win.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0);
    winRate.push((win.filter(t => t.pnl > 0).length / w) * 100);
    profitFactor.push(gl > 0 ? Math.min(gp / gl, 5) : 5);
  }
  return { winRate, profitFactor };
}

export interface ChallengePath {
  start: string;
  points: { day: number; pct: number }[];
  outcome: "pass" | "fail" | "open";
  days: number;
}

/**
 * Replays the backtest trade log as prop challenges: a new attempt starts every
 * `everyDays`, each trade's return is its % of account at the time, and the attempt
 * ends at the target (with >= 3 profitable days), the max loss, a daily loss, or the
 * time limit. An approximation of prop_sim.py for drawing paths — not its exact numbers.
 */
export function challengePaths(
  closed: Trade[],
  opts = { target: 8, maxLoss: 10, dailyLoss: 5, windowDays: 180, everyDays: 7, minProfitDays: 3 }
): ChallengePath[] {
  const xs = byExit(closed);
  if (xs.length === 0) return [];
  let eq = STARTING_BALANCE;
  const rets = xs.map(t => {
    const r = t.pnl / eq;
    eq += t.pnl;
    return { entry: toDate(t.entry_time).getTime(), exit: toDate(t.exit_time as string).getTime(), day: dayKey(t.exit_time as string), r };
  });
  const DAY = 86400000;
  const first = new Date(dayKey(xs[0].entry_time) + "T00:00:00").getTime();
  const last = rets[rets.length - 1].exit;
  const out: ChallengePath[] = [];
  for (let s = first; s + opts.windowDays * DAY <= last; s += opts.everyDays * DAY) {
    let e = 1;
    const daily = new Map<string, number>();
    const points = [{ day: 0, pct: 0 }];
    let outcome: ChallengePath["outcome"] = "open";
    let days = opts.windowDays;
    for (const t of rets) {
      if (t.entry < s) continue;
      if (t.exit > s + opts.windowDays * DAY) break;
      e *= 1 + t.r;
      daily.set(t.day, (daily.get(t.day) ?? 0) + t.r);
      const d = Math.round((t.exit - s) / DAY);
      points.push({ day: d, pct: (e - 1) * 100 });
      if ((daily.get(t.day) as number) <= -opts.dailyLoss / 100 || e <= 1 - opts.maxLoss / 100) {
        outcome = "fail"; days = d; break;
      }
      const profitDays = Array.from(daily.values()).filter(v => v > 0).length;
      if (e >= 1 + opts.target / 100 && profitDays >= opts.minProfitDays) {
        outcome = "pass"; days = d; break;
      }
    }
    if (outcome === "open") points.push({ day: opts.windowDays, pct: (e - 1) * 100 });
    out.push({ start: new Date(s).toISOString().slice(0, 10), points, outcome, days });
  }
  return out;
}
