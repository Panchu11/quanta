"use client";

import { formatUSDC, AGENT_COLORS } from "@/lib/utils";
import { ArrowDownRight } from "lucide-react";
import type { QueryTransaction } from "@/lib/api";

interface TransactionFeedProps {
  transactions: (QueryTransaction & { agentName: string })[];
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden h-[600px] flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          <h3 className="text-sm font-semibold">Live Transactions</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{transactions.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
            Payments will appear here in real-time
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3 hover:bg-muted/20 transition-colors animate-slide-in">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[tx.agentName] || "#6366f1" }}
                    />
                    <span className="text-sm font-medium">{tx.agentName}</span>
                  </div>
                  <span className="text-sm font-mono text-accent">{formatUSDC(tx.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>USDC on Arc</span>
                  </div>
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
