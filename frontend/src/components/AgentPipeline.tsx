"use client";

import { Search, Layers, ShieldCheck, Database, Cpu, ArrowRight } from "lucide-react";

interface AgentPipelineProps {
  activeAgents: Set<string>;
  isProcessing: boolean;
  currentQuery: string;
}

const AGENTS = [
  { name: "Research Agent", icon: Search, color: "#6366f1" },
  { name: "Data Sources", icon: Database, color: "#eab308" },
  { name: "Synthesis Agent", icon: Layers, color: "#8b5cf6" },
  { name: "Fact-Check Agent", icon: ShieldCheck, color: "#22d3ee" },
  { name: "Platform", icon: Cpu, color: "#64748b" },
];

export function AgentPipeline({ activeAgents, isProcessing, currentQuery }: AgentPipelineProps) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Agent Pipeline
        </h3>
        {isProcessing && (
          <span className="text-xs text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            Processing
          </span>
        )}
      </div>

      {currentQuery && (
        <div className="text-xs text-muted-foreground mb-4 px-3 py-2 rounded-lg bg-muted/30 border border-border truncate">
          Query: &ldquo;{currentQuery}&rdquo;
        </div>
      )}

      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {AGENTS.map((agent, i) => {
          const isActive = activeAgents.has(agent.name);
          const Icon = agent.icon;

          return (
            <div key={agent.name} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? "border-primary/50 bg-primary/10 scale-105"
                    : "border-border bg-muted/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: isActive ? `${agent.color}20` : "transparent",
                  }}
                >
                  <Icon
                    className="w-4 h-4 transition-colors"
                    style={{ color: isActive ? agent.color : "#8b8b9e" }}
                  />
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {agent.name.replace(" Agent", "")}
                </span>
                {isActive && (
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:100ms]" />
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:200ms]" />
                  </div>
                )}
              </div>

              {i < AGENTS.length - 1 && (
                <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
