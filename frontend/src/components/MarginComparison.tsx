"use client";

import { formatUSDC } from "@/lib/utils";
import type { MarginAnalysis } from "@/lib/api";

interface MarginComparisonProps {
  margin: MarginAnalysis;
  txCount: number;
}

export function MarginComparison({ margin, txCount }: MarginComparisonProps) {
  const methods = [
    {
      name: "Quanta (Arc)",
      cost: margin.arcCost,
      bar: 1,
      highlight: true,
      note: `${txCount} txns, $0 gas`,
    },
    {
      name: "Ethereum L2",
      cost: margin.ethereumL2Cost,
      bar: Math.min(margin.ethereumL2Cost / Math.max(margin.arcCost, 0.0001), 50),
      highlight: false,
      note: `~$0.02/tx gas`,
    },
    {
      name: "Visa / Stripe",
      cost: margin.visaCost,
      bar: Math.min(margin.visaCost / Math.max(margin.arcCost, 0.0001), 100),
      highlight: false,
      note: `$0.30 min/tx`,
    },
    {
      name: "Ethereum L1",
      cost: margin.ethereumL1Cost,
      bar: Math.min(margin.ethereumL1Cost / Math.max(margin.arcCost, 0.0001), 200),
      highlight: false,
      note: `~$2.50/tx gas`,
    },
    {
      name: "API Subscription",
      cost: margin.subscriptionCost,
      bar: Math.min(margin.subscriptionCost / Math.max(margin.arcCost, 0.0001), 100),
      highlight: false,
      note: `$99/mo amortized`,
    },
  ];

  const maxBar = Math.max(...methods.map((m) => m.bar));

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
        Margin Analysis
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Why this model fails without Arc&apos;s USDC-native gas
      </p>

      <div className="space-y-3">
        {methods.map((method) => {
          const barWidth = Math.max(2, (method.bar / maxBar) * 100);
          return (
            <div key={method.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className={method.highlight ? "font-semibold text-success" : "text-muted-foreground"}>
                  {method.name}
                </span>
                <span className={`font-mono ${method.highlight ? "text-success font-bold" : "text-foreground"}`}>
                  {method.cost < 0.01 ? formatUSDC(method.cost) : `$${method.cost.toFixed(2)}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    method.highlight
                      ? "bg-success glow-success"
                      : "bg-danger/60"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">{method.note}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <div className="text-2xl font-bold text-success">{Math.round(margin.savingsVsEthereum)}%</div>
        <div className="text-xs text-muted-foreground">cheaper than Ethereum L1</div>
      </div>
    </div>
  );
}
