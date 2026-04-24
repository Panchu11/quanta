import { analyzeQuery, researchAgent, synthesisAgent } from "../agents/gemini-agents.js";
import { factCheckAgent } from "../agents/featherless-agents.js";
import {
  calculatePrice,
  allocateCosts,
  calculateMargin,
  complexityToLabel,
  type CostBreakdown,
  type MarginAnalysis,
} from "./pricing-engine.js";
import { transactionStore } from "./transaction-store.js";
import { walletManager } from "./wallet-manager.js";
import type { EventBus } from "./event-bus.js";

export interface QueryResult {
  queryId: string;
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
  transactions: Array<{
    id: string;
    agentName: string;
    amount: number;
    timestamp: string;
  }>;
}

export interface EstimateResult {
  estimatedCost: number;
  complexity: number;
  complexityLabel: string;
  requiredSources: string[];
  category: string;
  breakdown: CostBreakdown;
  margin: MarginAnalysis;
}

export async function estimateQuery(query: string): Promise<EstimateResult> {
  const analysis = await analyzeQuery(query);

  const totalPrice = calculatePrice({
    complexity: analysis.complexity,
    sourceCount: analysis.requiredSources.length,
    modelCost: 1,
    tokenEstimate: analysis.tokenEstimate,
  });

  const breakdown = allocateCosts(totalPrice);
  const estimatedTxCount = analysis.subTasks.length + 2; // research per task + synthesis + factcheck
  const margin = calculateMargin(totalPrice, estimatedTxCount);

  return {
    estimatedCost: totalPrice,
    complexity: analysis.complexity,
    complexityLabel: complexityToLabel(analysis.complexity),
    requiredSources: analysis.requiredSources,
    category: analysis.category,
    breakdown,
    margin,
  };
}

