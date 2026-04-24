import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(amount: number): string {
  if (amount < 0.001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const AGENT_COLORS: Record<string, string> = {
  "Research Agent": "#6366f1",
  "Synthesis Agent": "#8b5cf6",
  "Fact-Check Agent": "#22d3ee",
  "Data Sources": "#eab308",
  Platform: "#64748b",
};

export const AGENT_ICONS: Record<string, string> = {
  "Research Agent": "Search",
  "Synthesis Agent": "Layers",
  "Fact-Check Agent": "ShieldCheck",
  "Data Sources": "Database",
  Platform: "Cpu",
};
