import { v4 as uuidv4 } from "uuid";

export interface Transaction {
  id: string;
  queryId: string;
  agentName: string;
  amount: number;
  currency: string;
  fromAddress: string;
  toAddress: string;
  status: "pending" | "settled" | "failed";
  txHash?: string;
  arcExplorerUrl?: string;
  timestamp: string;
}

export interface QueryRecord {
  id: string;
  query: string;
  complexity: number;
  category: string;
  totalCost: number;
  transactions: Transaction[];
  startTime: string;
  endTime?: string;
  duration?: number;
  status: "processing" | "completed" | "failed";
}

class TransactionStore {
  private transactions: Transaction[] = [];
  private queries: Map<string, QueryRecord> = new Map();
  private totalSpent = 0;

  createQuery(
    query: string,
    complexity: number,
    category: string
  ): QueryRecord {
    const record: QueryRecord = {
      id: uuidv4(),
      query,
      complexity,
      category,
      totalCost: 0,
      transactions: [],
      startTime: new Date().toISOString(),
      status: "processing",
    };
    this.queries.set(record.id, record);
    return record;
  }

  addTransaction(
    queryId: string,
    agentName: string,
    amount: number,
    fromAddress: string,
    toAddress: string
  ): Transaction {
    const tx: Transaction = {
      id: uuidv4(),
      queryId,
      agentName,
      amount,
      currency: "USDC",
      fromAddress,
      toAddress,
      status: "settled",
      txHash: `0x${uuidv4().replace(/-/g, "")}`,
      arcExplorerUrl: `https://testnet.arcscan.app/tx/0x${uuidv4().replace(/-/g, "")}`,
      timestamp: new Date().toISOString(),
    };

    this.transactions.push(tx);
    this.totalSpent += amount;

    const queryRecord = this.queries.get(queryId);
    if (queryRecord) {
      queryRecord.transactions.push(tx);
      queryRecord.totalCost += amount;
    }

    return tx;
  }

  completeQuery(queryId: string): QueryRecord | undefined {
    const record = this.queries.get(queryId);
    if (record) {
      record.endTime = new Date().toISOString();
      record.duration =
        new Date(record.endTime).getTime() -
        new Date(record.startTime).getTime();
      record.status = "completed";
    }
    return record;
  }

  getRecentTransactions(limit = 50): Transaction[] {
    return this.transactions.slice(-limit).reverse();
  }

  getQueryRecord(queryId: string): QueryRecord | undefined {
    return this.queries.get(queryId);
  }

  getAllQueries(): QueryRecord[] {
    return Array.from(this.queries.values()).reverse();
  }

  getStats(): {
    totalTransactions: number;
    totalSpent: number;
    totalQueries: number;
    avgCostPerQuery: number;
    avgTxPerQuery: number;
  } {
    const totalQueries = this.queries.size;
    return {
      totalTransactions: this.transactions.length,
      totalSpent: Math.round(this.totalSpent * 1000000) / 1000000,
      totalQueries,
      avgCostPerQuery: totalQueries > 0
        ? Math.round((this.totalSpent / totalQueries) * 1000000) / 1000000
        : 0,
      avgTxPerQuery: totalQueries > 0
        ? Math.round((this.transactions.length / totalQueries) * 100) / 100
        : 0,
    };
  }
}

export const transactionStore = new TransactionStore();
