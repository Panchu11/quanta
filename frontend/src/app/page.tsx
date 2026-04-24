"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Header } from "@/components/Header";
import { QueryInput } from "@/components/QueryInput";
import { InsightCard } from "@/components/InsightCard";
import { TransactionFeed } from "@/components/TransactionFeed";
import { StatsBar } from "@/components/StatsBar";
import { CostBreakdownChart } from "@/components/CostBreakdownChart";
import { MarginComparison } from "@/components/MarginComparison";
import { AgentPipeline } from "@/components/AgentPipeline";
import { BatchMode } from "@/components/BatchMode";
import {
  createSession,
  submitQuery,
  type QueryResult,
  type WalletSession,
  type QueryTransaction,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

interface PaymentEvent {
  queryId: string;
  agentName: string;
  amount: number;
  timestamp: string;
  txIndex: number;
}

interface AgentStepEvent {
  queryId: string;
  agentName: string;
  status: "started" | "completed" | "failed";
  timestamp: string;
}

export default function Home() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [, setSocket] = useState<Socket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [transactions, setTransactions] = useState<(QueryTransaction & { agentName: string })[]>([]);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalTx, setTotalTx] = useState(0);
  const [showBatch, setShowBatch] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sess = await createSession();
        setSession(sess);
      } catch {
        setSession({
          sessionId: `sim-${Date.now()}`,
          wallet: {
            address: "0x" + "a".repeat(40),
            blockchain: "ARC-TESTNET",
            balance: 100,
            explorerUrl: "https://testnet.arcscan.app",
          },
          isLive: false,
          treasury: {
            address: "0x" + "b".repeat(40),
            explorerUrl: "https://testnet.arcscan.app",
          },
        });
      }
    };
    init();
  }, []);

  useEffect(() => {
    const s = io(API_URL, { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("payment", (data: PaymentEvent) => {
      setTransactions((prev) => [
        { id: `tx-${Date.now()}-${data.txIndex}`, agentName: data.agentName, amount: data.amount, timestamp: data.timestamp },
        ...prev,
      ]);
      setTotalSpent((prev) => prev + data.amount);
      setTotalTx((prev) => prev + 1);
    });

    s.on("agent_step", (data: AgentStepEvent) => {
      setActiveAgents((prev) => {
        const next = new Set(prev);
        if (data.status === "started") next.add(data.agentName);
        else next.delete(data.agentName);
        return next;
      });
    });

    return () => { s.disconnect(); };
  }, []);

  const handleQuery = useCallback(
    async (query: string) => {
      if (!session || isProcessing) return;
      setIsProcessing(true);
      setResult(null);
      setCurrentQuery(query);
      setActiveAgents(new Set());

      try {
        const res = await submitQuery(query, session.sessionId);
        setResult(res);
        setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth" }); }, 300);
      } catch (error) {
        console.error("Query failed:", error);
      } finally {
        setIsProcessing(false);
        setActiveAgents(new Set());
      }
    },
    [session, isProcessing]
  );

  return (
    <div className="min-h-screen bg-grid">
      <Header session={session} totalSpent={totalSpent} totalTx={totalTx} />

      <section className="relative pt-20 pb-12 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            Powered by Arc + Circle Nanopayments
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="text-gradient">Pay per insight,</span>
            <br />
            not per month.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-synthesized intelligence from multiple sources. Simple lookups
            cost $0.001. Deep analysis costs $0.01. Settled in USDC on Arc.
          </p>

          <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} onBatchClick={() => setShowBatch(true)} />
        </div>
      </section>

      <StatsBar totalSpent={totalSpent} totalTx={totalTx} session={session} />

      {(isProcessing || result) && (
        <section className="px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <AgentPipeline activeAgents={activeAgents} isProcessing={isProcessing} currentQuery={currentQuery} />
          </div>
        </section>
      )}

      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6" ref={resultRef}>
            {result && (
              <>
                <InsightCard result={result} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CostBreakdownChart breakdown={result.cost} />
                  <MarginComparison margin={result.margin} txCount={result.metadata.transactionCount} />
                </div>
              </>
            )}
            {!result && !isProcessing && (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4 opacity-20">?</div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">Ask anything</h3>
                <p className="text-muted-foreground/60 max-w-md mx-auto">
                  Each query triggers a multi-agent pipeline. You pay per insight based on complexity.
                </p>
              </div>
            )}
            {isProcessing && !result && (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Processing query...</h3>
                <p className="text-muted-foreground text-sm">Agents are researching, synthesizing, and fact-checking.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <TransactionFeed transactions={transactions} />
          </div>
        </div>
      </section>

      {showBatch && session && (
        <BatchMode
          sessionId={session.sessionId}
          onClose={() => setShowBatch(false)}
          onTransactionsUpdate={(count, cost) => {
            setTotalTx((prev) => prev + count);
            setTotalSpent((prev) => prev + cost);
          }}
        />
      )}
    </div>
  );
}
