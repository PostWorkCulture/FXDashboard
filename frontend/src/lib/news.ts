// High-impact (red folder) events for EUR, GBP, AUD and USD.
// The header only shows currencies the EA trades (see TRADED_CURRENCIES).
// Times are UK local time (Europe/London). Keep sorted by `at`.
export interface NewsEvent {
  at: string; // "YYYY-MM-DDTHH:mm", UK time
  currency: string;
  event: string;
  forecast?: string;
  previous?: string;
}

export const NEWS_EVENTS: NewsEvent[] = [
  { at: "2026-10-13T01:30", currency: "AUD", event: "RBA Meeting Minutes", forecast: "-", previous: "-" },
  { at: "2026-10-13T14:00", currency: "USD", event: "FOMC Member Waller Speaks", forecast: "-", previous: "-" },
  { at: "2026-10-14T13:30", currency: "USD", event: "CPI m/m & y/y", forecast: "0.6%", previous: "0.4%" },
  { at: "2026-10-14T13:30", currency: "USD", event: "Core CPI m/m & y/y", forecast: "0.2%", previous: "0.3%" },
  { at: "2026-10-14T15:30", currency: "GBP", event: "BoE Governor Bailey Speaks", forecast: "-", previous: "-" },
  { at: "2026-10-15T01:30", currency: "AUD", event: "Employment Change & Unemployment Rate", forecast: "25.0K", previous: "47.5K" },
  { at: "2026-10-15T13:30", currency: "USD", event: "Retail Sales m/m", forecast: "0.3%", previous: "0.1%" },
  { at: "2026-10-15T13:30", currency: "USD", event: "PPI m/m & Core PPI", forecast: "0.2%", previous: "0.2%" },
  { at: "2026-10-15T13:30", currency: "USD", event: "Unemployment Claims", forecast: "205K", previous: "200K" },
  { at: "2026-10-16T10:00", currency: "EUR", event: "Eurozone Final CPI y/y", forecast: "1.8%", previous: "2.2%" },
  { at: "2026-10-20T07:00", currency: "GBP", event: "Claimant Count Change & Unemployment Rate", forecast: "12.5K", previous: "15.2K" },
  { at: "2026-10-20T10:00", currency: "EUR", event: "German ZEW Economic Sentiment", forecast: "36.5", previous: "34.7" },
  { at: "2026-10-21T07:00", currency: "GBP", event: "CPI y/y (UK Inflation)", forecast: "2.1%", previous: "2.2%" },
  { at: "2026-10-22T13:30", currency: "USD", event: "Unemployment Claims", forecast: "208K", previous: "205K" },
  { at: "2026-10-23T08:30", currency: "EUR", event: "Flash Manufacturing & Services PMI", forecast: "46.2", previous: "45.8" },
  { at: "2026-10-23T09:30", currency: "GBP", event: "Flash Manufacturing & Services PMI", forecast: "51.8", previous: "51.5" },
  { at: "2026-10-23T14:45", currency: "USD", event: "Flash Manufacturing & Services PMI", forecast: "50.2", previous: "49.8" },
  { at: "2026-10-28T01:30", currency: "AUD", event: "CPI q/q (Australia Q3 Inflation)", forecast: "0.8%", previous: "1.0%" },
  { at: "2026-10-28T19:00", currency: "USD", event: "Federal Reserve (FOMC) Rate Decision", forecast: "4.75%", previous: "5.00%" },
  { at: "2026-10-28T19:30", currency: "USD", event: "FOMC Press Conference", forecast: "-", previous: "-" },
  { at: "2026-10-29T13:15", currency: "EUR", event: "ECB Interest Rate Decision", forecast: "3.25%", previous: "3.50%" },
  { at: "2026-10-29T13:30", currency: "USD", event: "Advance GDP q/q", forecast: "2.8%", previous: "3.0%" },
];

export const TRADED_CURRENCIES = ["GBP", "AUD", "USD"];

/** The next event for a traded currency at or after `now`, or null if the list has run out. */
export function nextNewsEvent(now: Date = new Date()): NewsEvent | null {
  return NEWS_EVENTS.find(e => TRADED_CURRENCIES.includes(e.currency) && new Date(e.at) >= now) ?? null;
}
