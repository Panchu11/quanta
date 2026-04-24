# Quanta — Implementation Plan

## Project: Pay-Per-Insight Data Intelligence Platform

**Team:** ForgeLabs
**Hackathon:** Agentic Economy on Arc (lablab.ai)
**Deadline:** April 25, 2026

---

## 1. Executive Summary

Quanta is a data intelligence platform where AI agents fetch, analyze, and synthesize information from multiple sources — charging users per-insight via Circle Nanopayments on Arc. Simple lookups cost $0.001; complex multi-source analyses cost up to $0.01. Each sub-agent in the pipeline generates its own nanopayment, creating a rich on-chain transaction graph that demonstrates real per-action pricing.

---

## 2. Hackathon Compliance Checklist

| Requirement | How We Meet It |
|---|---|
| Per-action pricing ≤ $0.01 | Dynamic pricing: $0.001 - $0.01 based on query complexity |
| 50+ onchain transactions in demo | Batch mode: 20 queries × 4 agent steps = 80+ transactions |
| Margin explanation | Dashboard panel: "This cost $0.003 on Arc. On Ethereum: $1.84 in gas." |
| Video with Circle Dev Console + Arc Explorer | Record demo showing both |
| GitHub repo | Public repo with MIT license |
| Live app URL | Deploy frontend on Vercel, backend on Railway |
| Pitch deck | 8-10 slides covering problem, solution, demo, business model |
| Circle product feedback | Written feedback document |
| Required tech: Arc + USDC + Circle Nanopayments | Core payment infrastructure |
| Partner APIs: Gemini, Featherless, AIsa | All integrated in agent pipeline |

---

## 3. Implementation Phases

### Phase A: Foundation & Payment Infrastructure

**Goal:** End-to-end payment flow working — user pays, server delivers.

**Tasks:**

1. **Project scaffolding**
   - Initialize monorepo structure: `/frontend` (Next.js 14) + `/backend` (Express)
   - Install dependencies
   - Configure TypeScript, ESLint, Prettier
   - Set up environment variable management (.env.example)

2. **Arc Testnet wallet setup**
   - Script to generate keypairs (client + server wallets)
   - Integration with Circle Faucet for funding
   - Verify USDC balance checks on Arc testnet

3. **Circle Gateway Nanopayments integration**
   - Install `@circle-fin/x402-batching`
   - Configure `createGatewayMiddleware` on Express backend
   - Create first paywalled endpoint: `GET /api/query` → returns 402
   - Implement client-side `GatewayClient.pay()` for EIP-3009 signing
   - Test full 402 → sign → pay → receive cycle

4. **Basic API structure**
   - `POST /api/query` — submit a question (paywalled)
   - `GET /api/transactions` — list recent nanopayments
   - `GET /api/balance` — check wallet balances
   - `GET /api/health` — health check

**Deliverable:** A working Express server where hitting an endpoint costs $0.001 in USDC nanopayments on Arc testnet.

---

### Phase B: AI Agent Orchestration

**Goal:** Multi-agent pipeline that processes queries through specialized AI agents.

**Tasks:**

5. **Gemini integration (Query Analyzer + Orchestrator)**
   - Connect to Google AI Studio / Gemini 2.5 Pro API
   - Build query analyzer: takes user question → returns complexity score (1-5) and required data sources
   - Build orchestrator: decomposes complex queries into sub-tasks
   - Map complexity score to price: level 1 = $0.001, level 5 = $0.01

6. **Pricing Engine**
   - Input: query complexity score + number of sources + model requirements
   - Output: total price in USDC (6 decimal precision)
   - Breakdown: per-agent costs allocated
   - Formula: `price = base_fee + (complexity * source_count * model_cost_multiplier)`
   - All prices between $0.000001 and $0.01

7. **Research Agent**
   - Powered by Gemini
   - Takes sub-task → searches/fetches relevant data
   - Integrates AIsa data endpoints for structured data
   - Each invocation = 1 nanopayment

8. **Synthesis Agent**
   - Powered by Gemini
   - Takes research results → produces coherent insight
   - Handles multi-source merging and conflict resolution
   - Each invocation = 1 nanopayment

9. **Fact-Check Agent**
   - Powered by Featherless (specialized model)
   - Cross-references synthesis output against source data
   - Returns confidence score + corrections
   - Each invocation = 1 nanopayment

10. **Specialist Agent (optional, for domain queries)**
    - Powered by Featherless (domain-specific model)
    - Handles financial, technical, scientific queries
    - Each invocation = 1 nanopayment

11. **Agent-to-Agent payment wiring**
    - Each agent step generates a separate nanopayment via Circle Gateway
    - Payments are: user → research, user → synthesis, user → fact-check
    - All batched into single on-chain settlement

**Deliverable:** Submit a question, get an AI-synthesized answer with 3-5 nanopayments generated per query.

---

### Phase C: Frontend & Visualization

**Goal:** Polished, demo-ready UI with real-time payment visualization.

**Tasks:**

12. **Query Interface**
    - Clean search/question input
    - Complexity indicator (shows estimated cost before submission)
    - "Pay & Query" button
    - Response display with source attribution

