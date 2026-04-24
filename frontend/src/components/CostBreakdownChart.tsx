"use client";

import { formatUSDC, AGENT_COLORS } from "@/lib/utils";
import type { CostBreakdown } from "@/lib/api";

interface CostBreakdownChartProps {
  breakdown: CostBreakdown;
}

const ITEMS = [
  { key: "research" as const, label: "Research Agent", color: AGENT_COLORS["Research Agent"] },
  { key: "synthesis" as const, label: "Synthesis Agent", color: AGENT_COLORS["Synthesis Agent"] },
  { key: "factCheck" as const, label: "Fact-Check Agent", color: AGENT_COLORS["Fact-Check Agent"] },
  { key: "dataSources" as const, label: "Data Sources", color: AGENT_COLORS["Data Sources"] },
  { key: "platform" as const, label: "Platform", color: AGENT_COLORS["Platform"] },
];

export function CostBreakdownChart({ breakdown }: CostBreakdownChartProps) {
  const total = breakdown.total || 1;

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        Cost Breakdown
      </h3>

      {/* Horizontal stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4 bg-muted">
        {ITEMS.map((item) => {
          const pct = (breakdown[item.key] / total) * 100;
          return (
            <div
              key={item.key}
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: item.color }}
            />
          );
        })}
      </div>

      {/* Legend with amounts */}
      <div className="space-y-2">
        {ITEMS.map((item) => {
          const pct = Math.round((breakdown[item.key] / total) * 100);
          return (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-foreground">{formatUSDC(breakdown[item.key])}</span>
                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-sm font-mono font-bold text-accent">{formatUSDC(breakdown.total)}</span>
      </div>
    </div>
  );
}