export async function processQuery(
  query: string,
  sessionId: string,
  eventBus: EventBus
): Promise<QueryResult> {
  const startTime = Date.now();

  // Step 1: Analyze query
  const analysis = await analyzeQuery(query);

  const totalPrice = calculatePrice({
    complexity: analysis.complexity,
    sourceCount: analysis.requiredSources.length,
    modelCost: 1,
    tokenEstimate: analysis.tokenEstimate,
  });

  const breakdown = allocateCosts(totalPrice);

  // Create query record
  const queryRecord = transactionStore.createQuery(
    query,
    analysis.complexity,
    analysis.category
  );

  const treasuryAddr = walletManager.getTreasuryAddress();
  const sessionWallet = walletManager.getSessionWallet(sessionId);
  const userAddr = sessionWallet?.wallet.address || "0x_user";

  // Emit query start
  eventBus.emitQueryStart({
    queryId: queryRecord.id,
    query,
    estimatedCost: totalPrice,
    complexity: analysis.complexity,
    timestamp: new Date().toISOString(),
  });

  // Step 2: Research agents (one per sub-task)
  const researchResults = [];
  let txIndex = 0;

  for (const task of analysis.subTasks) {
    eventBus.emitAgentStep({
      queryId: queryRecord.id,
      agentName: "Research Agent",
      status: "started",
      timestamp: new Date().toISOString(),
    });

    const result = await researchAgent(task, analysis.requiredSources);
    researchResults.push(result);

    // Record nanopayment for this research step
    const researchCost = breakdown.research / analysis.subTasks.length;
    const tx = transactionStore.addTransaction(
      queryRecord.id,
      "Research Agent",
      researchCost,
      userAddr,
      treasuryAddr
    );

    txIndex++;
    eventBus.emitPayment({
      queryId: queryRecord.id,
      agentName: "Research Agent",
      amount: researchCost,
      timestamp: tx.timestamp,
      txIndex,
    });

    eventBus.emitAgentStep({
      queryId: queryRecord.id,
      agentName: "Research Agent",
      status: "completed",
      timestamp: new Date().toISOString(),
    });

    // Small delay for visual effect in dashboard
    await sleep(200);
  }

  // Data source payment
  const dataTx = transactionStore.addTransaction(
    queryRecord.id,
    "Data Sources",
    breakdown.dataSources,
    userAddr,
    treasuryAddr
  );
  txIndex++;
  eventBus.emitPayment({
    queryId: queryRecord.id,
    agentName: "Data Sources",
    amount: breakdown.dataSources,
    timestamp: dataTx.timestamp,
    txIndex,
  });
  await sleep(150);

  // Step 3: Synthesis
  eventBus.emitAgentStep({
    queryId: queryRecord.id,
    agentName: "Synthesis Agent",
    status: "started",
    timestamp: new Date().toISOString(),
  });

  const synthesis = await synthesisAgent(query, researchResults);

  const synthTx = transactionStore.addTransaction(
    queryRecord.id,
    "Synthesis Agent",
    breakdown.synthesis,
    userAddr,
    treasuryAddr
  );
  txIndex++;
  eventBus.emitPayment({
    queryId: queryRecord.id,
    agentName: "Synthesis Agent",
    amount: breakdown.synthesis,
    timestamp: synthTx.timestamp,
    txIndex,
  });

  eventBus.emitAgentStep({
    queryId: queryRecord.id,
    agentName: "Synthesis Agent",
    status: "completed",
    timestamp: new Date().toISOString(),
  });
  await sleep(200);

  // Step 4: Fact-check
  eventBus.emitAgentStep({
    queryId: queryRecord.id,
    agentName: "Fact-Check Agent",
    status: "started",
    timestamp: new Date().toISOString(),
  });

  const allSources = researchResults.flatMap((r) => r.sourcesUsed);
  const factCheck = await factCheckAgent(
    synthesis.summary,
    synthesis.keyPoints,
    allSources
  );

  const factTx = transactionStore.addTransaction(
    queryRecord.id,
    "Fact-Check Agent",
    breakdown.factCheck,
    userAddr,
    treasuryAddr
  );
  txIndex++;
  eventBus.emitPayment({
    queryId: queryRecord.id,
    agentName: "Fact-Check Agent",
    amount: breakdown.factCheck,
    timestamp: factTx.timestamp,
    txIndex,
  });

  eventBus.emitAgentStep({
    queryId: queryRecord.id,
    agentName: "Fact-Check Agent",
    status: "completed",
    timestamp: new Date().toISOString(),
  });

  // Platform fee
  const platformTx = transactionStore.addTransaction(
    queryRecord.id,
    "Platform",
    breakdown.platform,
    userAddr,
    treasuryAddr
  );
  txIndex++;
  eventBus.emitPayment({
    queryId: queryRecord.id,
    agentName: "Platform",
    amount: breakdown.platform,
    timestamp: platformTx.timestamp,
    txIndex,
  });

  // Complete query
  const completedRecord = transactionStore.completeQuery(queryRecord.id);
  const duration = Date.now() - startTime;

  const margin = calculateMargin(totalPrice, txIndex);

  eventBus.emitQueryComplete({
    queryId: queryRecord.id,
    actualCost: totalPrice,
    transactionCount: txIndex,
    duration,
    timestamp: new Date().toISOString(),
  });

  return {
    queryId: queryRecord.id,
    insight: {
      summary: synthesis.summary,
      keyPoints: synthesis.keyPoints,
      sources: allSources,
      confidence: synthesis.confidence,
      factCheck: {
        verified: factCheck.verified,
        confidence: factCheck.confidence,
        corrections: factCheck.corrections,
      },
    },
    cost: breakdown,
    margin,
    metadata: {
      complexity: analysis.complexity,
      complexityLabel: complexityToLabel(analysis.complexity),
      category: analysis.category,
      agentSteps: txIndex,
      transactionCount: txIndex,
      processingTimeMs: duration,
    },
    transactions: (completedRecord?.transactions || []).map((tx) => ({
      id: tx.id,
      agentName: tx.agentName,
      amount: tx.amount,
      timestamp: tx.timestamp,
    })),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
