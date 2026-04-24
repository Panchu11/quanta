"use client";

import { useState } from "react";
import { X, Play, Loader2, CheckCircle } from "lucide-react";
import { submitBatch } from "@/lib/api";
import { formatUSDC } from "@/lib/utils";

interface BatchModeProps {
  sessionId: string;
  onClose: () => void;
  onTransactionsUpdate: (count: number, cost: number) => void;
}

const DEMO_QUERIES = [
  "What is NVIDIA's current market cap and P/E ratio?",
  "Compare Tesla vs BYD in global EV market share",
  "Latest breakthroughs in nuclear fusion energy",
  "What is the current state of AI regulation in the EU?",
  "Analyze Bitcoin vs Ethereum performance this year",
  "What are the top 5 fastest growing tech startups?",
  "Impact of USDC adoption on cross-border payments",
  "Compare AWS vs Azure vs GCP market share",
  "Current state of quantum computing research",
  "What is Circle's role in the stablecoin ecosystem?",
  "Analyze the global semiconductor supply chain",
  "Impact of AI on healthcare diagnostics",
  "Compare React vs Next.js adoption trends",
  "Current renewable energy investment trends globally",
  "What is the state of autonomous vehicle technology?",
];

export function BatchMode({ sessionId, onClose, onTransactionsUpdate }: BatchModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTxns, setTotalTxns] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedCount, setSelectedCount] = useState(10);

  const handleRun = async () => {
    setIsRunning(true);
    setProgress(0);
    setTotalCost(0);
    setTotalTxns(0);

    const queries = DEMO_QUERIES.slice(0, selectedCount);

    try {
      const result = await submitBatch(queries, sessionId);
      setTotalCost(result.totalCost);
      setTotalTxns(result.totalTransactions);
      setProgress(100);
      setCompleted(true);
      onTransactionsUpdate(result.totalTransactions, result.totalCost);
    } catch (error) {
      console.error("Batch failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Batch Query Mode</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Run multiple queries at once to demonstrate high-frequency nanopayments.
            Each query generates 3-5 transactions on Arc.
          </p>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Number of queries: {selectedCount}
            </label>
            <input
              type="range"
              min="5"
              max="15"
              value={selectedCount}
              onChange={(e) => setSelectedCount(parseInt(e.target.value))}
              className="w-full accent-primary"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5 queries (~20 txns)</span>
              <span>15 queries (~60+ txns)</span>
            </div>
          </div>

          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
            {DEMO_QUERIES.slice(0, selectedCount).map((q, i) => (
              <div key={i} className="text-xs text-muted-foreground py-1 flex items-start gap-2">
                <span className="text-primary font-mono w-5">{i + 1}.</span>
                <span>{q}</span>
              </div>
            ))}
          </div>

          {completed && (
            <div className="mb-4 p-4 rounded-xl border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-semibold text-success">Batch Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Transactions</div>
                  <div className="font-mono font-bold text-lg">{totalTxns}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Cost</div>
                  <div className="font-mono font-bold text-lg text-accent">{formatUSDC(totalCost)}</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running batch...
              </>
            ) : completed ? (
              <>
                <Play className="w-4 h-4" />
                Run Again
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run {selectedCount} Queries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
