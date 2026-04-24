"use client";

import { Activity, DollarSign, Hash, Wallet } from "lucide-react";
import { formatUSDC, shortenAddress } from "@/lib/utils";
import type { WalletSession } from "@/lib/api";

interface StatsBarProps {
  totalSpent: number;
  totalTx: number;
  session: WalletSession | null;
}

export function StatsBar({ totalSpent, totalTx, session }: StatsBarProps) {
  const stats = [
    {
      icon: Hash,
      label: "Transactions",
      value: totalTx.toString(),
      color: "text-primary",
    },
    {
      icon: DollarSign,
      label: "Total Spent",
      value: formatUSDC(totalSpent),
      color: "text-accent",
    },
    {
      icon: Activity,
      label: "Avg Cost/Query",
      value: totalTx > 0 ? formatUSDC(totalSpent / Math.max(1, Math.floor(totalTx / 4))) : "$0.000",
      color: "text-success",
    },
    {
      icon: Wallet,
      label: "Wallet",
      value: session ? shortenAddress(session.wallet.address) : "Connecting...",
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="px-4 py-4">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <div>
              <div className={`text-sm font-mono font-semibold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
