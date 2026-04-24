const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

export interface EstimateResult {
  estimatedCost: number;
  complexity: number;
  complexityLabel: string;
  requiredSources: string[];
  category: string;
  breakdown: CostBreakdown;
  margin: MarginAnalysis;
}

export interface CostBreakdown {
  research: number;
  synthesis: number;
  factCheck: number;
  dataSources: number;
  platform: number;
  total: number;
}

export interface MarginAnalysis {
  arcCost: number;
  ethereumL1Cost: number;
  ethereumL2Cost: number;
  visaCost: number;
  subscriptionCost: number;
  savingsVsEthereum: number;
  savingsVsVisa: number;
}

export interface QueryTransaction {
  id: string;
  agentName: string;
  amount: number;
  timestamp: string;
}

export interface QueryResult {
  queryId: string;
  sessionId: string;
  insight: {
    summary: string;
    keyPoints: string[];
    sources: string[];
    confidence: number;
    factCheck: {
      verified: boolean;
      confidence: number;
      corrections: string[];
    };
  };
  cost: CostBreakdown;
  margin: MarginAnalysis;
  metadata: {
    complexity: number;
    complexityLabel: string;
    category: string;
    agentSteps: number;
    transactionCount: number;
    processingTimeMs: number;
  };
  transactions: QueryTransaction[];
}

export interface WalletSession {
  sessionId: string;
  wallet: {
    address: string;
    blockchain: string;
    balance: number;
    explorerUrl: string;
  };
  isLive: boolean;
  treasury: {
    address: string;
    explorerUrl: string;
  };
}

export interface TransactionStats {
  totalTransactions: number;
  totalSpent: number;
  totalQueries: number;
  avgCostPerQuery: number;
  avgTxPerQuery: number;
}

export async function createSession(sessionId?: string): Promise<WalletSession> {
  const res = await fetch(`${API_BASE}/api/wallet/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function estimateQuery(query: string): Promise<EstimateResult> {
  const res = await fetch(
    `${API_BASE}/api/query/estimate?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to estimate");
  return res.json();
}

export async function submitQuery(
  query: string,
  sessionId: string
): Promise<QueryResult> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, sessionId }),
  });
  if (!res.ok) throw new Error("Failed to process query");
  return res.json();
}

export async function submitBatch(
  queries: string[],
  sessionId: string
): Promise<{ results: QueryResult[]; totalCost: number; totalTransactions: number }> {
  const res = await fetch(`${API_BASE}/api/query/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries, sessionId }),
  });
  if (!res.ok) throw new Error("Failed to process batch");
  return res.json();
}

export async function getStats(): Promise<TransactionStats> {
  const res = await fetch(`${API_BASE}/api/transactions/stats`);
  if (!res.ok) throw new Error("Failed to get stats");
  return res.json();
}

export async function getTransactions(): Promise<{ transactions: QueryTransaction[] }> {
  const res = await fetch(`${API_BASE}/api/transactions`);
  if (!res.ok) throw new Error("Failed to get transactions");
  return res.json();
}
