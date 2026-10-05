"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface Trade {
  id: number;
  trade_type: string;
  symbol: string;
  direction: string;
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  is_win: boolean;
}

interface FilterState {
  tradeType: "backtest" | "live";
  symbol: string; // "All" or specific symbol
  direction: string; // "All", "Long", "Short"
  dayOfWeek: number | null; // null for all, 0-6 for Mon-Sun
  dateRange: { from: string | null; to: string | null };
}

interface DataContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  rawTrades: Trade[];
  filteredTrades: Trade[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    tradeType: "backtest",
    symbol: "All",
    direction: "All",
    dayOfWeek: null,
    dateRange: { from: null, to: null }
  });
  
  const [rawTrades, setRawTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch raw trades based on tradeType toggle
  useEffect(() => {
    const fetchTrades = async () => {
      setIsLoading(true);
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/FXDashboard" : "";
        const res = await fetch(`${basePath}/data/raw_trades-${filters.tradeType}.json`);
        if (res.ok) {
          const data = await res.json();
          setRawTrades(data);
        } else {
          setRawTrades([]);
        }
      } catch (err) {
        console.error("Failed to load trades", err);
        setRawTrades([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrades();
  }, [filters.tradeType]);

  // Apply all other filters in memory
  const filteredTrades = useMemo(() => {
    return rawTrades.filter(t => {
      // Symbol filter
      if (filters.symbol !== "All" && t.symbol !== filters.symbol) return false;
      
      // Direction filter
      if (filters.direction !== "All" && t.direction !== filters.direction) return false;
      
      // Day of Week filter (based on entry_time)
      if (filters.dayOfWeek !== null) {
        const entryDate = new Date(t.entry_time.replace(" ", "T")); // simple ISO parsing
        // In JS Date, 0 is Sunday, 1 is Monday. 
        // We want 0=Mon, 6=Sun to match Python/Recharts if we used that.
        // Let's standardise: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        const jsDay = entryDate.getDay();
        const adjustedDay = jsDay === 0 ? 6 : jsDay - 1;
        if (adjustedDay !== filters.dayOfWeek) return false;
      }
      
      // Date Range filter
      if (filters.dateRange.from) {
        const tDate = new Date(t.entry_time.replace(" ", "T"));
        const fromDate = new Date(filters.dateRange.from);
        if (tDate < fromDate) return false;
      }
      if (filters.dateRange.to) {
        const tDate = new Date(t.entry_time.replace(" ", "T"));
        const toDate = new Date(filters.dateRange.to);
        // Add 1 day to 'to' date to include the whole day
        toDate.setDate(toDate.getDate() + 1);
        if (tDate >= toDate) return false;
      }
      
      return true;
    });
  }, [rawTrades, filters]);

  return (
    <DataContext.Provider value={{ filters, setFilters, rawTrades, filteredTrades, isLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