13. **Live Transaction Feed**
    - WebSocket connection to backend
    - Real-time stream of nanopayments as they occur
    - Each transaction shows: agent name, amount, timestamp, status
    - Running total of session spending

14. **Cost Breakdown Panel**
    - Per-query breakdown: which agent cost how much
    - Pie chart or bar chart of cost distribution
    - Per-agent performance metrics

15. **Margin Analysis Display**
    - Side-by-side comparison: Arc cost vs Ethereum gas cost vs Visa minimum
    - Dynamic calculation based on actual query cost
    - "You saved X% by using Arc" callout

16. **Payment Flow Visualization**
    - Animated diagram showing query → agents → payments → settlement
    - Real-time node highlighting as each step executes
    - This is the "wow moment" for the demo

17. **Batch Query Mode**
    - Upload multiple questions or use preset demo queries
    - Watch 50-100+ transactions stream across the dashboard
    - Progress bar with transaction counter

18. **Wallet Status Panel**
    - Current USDC balance
    - Total spent this session
    - Link to Arc Block Explorer for verification

**Deliverable:** Fully functional, visually polished web app.

---

### Phase D: Demo & Submission Preparation

**Goal:** Everything needed for submission and presentation.

**Tasks:**

19. **Demo script preparation**
    - Write exact demo flow (what to click, what to say)
    - Prepare 3 example queries of varying complexity
    - Prepare batch query set (20+ questions)
    - Test entire flow end-to-end multiple times

20. **Video recording**
    - Record demo showing full flow
    - Include Circle Dev Console showing nanopayment activity
    - Include Arc Block Explorer showing settled transactions
    - Keep under 3-5 minutes

21. **Pitch deck (8-10 slides)**
    - Slide 1: Problem — Data pricing is broken
    - Slide 2: Solution — Per-insight pricing with nanopayments
    - Slide 3: How it works — Architecture diagram
    - Slide 4: Demo screenshot — Live transaction feed
    - Slide 5: Technology — Arc + Circle + Gemini + Featherless + AIsa
    - Slide 6: Margin analysis — Why this only works on Arc
    - Slide 7: Business model — Revenue mechanics
    - Slide 8: Team — ForgeLabs
    - Slide 9: Future vision

22. **Circle product feedback document**
    - Detailed feedback on Circle Nanopayments developer experience
    - SDK usability, documentation quality, pain points
    - Suggestions for improvement

23. **Submission package**
    - GitHub repo (public, MIT license)
    - Live app URL
    - Pitch deck (PDF or Google Slides link)
    - Video link
    - Circle feedback document

---

## 4. Dependency Graph

```
Phase A (Foundation)
  ├── A1: Scaffolding ──────────────────────┐
  ├── A2: Wallet setup ─────────────────────┤
  ├── A3: Circle Gateway integration ───────┤──► Phase B starts
  └── A4: API structure ────────────────────┘
                                              │
Phase B (AI Layer)                            │
  ├── B5: Gemini integration ───────────────┤
  ├── B6: Pricing engine ──────────────────┤
  ├── B7: Research agent ──────────────────┤──► Phase C starts
  ├── B8: Synthesis agent ─────────────────┤
  ├── B9: Fact-check agent ────────────────┤
  ├── B10: Specialist agent (stretch) ─────┤
  └── B11: Agent payment wiring ───────────┘
                                              │
Phase C (Frontend)                            │
  ├── C12: Query interface ────────────────┤
  ├── C13: Transaction feed ───────────────┤
  ├── C14: Cost breakdown ─────────────────┤──► Phase D starts
  ├── C15: Margin analysis ────────────────┤
  ├── C16: Payment flow viz ───────────────┤
  ├── C17: Batch query mode ───────────────┤
  └── C18: Wallet status ─────────────────┘
                                              │
Phase D (Demo & Submit)                       │
  ├── D19: Demo script ───────────────────┤
  ├── D20: Video recording ────────────────┤
  ├── D21: Pitch deck ────────────────────┤──► SUBMIT
  ├── D22: Circle feedback ────────────────┤
  └── D23: Submission package ─────────────┘
```

---

## 5. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Circle Nanopayments SDK issues on testnet | Have fallback: direct EIP-3009 signing via ethers.js/viem |
| Gemini API rate limits | Cache common queries, use Featherless as fallback |
| AIsa API unavailable | Use web scraping + public APIs as data sources |
| 50+ transaction requirement | Batch mode guarantees this — each query = 4+ transactions |
| Demo reliability | Pre-fund wallets with excess USDC, test on stable connection |
| Time pressure | Phase A+B are critical path; Phase C can be simplified if needed |

---

## 6. Definition of Done

- [ ] Working payment flow: query → 402 → pay → receive insight
- [ ] 3+ AI agents each generating separate nanopayments
- [ ] Dynamic pricing based on query complexity
- [ ] Real-time transaction dashboard
- [ ] Margin analysis panel
- [ ] Batch mode generating 50+ transactions
- [ ] Video showing Circle Dev Console + Arc Explorer
- [ ] Public GitHub repo with MIT license
- [ ] Live deployed app
- [ ] Pitch deck
- [ ] Circle feedback document
