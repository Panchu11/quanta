"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Layers } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
  onBatchClick: () => void;
}

const EXAMPLE_QUERIES = [
  "Compare NVIDIA vs AMD across financials and market sentiment",
  "What are the latest breakthroughs in quantum computing?",
  "Analyze the global impact of USDC adoption in emerging markets",
  "What is Apple's current market position vs competitors?",
];

export function QueryInput({ onSubmit, isProcessing, onBatchClick }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-muted border border-border rounded-2xl overflow-hidden">
            <Search className="ml-5 w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything... pay only for the insight"
              className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder-muted-foreground/50 outline-none text-base"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="mr-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Query"
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {EXAMPLE_QUERIES.map((eq, i) => (
          <button
            key={i}
            onClick={() => { setQuery(eq); inputRef.current?.focus(); }}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors truncate max-w-[250px]"
          >
            {eq}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-center">
        <button
          onClick={onBatchClick}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          Batch mode: 50+ transactions demo
        </button>
      </div>
    </div>
  );
}
