"use client";

import { useData } from "@/lib/data-context";
import { Trophy, Target, Clock, DollarSign, ArrowRight } from "lucide-react";

export default function PropPage() {
  const { filters } = useData();

  const pairIntel = [
    {
      pair: "EURUSD",
      p1Days: 18,
      p2Days: 12,
      target: "8% Phase 1 / 5% Phase 2",
      fundedPayout: "4% Monthly",
      description: "Steady, highly liquid behavior makes EURUSD ideal for consistent, low-drawdown prop challenges.",
      color: "blue",
      algoRules: [
        "RSI (14) crosses below 30 (Long) or above 70 (Short) on H1 timeframe.",
        "Price interacting with a major Daily Support/Resistance level.",
        "MACD histogram shows divergence against the primary trend."
      ]
    },
    {
      pair: "GBPUSD",
      p1Days: 22,
      p2Days: 15,
      target: "8% Phase 1 / 5% Phase 2",
      fundedPayout: "5% Monthly",
      description: "Higher volatility yields larger percentage returns but requires slightly wider stops and patience.",
      color: "pink",
      algoRules: [
        "Breakout of Asian Session range immediately following London Open.",
        "EMA (20 & 50) crossover confirmed on M15 timeframe.",
        "Execution volume spike exceeds 1.5x the 20-period moving average."
      ]
    },
    {
      pair: "AUDUSD",
      p1Days: 28,
      p2Days: 18,
      target: "8% Phase 1 / 5% Phase 2",
      fundedPayout: "3.5% Monthly",
      description: "Slower trends and Asian session overlap require a longer timeline to pass standard prop firm parameters.",
      color: "green",
      algoRules: [
        "Commodity Channel Index (CCI) reaches <-100 or >+100.",
        "Price closes outside the Bollinger Band (20, 2) extremes.",
        "Trade confirmation via engulfing candlestick pattern on H4."
      ]
    }
  ];

  const visibleIntel = filters.symbol === "All" 
    ? pairIntel 
    : pairIntel.filter(p => p.pair === filters.symbol);

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      
      {/* Intro block */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Prop Firm Passing Lifecycle</h2>
            <p className="text-zinc-400 mt-2 max-w-3xl">
              Estimated timelines and projected performance targets for passing standard 2-step evaluation challenges. 
              These expectations are calculated based on quantitative algorithmic data, average trade frequency, and historical win rates.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleIntel.map(intel => (
          <div key={intel.pair} className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className={`p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center`}>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{intel.pair}</h3>
                <p className="text-sm text-zinc-500">{intel.target}</p>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Clock size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white">Phase 1 (P1)</span>
                    <span className="text-sm font-bold text-zinc-300">~{intel.p1Days} Days</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-zinc-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Clock size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white">Phase 2 (P2)</span>
                    <span className="text-sm font-bold text-zinc-300">~{intel.p2Days} Days</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-zinc-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/50 mt-2">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="text-sm text-zinc-400">Target Funded Payout</div>
                  <div className="text-lg font-bold text-green-500">{intel.fundedPayout}</div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-800/50 text-sm text-zinc-400 leading-relaxed">
                {intel.description}
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Algo Entry Rules</h4>
                <ul className="space-y-2">
                  {intel.algoRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></div>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        ))}
        {visibleIntel.length === 0 && (
          <div className="col-span-3 py-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
            No prop firm intel available for the selected filters.
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center mt-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
          <Target size={24} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">More intel coming soon</h3>
        <p className="text-zinc-500 max-w-md">
          Advanced Prop Firm analytics, drawdown simulators, and broker integration parameters will be added in the next intelligence update.
        </p>
      </div>

    </div>
  );
}
