# Quanta — Project Overview

## Pay-Per-Insight Data Intelligence Platform

---

## The Problem

Data access is broken. The current model forces users into one of two bad options:

1. **Expensive subscriptions** — Bloomberg Terminal costs $24,000/year. Refinitiv, Statista, and similar platforms charge $5K-$50K annually. Most users only need occasional queries but pay for 365 days of access.

2. **Free but unreliable** — Free data sources are fragmented, unverified, and require manual synthesis. Getting a reliable answer to a complex question means visiting 5-10 websites and spending 30+ minutes.

Neither model prices data by its actual value to the user. A trivial lookup ("What's Apple's current stock price?") costs the same as a complex multi-source analysis ("Compare Apple vs Microsoft across patents, earnings, sentiment, and regulatory risk for the next quarter").

**The root cause:** Traditional payment infrastructure makes sub-dollar transactions economically impossible. Visa charges $0.30 minimum per transaction. Ethereum gas costs $0.50-$5.00 per transfer. When your data query is worth $0.003, no existing payment rail can handle it.

---

## The Solution

**Quanta** is a data intelligence platform that charges per-insight, not per-month.

- Ask a simple question → pay $0.001
- Ask a complex multi-source question → pay $0.005-$0.01
- Get AI-synthesized, fact-checked answers from multiple data sources

This is made possible by **Circle Nanopayments on Arc** — a stablecoin-native Layer 1 where USDC is the gas token and transactions as small as $0.000001 are economically viable.

### How It Works (User Perspective)

1. User types a question into Quanta
2. Quanta's AI analyzes the question and shows the estimated cost (e.g., "$0.004")
3. User confirms — a single click signs an EIP-3009 payment authorization
4. Behind the scenes, multiple AI agents collaborate:
   - **Research Agent** gathers data from relevant sources ($0.001)
   - **Synthesis Agent** merges and contextualizes the data ($0.001)
   - **Fact-Check Agent** verifies claims against sources ($0.001)
   - **Delivery** packages the final insight ($0.001)
5. Each agent step generates a separate nanopayment
6. User receives a polished, sourced insight in seconds
7. All payments are batched and settled on Arc in a single on-chain transaction

### The 30-Second Pitch

> "What if you could Google something and only pay for the quality of the answer? Quanta charges $0.001 for a quick fact and $0.01 for a deep multi-source analysis. This is only possible because Arc's USDC-native gas eliminates transaction overhead. We're not building another AI chatbot — we're building the pricing model for the data economy."

---

## Why Quanta Wins This Hackathon

### 1. Maximum Technology Integration

| Technology | How We Use It | Depth |
|---|---|---|
| **Arc** (Required) | Settlement layer — all payments settle here | Core infrastructure |
| **USDC** (Required) | Native currency for all payments | Gas + value transfer |
| **Circle Nanopayments** (Required) | Sub-cent payment channels | Core payment flow |
| **Circle Gateway** | Unified USDC balance, batched settlement | Payment aggregation |
| **x402 Protocol** | HTTP-native payment middleware | API monetization |
| **Circle Wallets** | Dev-controlled wallets for agent treasury | Wallet management |
| **Google Gemini** (Partner) | Query analysis + synthesis engine | Core AI reasoning |
| **Featherless** (Partner) | Specialist model inference | Domain-specific agents |
| **AIsa** (Partner) | Structured data endpoints | Data sourcing |

No other project in this hackathon uses every required technology AND every partner API.

### 2. Genuine Per-Action Pricing

This isn't artificial pricing where we slap a $0.01 charge on every request. The price dynamically varies based on actual computational cost:

- **Complexity 1** (simple lookup): 1 agent, 1 source → $0.001
- **Complexity 3** (moderate analysis): 3 agents, 2-3 sources → $0.004
- **Complexity 5** (deep synthesis): 4+ agents, 5+ sources → $0.008-$0.01

The pricing engine maps real resource consumption to real cost.

### 3. Transaction Volume

A single query generates 3-5 nanopayments (one per agent step). The batch mode allows users to submit 20+ queries at once, generating 80-100+ on-chain transactions in a single demo — far exceeding the 50-transaction requirement.

