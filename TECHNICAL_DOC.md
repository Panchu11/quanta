# Quanta — Technical Documentation

## Architecture, APIs, Payment Flows & Implementation Reference

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Arc Network Reference](#2-arc-network-reference)
3. [Circle Nanopayments Integration](#3-circle-nanopayments-integration)
4. [x402 Protocol Integration](#4-x402-protocol-integration)
5. [AI Agent Pipeline](#5-ai-agent-pipeline)
6. [Pricing Engine](#6-pricing-engine)
7. [API Specification](#7-api-specification)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Environment & Configuration](#10-environment--configuration)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security Considerations](#12-security-considerations)

---

## 1. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
│                                                                     │
│   Next.js 14 App (Vercel)          GatewayClient (@circle-fin)     │
│   ├── Query Interface               ├── EIP-3009 Signing           │
│   ├── Transaction Dashboard          ├── 402 Handshake             │
│   ├── Cost Visualization             └── Payment Headers           │
│   └── WebSocket Consumer                                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS + x402 + WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                              │
│                                                                     │
│   Express.js (Railway/Render)                                       │
│   ├── x402 Gateway Middleware (@circle-fin/x402-batching)          │
│   ├── Query Orchestrator                                            │
│   ├── Pricing Engine                                                │
│   ├── Agent Manager                                                 │
│   ├── WebSocket Server (Socket.io)                                  │
│   └── Transaction Logger                                            │
└───────────┬──────────┬──────────┬──────────┬────────────────────────┘
            │          │          │          │
            ▼          ▼          ▼          ▼
     ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
     │  Gemini  │ │Feather-│ │  AIsa  │ │Circle Gateway│
     │  API     │ │less API│ │  API   │ │Nanopayments  │
     └──────────┘ └────────┘ └────────┘ └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────┐
                                         │Arc Chain │
                                         │(L1 USDC) │
                                         └──────────┘
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| **Next.js Frontend** | User interface, query input, real-time dashboards, wallet status |
| **Express Backend** | API server, x402 middleware, agent orchestration, WebSocket events |
| **x402 Middleware** | Intercepts requests, returns 402 with pricing, validates payment signatures |
| **Query Orchestrator** | Analyzes query → determines complexity → dispatches to agents |
| **Pricing Engine** | Maps complexity + sources + models to USDC price |
| **Agent Manager** | Manages lifecycle of Research, Synthesis, Fact-Check agents |
| **Circle Gateway** | Verifies EIP-3009 signatures, batches payments, settles on-chain |
| **Arc Chain** | Final settlement layer — USDC transfers recorded on L1 |

---

## 2. Arc Network Reference

### Testnet Configuration

```json
{
  "chainName": "Arc Testnet",
  "chainId": 5042002,
  "chainIdHex": "0x4cef52",
  "rpcUrl": "https://rpc.testnet.arc.network",
  "blockExplorer": "https://testnet.arcscan.app/",
  "nativeCurrency": {
    "name": "USDC",
    "symbol": "USDC",
    "decimals": 6
  },
  "usdcContractAddress": "0x3600000000000000000000000000000000000000",
  "faucetUrl": "https://faucet.circle.com"
}
```

### Key Properties

- **EVM-compatible**: Standard Solidity/Vyper contracts, ethers.js/viem compatible
- **USDC is the gas token**: No ETH needed. Gas fees paid in USDC.
- **Deterministic finality**: Transactions are final once confirmed
- **Stablecoin-native**: Built specifically for USDC settlement
- **Circle Gateway support**: Nanopayments natively supported on Arc

### viem Chain Definition

```typescript
import { defineChain } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});
```

---

## 3. Circle Nanopayments Integration

### How Nanopayments Work

Circle Nanopayments enable gas-free, sub-cent USDC transfers using EIP-3009 (`transferWithAuthorization`). Instead of executing individual on-chain transactions, the system:

1. **Offchain authorization**: Client signs an EIP-3009 message granting transfer rights
2. **Offchain ledger**: Circle Gateway tracks balances in an offchain ledger
3. **Batched settlement**: Periodically, Circle batches thousands of authorizations into a single on-chain transaction

This means:
- Transfers as small as $0.000001 (one-millionth of a dollar)
- Zero gas cost per individual payment
- Instant confirmation (offchain)
- On-chain finality in batches

### Payment Flow (x402 v2 + Circle Gateway)

```
Step 1: Client → Server
  GET /api/query?q=What is NVIDIA's market cap?
  (No payment header)

Step 2: Server → Client
  HTTP 402 Payment Required
  Headers:
    X-Payment-Required: true
    X-Payment-Amount: 3000        (= $0.003, in USDC micro-units)
    X-Payment-Scheme: GatewayWalletBatched
    X-Payment-Recipient: 0x<server_address>
    X-Payment-Network: arc-testnet

Step 3: Client signs EIP-3009 authorization
  - Using viem's signTypedData or @circle-fin/x402-batching GatewayClient
  - Signs: transferWithAuthorization(from, to, value, validAfter, validBefore, nonce)
  - Target contract: Circle GatewayWallet on Arc

Step 4: Client → Server (retry with payment)
  GET /api/query?q=What is NVIDIA's market cap?
  Headers:
    Payment-Signature: <eip3009_signature>
    Payment-Authorization: <serialized_auth_data>

Step 5: Server → Circle Gateway
  - Middleware validates the signature via Circle Gateway API
  - Gateway confirms payment is valid and queues it

Step 6: Server processes query and returns result
  HTTP 200 OK
  Body: { insight: "...", cost: 0.003, breakdown: [...] }

Step 7 (async): Circle Gateway → Arc Chain
  - Batches this payment with thousands of others
  - Executes single on-chain settlement transaction
  - Funds move from client to server wallet on Arc
```

### Key Libraries

```json
{
  "@circle-fin/x402-batching": "Server middleware + client library",
  "viem": "Wallet operations, EIP-3009 signing, chain config",
  "ethers": "Alternative to viem for wallet operations"
}
```

### Server Setup Pattern (from circle-nanopayment-sample)

```typescript
// server.ts - Paywalled API endpoint
import express from 'express';
import { createGatewayMiddleware } from '@circle-fin/x402-batching';

const app = express();

// Configure x402 nanopayment middleware
const paymentMiddleware = createGatewayMiddleware({
  routes: {
    'GET /api/query': {
      price: 1000, // $0.001 in USDC micro-units (6 decimals)
      description: 'Data intelligence query',
    },
  },
  recipient: process.env.SERVER_ADDRESS,
  network: 'arc-testnet',
});

app.use(paymentMiddleware);

app.get('/api/query', (req, res) => {
  // This only executes if payment was verified
  // Process the query...
  res.json({ insight: '...', cost: 0.001 });
});
```

### Client Setup Pattern

```typescript
// client.ts - Autonomous payment logic
import { GatewayClient } from '@circle-fin/x402-batching';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arcTestnet } from './chains';

const account = privateKeyToAccount(process.env.CLIENT_PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(),
});

const gateway = new GatewayClient({ walletClient });

// Make a paid request
const response = await gateway.pay('https://api.quanta.app/api/query?q=...');
const data = await response.json();
```

### Wallet Funding

```bash
# 1. Generate keypairs
# Server wallet (receives payments)
# Client wallet (makes payments)
# Use viem or ethers to generate random private keys

# 2. Fund via Circle Faucet
# Visit https://faucet.circle.com
# Select: Arc Testnet + USDC
# Enter client wallet address
# Receive testnet USDC

# 3. Deposit to Gateway (for nanopayments)
# Client must deposit USDC into Circle Gateway contract
# This enables offchain authorization (EIP-3009)
```

---

## 4. x402 Protocol Integration

### Overview

x402 is an open standard that uses HTTP status code 402 (Payment Required) to enable native web payments. When a server receives a request without payment, it returns 402 with payment terms. The client's payment interceptor handles the rest automatically.

### Express Middleware Pattern

```typescript
import { paymentMiddleware } from 'x402-express';

// Alternative approach using x402-express (open standard)
app.use(
  paymentMiddleware({
    facilitatorUrl: 'https://facilitator.x402.org',
    routes: {
      'GET /api/query': {
        price: '$0.003',
        network: 'arc-testnet',
        recipient: process.env.SERVER_ADDRESS,
      },
    },
  })
);
```

### Client Interceptor Pattern (Axios)

```typescript
import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';

const client = withPaymentInterceptor(axios.create(), {
  walletClient, // viem wallet client
});

// Automatically handles 402 → sign → pay → retry
const response = await client.get('https://api.quanta.app/api/query?q=...');
```

### Decision: @circle-fin/x402-batching vs x402-express

We use **@circle-fin/x402-batching** as primary because:
- Native Circle Gateway integration (no separate facilitator needed)
- Built-in batched settlement
- Official Circle SDK — judges will recognize it
- Simpler setup for Arc testnet

We keep x402-express knowledge as **fallback** in case of SDK issues.

---

## 5. AI Agent Pipeline

### Agent Architecture

```
User Query
    │
    ▼
┌───────────────────┐
│  QUERY ANALYZER   │ ← Gemini 2.5 Pro
│                   │
│  Input: raw query │
│  Output:          │
│  - complexity (1-5)│
│  - required_sources│
│  - sub_tasks[]    │
│  - estimated_cost │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐      ┌──────────────┐
│  RESEARCH AGENT   │ ←──→ │ Data Sources │
│                   │      │ - AIsa API   │
│  Gemini 2.5 Pro   │      │ - Web APIs   │
│  Per sub-task:    │      │ - Public data│
│  - Fetch data     │      └──────────────┘
│  - Extract facts  │
│  Nanopayment: ~$0.001 per invocation    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  SYNTHESIS AGENT  │ ← Gemini 2.5 Pro
│                   │
│  - Merge results  │
│  - Resolve conflicts│
│  - Structure insight│
│  Nanopayment: ~$0.001 per invocation    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  FACT-CHECK AGENT │ ← Featherless (specialized model)
│                   │
│  - Cross-reference│
│  - Confidence score│
│  - Flag issues    │
│  Nanopayment: ~$0.001 per invocation    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  RESPONSE BUILDER │
│                   │
│  - Format output  │
│  - Attach sources │
│  - Cost breakdown │
└───────────────────┘
```

### Gemini Integration

```typescript
// Using Google AI Studio / Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

// Query Analyzer
async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  const prompt = `Analyze this data query and return JSON:
    - complexity: 1-5 (1=simple lookup, 5=deep multi-source analysis)
    - required_sources: string[] (what data sources are needed)
    - sub_tasks: string[] (break into discrete research tasks)
    - estimated_tokens: number (expected response length)
    
    Query: "${query}"`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

// Research Agent
async function researchAgent(task: string, sources: string[]): Promise<ResearchResult> {
  const prompt = `Research the following task using available data:
    Task: ${task}
    Sources to check: ${sources.join(', ')}
    
    Return: { findings: string, sources_used: string[], confidence: number }`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

// Synthesis Agent
async function synthesisAgent(findings: ResearchResult[]): Promise<Insight> {
  const prompt = `Synthesize these research findings into a coherent insight:
    ${JSON.stringify(findings)}
    
    Return: { summary: string, key_points: string[], conflicts: string[] }`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### Featherless Integration

```typescript
// Featherless uses OpenAI-compatible API format
import OpenAI from 'openai';

const featherless = new OpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY,
});

// Fact-Check Agent
async function factCheckAgent(insight: Insight, sources: ResearchResult[]): Promise<FactCheckResult> {
  const response = await featherless.chat.completions.create({
    model: 'Qwen/Qwen3-8B', // or another available model
    messages: [
      {
        role: 'system',
        content: 'You are a fact-checking agent. Verify claims against provided source data.',
      },
      {
        role: 'user',
        content: `Verify this insight: ${JSON.stringify(insight)}
                  Against these sources: ${JSON.stringify(sources)}
                  Return: { verified: boolean, confidence: number, corrections: string[] }`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### AIsa Integration

```typescript
// AIsa data endpoints (structure TBD based on API availability)
async function fetchAIsaData(query: string, endpoint: string): Promise<any> {
  const response = await fetch(`https://api.aisa.one/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AISA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return response.json();
}
```

---

## 6. Pricing Engine

### Formula

```typescript
interface PricingInput {
  complexity: number;       // 1-5
  sourceCount: number;      // number of data sources needed
  modelCost: number;        // base model cost multiplier
  tokenEstimate: number;    // estimated response tokens
}

function calculatePrice(input: PricingInput): number {
  const BASE_FEE = 0.0005;        // $0.0005 minimum
  const COMPLEXITY_RATE = 0.001;   // $0.001 per complexity level
  const SOURCE_RATE = 0.0005;      // $0.0005 per data source
  const TOKEN_RATE = 0.000001;     // $0.000001 per token

  const price =
    BASE_FEE +
    input.complexity * COMPLEXITY_RATE +
    input.sourceCount * SOURCE_RATE +
    input.tokenEstimate * TOKEN_RATE;

  // Cap at $0.01
  return Math.min(price, 0.01);
}

// Examples:
// Simple lookup: complexity=1, sources=1, tokens=100 → $0.0016
// Moderate analysis: complexity=3, sources=3, tokens=500 → $0.0045
// Deep synthesis: complexity=5, sources=5, tokens=1000 → $0.009
```

### Cost Breakdown Per Agent

```typescript
function allocateCosts(totalPrice: number, agentCount: number): AgentCostBreakdown {
  // Research agent gets 30%
  // Synthesis agent gets 30%
  // Fact-check agent gets 20%
  // Data source fees get 15%
  // Platform fee gets 5%

  return {
    research: totalPrice * 0.30,
    synthesis: totalPrice * 0.30,
    factCheck: totalPrice * 0.20,
    dataSources: totalPrice * 0.15,
    platform: totalPrice * 0.05,
    total: totalPrice,
  };
}
```

---

## 7. API Specification

### Endpoints

#### POST /api/query (Paywalled — 402 flow)

```
Request:
  Body: { query: string, options?: { depth?: 'quick' | 'standard' | 'deep' } }

Response (402 — before payment):
  Headers:
    X-Payment-Required: true
    X-Payment-Amount: <amount_in_micro_usdc>
    X-Payment-Scheme: GatewayWalletBatched

Response (200 — after payment):
  Body: {
    insight: {
      summary: string,
      key_points: string[],
      sources: { name: string, url: string }[],
      confidence: number
    },
    cost: {
      total: number,
      breakdown: {
        research: number,
        synthesis: number,
        factCheck: number,
        dataSources: number
      },
      currency: 'USDC',
      transactions: string[]  // nanopayment IDs
    },
    margin: {
      arcCost: number,
      ethereumEquivalent: number,
      savingsPercent: number
    },
    metadata: {
      complexity: number,
      agentSteps: number,
      processingTimeMs: number
    }
  }
```

#### POST /api/batch (Paywalled — total cost for batch)

```
Request:
  Body: { queries: string[] }

Response (402):
  X-Payment-Amount: <total_for_all_queries>

Response (200):
  Body: {
    results: InsightResult[],
    totalCost: number,
    totalTransactions: number,
    batchId: string
  }
```

#### GET /api/estimate

```
Request:
  Query: ?q=<query_text>

Response (200 — free, no payment needed):
  Body: {
    estimatedCost: number,
    complexity: number,
    requiredSources: string[],
    estimatedTime: number
  }
```

#### GET /api/transactions

```
Response (200):
  Body: {
    transactions: {
      id: string,
      type: 'research' | 'synthesis' | 'factCheck' | 'dataSource',
      amount: number,
      timestamp: string,
      status: 'pending' | 'settled',
      arcExplorerUrl: string
    }[]
  }
```

#### GET /api/balance

```
Response (200):
  Body: {
    walletAddress: string,
    balance: number,
    totalSpent: number,
    totalTransactions: number
  }
```

#### WebSocket: /ws/feed

```
Events emitted:
  - 'payment': { agentName, amount, queryId, timestamp }
  - 'query_start': { queryId, estimatedCost, complexity }
  - 'query_complete': { queryId, actualCost, transactionCount }
  - 'agent_step': { queryId, agentName, status, duration }
  - 'settlement': { batchId, totalAmount, txHash, explorerUrl }
```

---

## 8. Frontend Architecture

### Page Structure

```
/                       → Landing + Query Interface
/dashboard              → Real-time Transaction Dashboard
/query/[id]             → Individual Query Result + Cost Breakdown
```

### Key Components

```
src/
├── app/
│   ├── page.tsx                 # Query input + results
│   ├── dashboard/
│   │   └── page.tsx             # Live transaction feed
│   └── query/
│       └── [id]/
│           └── page.tsx         # Query detail view
├── components/
│   ├── QueryInput.tsx           # Search bar with cost estimate
│   ├── InsightCard.tsx          # Formatted insight display
│   ├── TransactionFeed.tsx      # Real-time payment stream
│   ├── CostBreakdown.tsx        # Pie/bar chart of agent costs
│   ├── MarginComparison.tsx     # Arc vs ETH vs Visa comparison
│   ├── PaymentFlowViz.tsx       # Animated agent → payment flow
│   ├── BatchUploader.tsx        # CSV/multi-query batch input
│   ├── WalletStatus.tsx         # Balance + address + explorer link
│   └── AgentStatusIndicator.tsx # Shows which agents are working
├── hooks/
│   ├── useWebSocket.ts          # Socket.io connection
│   ├── usePayment.ts            # GatewayClient wrapper
│   └── useTransactions.ts       # Transaction state management
├── lib/
│   ├── gateway.ts               # Circle Gateway client setup
│   ├── chains.ts                # Arc testnet chain definition
│   └── pricing.ts               # Client-side cost estimation
└── styles/
    └── globals.css              # TailwindCSS config
```

### Real-Time Dashboard Design

The dashboard is the "wow moment" of the demo. It shows:

1. **Left Panel**: Live transaction feed (scrolling list of payments)
2. **Center Panel**: Animated flow diagram (query → agents → payments → settlement)
3. **Right Panel**: Aggregate stats (total spent, tx count, avg cost, margin savings)
4. **Bottom Panel**: Arc Block Explorer link for latest settlement batch

---

## 9. Data Flow Diagrams

### Single Query Flow

```
User types question
        │
        ▼
[Frontend] POST /api/estimate → Get cost estimate, show to user
        │
        ▼
User clicks "Pay & Query"
        │
        ▼
[Frontend] POST /api/query (no payment header)
        │
        ▼
[Backend] x402 middleware returns 402 + payment terms
        │
        ▼
[Frontend] GatewayClient signs EIP-3009 authorization
        │
        ▼
[Frontend] POST /api/query (with Payment-Signature header)
        │
        ▼
[Backend] x402 middleware → Circle Gateway verifies → passes through
        │
        ▼
[Backend] Query Analyzer (Gemini) → complexity=3, sources=[financial, news]
        │ WebSocket emit: 'query_start'
        ▼
[Backend] Research Agent (Gemini) → fetches financial data
        │ Nanopayment #1: $0.001 → WebSocket emit: 'payment'
        ▼
[Backend] Research Agent (Gemini) → fetches news data
        │ Nanopayment #2: $0.001 → WebSocket emit: 'payment'
        ▼
[Backend] Synthesis Agent (Gemini) → merges findings
        │ Nanopayment #3: $0.001 → WebSocket emit: 'payment'
        ▼
[Backend] Fact-Check Agent (Featherless) → verifies claims
        │ Nanopayment #4: $0.001 → WebSocket emit: 'payment'
        ▼
[Backend] Response Builder → formats output
        │ WebSocket emit: 'query_complete'
        ▼
[Frontend] Displays insight + cost breakdown + margin analysis
```

### Batch Query Flow

```
User uploads 20 questions
        │
        ▼
[Frontend] POST /api/batch (single payment for total estimated cost)
        │ 402 → sign → pay for total ($0.06 for 20 queries)
        ▼
[Backend] Processes queries sequentially or in parallel (configurable)
        │ Each query generates 3-5 nanopayments
        │ WebSocket emits flood of 'payment' events
        │ Total: 60-100 nanopayments
        ▼
[Frontend] Transaction feed shows rapid-fire payments
        │ Counter ticks up: "78/80 transactions processed"
        ▼
[Backend] Circle Gateway batches all into on-chain settlement
        │ WebSocket emit: 'settlement' with Arc Explorer link
        ▼
[Frontend] Dashboard shows final stats + link to block explorer
```

---

## 10. Environment & Configuration

### Required Environment Variables

```env
# === Arc Network ===
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
USDC_CONTRACT=0x3600000000000000000000000000000000000000

# === Wallets ===
SERVER_PRIVATE_KEY=0x...    # Generated via setup script
SERVER_ADDRESS=0x...        # Derived from private key
CLIENT_PRIVATE_KEY=0x...    # For demo/testing client
CLIENT_ADDRESS=0x...        # Derived from private key

# === Circle ===
CIRCLE_API_KEY=...          # From Circle Developer Console
CIRCLE_ENTITY_SECRET=...    # For dev-controlled wallets (if used)

# === AI APIs ===
GEMINI_API_KEY=...          # From Google AI Studio
FEATHERLESS_API_KEY=...     # From featherless.ai
AISA_API_KEY=...            # From AIsa (if available)

# === App Config ===
PORT=4021
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Setup Script

```bash
#!/bin/bash
# setup.sh — Generate wallets and configure environment

echo "Generating server wallet..."
# Uses Node.js script to generate keypair via viem
node scripts/generate-wallet.js server

echo "Generating client wallet..."
node scripts/generate-wallet.js client

echo ""
echo "Wallets generated. Now:"
echo "1. Go to https://faucet.circle.com"
echo "2. Select Arc Testnet + USDC"
echo "3. Fund your CLIENT address with testnet USDC"
echo "4. Copy API keys into .env"
```

---

## 11. Deployment Architecture

### Frontend (Vercel)

```
Next.js 14 app deployed to Vercel
- Automatic HTTPS
- Edge functions for API proxying
- Environment variables via Vercel dashboard
- Custom domain (optional): quanta.forgelabs.dev
```

### Backend (Railway or Render)

```
Express.js server deployed to Railway
- Persistent WebSocket support
- Environment variables via Railway dashboard
- Auto-deploy from GitHub
- Free tier sufficient for hackathon
```

### Infrastructure Diagram

```
[Vercel CDN]
     │
     ├── Static assets (Next.js)
     └── API proxy ──► [Railway]
                           │
                           ├── Express server
                           ├── Socket.io
                           └── External APIs
                                 │
                                 ├── Circle Gateway
                                 ├── Google AI Studio
                                 ├── Featherless
                                 └── AIsa
```

---

## 12. Security Considerations

### Wallet Security

- **Server private key**: Stored as environment variable, never committed to git
- **Client private key**: For demo purposes only (testnet USDC)
- **No real funds**: All operations on Arc Testnet
- **.env** file in .gitignore
- **.env.example** committed with placeholder values

### API Security

- Rate limiting on all endpoints (express-rate-limit)
- Input sanitization on query strings (prevent prompt injection)
- CORS configured for frontend domain only
- WebSocket authentication via session tokens

### Payment Security

- EIP-3009 signatures are cryptographically verified by Circle Gateway
- Server never handles raw private keys of users
- All payment validation is done by Circle's infrastructure
- Replay protection built into EIP-3009 (nonce + validAfter/validBefore)

### AI Security

- Prompt injection mitigation: system prompts are hardcoded, user input is clearly delimited
- Response validation: AI outputs are parsed as JSON with schema validation
- Token limits: Max output tokens per agent call prevents runaway costs
- No user data persistence: queries are processed and discarded (demo mode)

---

## Appendix: Package Dependencies

### Backend (package.json)

```json
{
  "dependencies": {
    "@circle-fin/x402-batching": "latest",
    "@google/generative-ai": "latest",
    "openai": "latest",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "socket.io": "^4.7.0",
    "viem": "^2.0.0",
    "express-rate-limit": "^7.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "tsx": "^4.0.0",
    "nodemon": "^3.0.0"
  }
}
```

### Frontend (package.json)

```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "socket.io-client": "^4.7.0",
    "recharts": "^2.12.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-tooltip": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest",
    "framer-motion": "^11.0.0",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```
