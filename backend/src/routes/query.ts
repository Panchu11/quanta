import { Router, type Request, type Response } from "express";
import { estimateQuery, processQuery } from "../services/query-orchestrator.js";
import { eventBus } from "../index.js";
import { walletManager } from "../services/wallet-manager.js";
import { v4 as uuidv4 } from "uuid";

export const queryRouter = Router();

// Estimate cost before paying
queryRouter.get("/estimate", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  try {
    const estimate = await estimateQuery(query);
    res.json(estimate);
  } catch (error) {
    console.error("[Query] Estimate failed:", error);
    res.status(500).json({ error: "Failed to estimate query cost" });
  }
});

// Process a single query
queryRouter.post("/", async (req: Request, res: Response) => {
  const { query, sessionId } = req.body;

  if (!query) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  const sid = sessionId || uuidv4();

  // Ensure session has a wallet
  await walletManager.createSessionWallet(sid);

  try {
    const result = await processQuery(query, sid, eventBus);
    res.json({ ...result, sessionId: sid });
  } catch (error) {
    console.error("[Query] Processing failed:", error);
    res.status(500).json({ error: "Failed to process query" });
  }
});

// Batch queries
queryRouter.post("/batch", async (req: Request, res: Response) => {
  const { queries, sessionId } = req.body;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    res.status(400).json({ error: "Array of queries is required" });
    return;
  }

  if (queries.length > 25) {
    res.status(400).json({ error: "Maximum 25 queries per batch" });
    return;
  }

  const sid = sessionId || uuidv4();
  await walletManager.createSessionWallet(sid);

  try {
    const results = [];
    for (const q of queries) {
      const result = await processQuery(q, sid, eventBus);
      results.push(result);
    }

    const totalCost = results.reduce((sum, r) => sum + r.cost.total, 0);
    const totalTx = results.reduce(
      (sum, r) => sum + r.metadata.transactionCount,
      0
    );

    res.json({
      results,
      totalCost: Math.round(totalCost * 1000000) / 1000000,
      totalTransactions: totalTx,
      queryCount: results.length,
      sessionId: sid,
    });
  } catch (error) {
    console.error("[Query] Batch processing failed:", error);
    res.status(500).json({ error: "Failed to process batch" });
  }
});
