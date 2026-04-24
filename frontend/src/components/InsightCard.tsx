"use client";

import { CheckCircle, AlertTriangle, Clock, Tag, Brain, ShieldCheck } from "lucide-react";
import { formatUSDC, formatDuration } from "@/lib/utils";
import type { QueryResult } from "@/lib/api";

interface InsightCardProps {
  result: QueryResult;
}

export function InsightCard({ result }: InsightCardProps) {
  const { insight, metadata, cost } = result;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-count-up">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{metadata.complexityLabel}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {metadata.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(metadata.processingTimeMs)}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {formatUSDC(cost.total)}
          </span>
          <span className="font-mono">{metadata.transactionCount} txns</span>
        </div>
      </div>

      {/* Main insight */}
      <div className="p-6">
        <div className="prose prose-invert prose-sm max-w-none mb-6">
          {insight.summary.split("\n").map((p, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Key points */}
        {insight.keyPoints.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Key Insights
            </h4>
            <div className="grid gap-2">
              {insight.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-foreground/80">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fact-check badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <ShieldCheck className={`w-5 h-5 ${insight.factCheck.verified ? "text-success" : "text-warning"}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {insight.factCheck.verified ? "Fact-checked" : "Review suggested"}
              </span>
              {insight.factCheck.verified ? (
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(insight.factCheck.confidence * 100)}% | Powered by Featherless AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