### 4. Clear Margin Story

| Payment Method | Cost for 100 micro-queries |
|---|---|
| **Quanta on Arc** | $0.30 total (avg $0.003/query, zero gas) |
| **Ethereum L1** | $150-$500 (gas per tx: $1.50-$5.00) |
| **Polygon/Arbitrum L2** | $1-$5 (gas per tx: $0.01-$0.05) |
| **Visa/Stripe** | $30 minimum ($0.30/tx minimum) |
| **Traditional API subscription** | $99/month flat (regardless of usage) |

Arc's USDC-native gas model makes Quanta's pricing model economically viable. On any other chain, the gas costs would exceed the payment amounts, destroying the business model.

### 5. Multi-Prize Eligibility

- **Main prizes** (Arc + Circle): Deep integration with all required tech
- **Google Track** ($2K): Gemini is our core reasoning engine
- **Featherless Track**: Featherless powers our specialist agents
- **Best Feedback** ($500): We'll provide detailed Circle developer experience feedback

### 6. Real Business Viability

The data-as-a-service market is $300B+ and growing. Current pricing models (subscriptions, enterprise licenses) leave most of the market unserved. Per-insight pricing enabled by nanopayments unlocks:

- **Individual researchers** who need 5 queries/month (not $24K/year)
- **AI agents** that need programmatic data access at machine speed
- **Developers** building data-powered apps without upfront costs
- **Small businesses** that can't afford enterprise data subscriptions

---

## Target Users

### Primary: Developers & AI Agents
- Programmatic API access with pay-per-call pricing
- No subscriptions, no API keys, no rate limits (you pay per query)
- Ideal for AI agents that need data on-demand

### Secondary: Knowledge Workers & Researchers
- Web interface for complex questions
- Get synthesized, fact-checked answers instead of raw data
- Pay proportional to question complexity

### Tertiary: Businesses
- Embed Quanta into internal tools
- Replace expensive data subscriptions with usage-based pricing
- Budget predictability — pay only for what you use

---

## Competitive Differentiation

### vs. Other Hackathon Submissions

| Competitor Pattern | How Quanta Differs |
|---|---|
| Agent Marketplace (AgentBazaar, Agent Swarm) | We build a **product**, not a marketplace. Users get answers, not agents. |
| Pay-Per-Chat (PayPerChat) | We charge based on **complexity**, not per-message. A simple query is cheaper than a complex one. |
| SDK-only (OmniAgentPay) | We ship a **complete application** with UI, not just a library. |
| Tutorial/Guide submissions | We ship a **working product** with 80+ demo transactions. |

### vs. Previous Hackathon Winners

| Winner | What They Did | How Quanta Improves |
|---|---|---|
| NewsFacts (1st) | Paid eyewitness facts | We do multi-source synthesis, not single-source |
| RSoft Agentic Bank (1st) | Agent lending/risk | We focus on data commerce, more relatable use case |
| Agent Router (Finalist) | Route to best API | We don't just route — we orchestrate multi-agent pipelines with visible cost cascading |

---

## Key Metrics for Demo

| Metric | Target |
|---|---|
| Avg query response time | < 5 seconds |
| Avg cost per simple query | $0.001 - $0.002 |
| Avg cost per complex query | $0.005 - $0.01 |
| Nanopayments per query | 3-5 |
| Total demo transactions | 80-100+ |
| Gas cost on Arc | $0 (batched by Circle Gateway) |
| Equivalent gas cost on Ethereum | $150-$500 |

---

## Project Timeline

### Phase A: Foundation — Payment infrastructure working end-to-end
### Phase B: AI Layer — Multi-agent pipeline with per-agent nanopayments
### Phase C: Frontend — Polished UI with real-time visualization
### Phase D: Submission — Video, pitch deck, deployment, feedback

See `PLAN.md` for detailed task breakdown and dependency graph.

---

## Team

**ForgeLabs**
- Registered on lablab.ai for Agentic Economy on Arc hackathon
- Online participation track
