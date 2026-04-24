import { Router, type Request, type Response } from "express";
import { transactionStore } from "../services/transaction-store.js";

export const transactionRouter = Router();

// Get recent transactions
transactionRouter.get("/", (_req: Request, res: Response) => {
  const rawLimit = _req.query.limit;
  const limit = parseInt((Array.isArray(rawLimit) ? rawLimit[0] : rawLimit) as string || "50", 10);
  const transactions = transactionStore.getRecentTransactions(limit);
  res.json({ transactions });
});

// Get aggregate stats
transactionRouter.get("/stats", (_req: Request, res: Response) => {
  const stats = transactionStore.getStats();
  res.json(stats);
});

// Get specific query details
transactionRouter.get("/query/:queryId", (req: Request, res: Response) => {
  const queryId = req.params.queryId as string;
  const record = transactionStore.getQueryRecord(queryId);

  if (!record) {
    res.status(404).json({ error: "Query not found" });
    return;
  }

  res.json(record);
});

// Get all queries
transactionRouter.get("/queries", (_req: Request, res: Response) => {
  const queries = transactionStore.getAllQueries();
  res.json({ queries });
});
