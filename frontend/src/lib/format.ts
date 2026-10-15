// Single place for dashboard number formats and the account baseline.
import type { Trade } from "@/lib/data-context";

/** Starting balance used for every equity / drawdown calculation.
 *  Keep in sync with START_BALANCE in python/pwcfx/config.py (strategy.json → portfolio.start_balance). */
export const STARTING_BALANCE = 25000;

const MINUS = "−"; // proper minus sign, same width as "+"

/** Whole-dollar amount: "$1,234". With signed: "+$1,234" / "−$1,234". */
export function usd(n: number, opts: { signed?: boolean } = {}): string {
  const v = Math.round(n);
  const body = `$${Math.abs(v).toLocaleString("en-GB")}`;
  if (v < 0) return `${MINUS}${body}`;
  return opts.signed && v > 0 ? `+${body}` : body;
}

/** FX price to 5 decimal places; dash when missing. */
export function price(n: number | null | undefined): string {
  return n == null ? "—" : n.toFixed(5);
}

/** Percentage to 1 decimal place: "46.5%". With signed: "+4.2%" / "−4.2%". */
export function pct(n: number, opts: { signed?: boolean } = {}): string {
  const body = `${Math.abs(n).toFixed(1)}%`;
  if (n < 0 && Math.abs(n) >= 0.05) return `${MINUS}${body}`;
  return opts.signed && n >= 0.05 ? `+${body}` : body;
}

/** R-multiple: "+2.00R" / "−1.00R"; dash when missing. */
export function rMultiple(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n < 0 ? MINUS : "+"}${Math.abs(n).toFixed(2)}R`;
}

/** Trade duration: "5h", "1d 3h". */
export function duration(hours: number | null | undefined): string {
  if (hours == null) return "—";
  const h = Math.round(hours);
  if (h < 24) return `${h}h`;
  return h % 24 === 0 ? `${h / 24}d` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** Text colour for a P&L value. */
export function pnlClass(n: number): string {
  return n > 0 ? "text-green-500" : n < 0 ? "text-pink-500" : "text-zinc-300";
}

/** A trade counts towards stats only once it is closed. */
export function isClosed(t: Trade): boolean {
  return t.status !== "open" && t.exit_time != null;
}
