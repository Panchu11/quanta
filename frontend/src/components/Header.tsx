"use client";

import { Zap, Wallet, ExternalLink } from "lucide-react";
import { formatUSDC, shortenAddress } from "@/lib/utils";
import type { WalletSession } from "@/lib/api";

interface HeaderProps {
  session: WalletSession | null;
  totalSpent: number;
  totalTx: number;
}

export function Header({ session, totalSpent, totalTx }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Quanta</span>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Arc Testnet
          </span>
        </div>

        <div className="flex items-center gap-4">
          {totalTx > 0 && (
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-mono text-success">{totalTx}</span>
                <span>txns</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-mono text-accent">{formatUSDC(totalSpent)}</span>
                <span>spent</span>
              </div>
            </div>
          )}

          {session && (
            <a
              href={session.wallet.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs">{shortenAddress(session.wallet.address)}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
