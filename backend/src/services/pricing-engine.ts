export interface PricingInput {
  complexity: number; // 1-5
  sourceCount: number;
  modelCost: number; // multiplier
  tokenEstimate: number;
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

const BASE_FEE = 0.0005;
const COMPLEXITY_RATE = 0.001;
const SOURCE_RATE = 0.0005;
const TOKEN_RATE = 0.000001;
const MAX_PRICE = 0.01;

export function calculatePrice(input: PricingInput): number {
  const price =
    BASE_FEE +
    input.complexity * COMPLEXITY_RATE +
    input.sourceCount * SOURCE_RATE +
    input.tokenEstimate * TOKEN_RATE;

  return Math.min(Math.max(price, 0.0005), MAX_PRICE);
}

export function allocateCosts(totalPrice: number): CostBreakdown {
  return {
    research: round(totalPrice * 0.3),
    synthesis: round(totalPrice * 0.3),
    factCheck: round(totalPrice * 0.2),
    dataSources: round(totalPrice * 0.15),
    platform: round(totalPrice * 0.05),
    total: totalPrice,
  };
}

export function calculateMargin(totalPrice: number, txCount: number): MarginAnalysis {
  // Average Ethereum L1 gas: ~$1.50-$5.00 per tx
  const ethL1PerTx = 2.5;
  // Average L2 gas: ~$0.02 per tx
  const ethL2PerTx = 0.02;
  // Visa minimum: $0.30 per tx
  const visaPerTx = 0.3;
  // Monthly subscription equivalent (amortized per query)
  const subMonthly = 99;
  const avgQueriesPerMonth = 500;

  const arcCost = totalPrice; // zero gas on nanopayments
  const ethereumL1Cost = txCount * ethL1PerTx;
  const ethereumL2Cost = txCount * ethL2PerTx;
  const visaCost = txCount * visaPerTx;
  const subscriptionCost = subMonthly / avgQueriesPerMonth;

  return {
    arcCost: round(arcCost),
    ethereumL1Cost: round(ethereumL1Cost),
    ethereumL2Cost: round(ethereumL2Cost),
    visaCost: round(visaCost),
    subscriptionCost: round(subscriptionCost),
    savingsVsEthereum: round(((ethereumL1Cost - arcCost) / ethereumL1Cost) * 100),
    savingsVsVisa: round(((visaCost - arcCost) / visaCost) * 100),
  };
}

function round(n: number): number {
  return Math.round(n * 1000000) / 1000000;
}

export function complexityToLabel(complexity: number): string {
  switch (complexity) {
    case 1:
      return "Simple Lookup";
    case 2:
      return "Basic Analysis";
    case 3:
      return "Multi-Source Analysis";
    case 4:
      return "Deep Synthesis";
    case 5:
      return "Comprehensive Research";
    default:
      return "Unknown";
  }
}
