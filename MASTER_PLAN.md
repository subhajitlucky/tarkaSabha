# Tarka Sabha Master Plan 2026–2031

**Status:** Operating plan. This is the document we follow.
**Date:** 20 October 2026
**Supersedes:** The broad positioning in `STRATEGY.md` and the wedge in `OPPORTUNITY.md` where they conflict.
**Founder:** Subhajit
**Current product:** Tarka Sabha — multi-agent council, rubric scoring, evidence capture, shareable runs, run inspector.

---

## 0. Executive summary

### The decision
Do not sell an AI debate app. Do not sell a $99 report.

Build the **independent evidence and assurance layer for high-stakes AI-assisted decisions**.

Start with **M&A / PE technical decision diligence** because it has a deadline, a budget, and a buyer who loses money when a decision is wrong. Turn that into **annual decision assurance**. Then partner with an insurer to create a **decision bond**.

### The ladder
1. **Decision Debt Scan** — free/paid lead magnet.
2. **M&A / PE Decision Diligence** — first two design partners at $10k–$20k; standard $25k–$100k per deal after case studies. Cash now.
3. **Decision Assurance / Attestation** — $30k–$150k per year. Recurring revenue.
4. **Decision Bond / Warranty** — 1–3% of decision value, or $50k–$250k. Risk infrastructure.
5. **Decision Forensics** — $50k–$250k per incident. High-urgency service.

### The first 90 days
- Scan 20 repositories.
- Interview 20 buyers: PE, VC, corp dev, boutique tech diligence, agency CTOs.
- Build one excellent **Decision Diligence Report**.
- Sell **2 paid pilots at $10k+** as design partners.
- Secure one auditor or insurer design partner.
- Publish a benchmark on decision discovery and decision compliance.

### The 3-year target
- $5M ARR.
- 30–50 enterprise/assurance customers.
- 2 insurer/MGA partnerships.
- A proprietary decision evidence and outcome dataset.

### The 5-year target
- $20M+ ARR or a strategic acquisition.
- The default decision evidence layer for technical M&A and high-stakes AI-assisted decisions.
- A published standard used by auditors, insurers, and deal teams.

### The honest truth
There is no completely empty market. Big 4 firms, insurers, and agent-governance vendors own adjacent pieces. They do not own the end-to-end, code-level decision evidence layer accepted by deal teams, auditors, and insurers. That is the opening. The window is 12–24 months, not forever.

---

## 1. Strategic thesis

### 1.1 The problem
High-stakes decisions are increasingly shaped by AI, but the evidence behind those decisions is fragmented across code, commits, PRs, issues, docs, meetings, and people’s heads.

When the decision is challenged, the organization cannot reconstruct:
- what was decided
- what evidence was available
- what the AI or agents contributed
- what humans reviewed
- who approved it
- whether the decision was correct

This is not a documentation problem. It is a **decision accountability** problem.

### 1.2 The product
Tarka turns a high-stakes decision into a **decision record with executable evidence**:
- decision inventory
- claims linked to sources
- dissent and alternatives
- executable decision pins
- human approval
- audit-ready evidence pack
- outcome tracking

### 1.3 The business
Sell the evidence layer through three buyers:
1. **Deal teams** — decision diligence before an acquisition or investment.
2. **Boards and audit committees** — annual assurance that high-stakes decisions meet a standard.
3. **Insurers** — underwriting and claims evidence for AI-related decision risk.

### 1.4 Why now
- AI agents are making architectural and operational decisions at scale.
- Coding agents violate a large share of project policies and miss context that is not in the code.
- AI assurance is becoming a budget line, but most companies are not actually audit-ready.
- AI liability insurance is growing, but insurers lack claims data and decision-level evidence.
- M&A teams are using GenAI heavily but still lack AI-aware technical diligence.
- EU AI Act enforcement is phasing in: transparency and enforcement from August 2026, high-risk Annex III from December 2027, Annex I from August 2028.

### 1.5 What is durable vs commoditized

| Durable | Commoditized |
|---|---|
| Decision records and evidence | Prompt libraries |
| Approval and accountability | Generic chat UI |
| Organizational decision memory | “Multi-agent” orchestration |
| Code-level decision pins | Model selection |
| Auditor/insurer acceptance | Role-play personas |
| Proprietary outcome data | Token generation |
| Trust, privacy, chain of custody | Summarization |

**Moat = decision evidence graph + executable pins + outcome data + auditor/insurer acceptance.**

---

## 2. Market evidence

### 2.1 Demand signals

| Signal | Evidence | What it means |
|---|---|---|
| AI agents are growing | AI agents market forecast $48–53B by 2030 | More autonomous decisions, more need for evidence |
| AI assurance is a real market | UK AI assurance market >£1B in 2024, projected £18.8B by 2035 | Buyers already pay for assurance |
| Assurance gap | 74% claim AI audit-ready; 27% actually are | Demand exceeds capability |
| AI insurance is forming | Deloitte projects $4.8B premium market by 2032 | Insurers need evidence and claims data |
| M&A uses GenAI | 90% of M&A organizations use or pilot GenAI | AI-aware diligence is lagging |
| Technical DD is under-adopted | Only ~15% of PE deals include dedicated technical DD | Large headroom |
| Decision compliance is poor | Coding agents violate 43.1% of applicable project policies | Agents need decision context and guardrails |
| Context improves compliance | 46% → 95% decision compliance with context | Evidence/context is the product |
| Decision ambiguity is common | 42.7% of generated test suites do not distinguish competing readings | Executable pins are needed |
| Governance is funded | 16.7% of AI spend goes to security/governance | Budget exists |
| Evidence custodians are coming | Gartner: 80% of Global 500 will designate an AI evidence custodian by 2030 | Decision evidence becomes a requirement |

### 2.2 What buyers say they need

From M&A and assurance research:
- Human review remains the top requirement for high-stakes GenAI.
- Data security and approved data sources are critical.
- AI technical debt and AI performance are difficult to validate.
- Audit trails and traceability are requirements, not features.
- Insurers are excluding AI risk because they cannot price what they cannot see.

### 2.3 The competitive map

| Category | Players | Strength | Gap |
|---|---|---|---|
| Decision logs | Decision Log, Decision Desk | Record decisions | No discovery, pins, or code-level enforcement |
| ADR tools | adrkit, Archgate, ADR Guard, Decision Guardian, Mneme | Enforce existing ADRs | Assume the decision was written down |
| Code archaeology | Code Archaeology | Reconstruct history | No enforceable decision or assurance |
| Agent audit | Runback, ProvenanceOne, ByteTrace, AIBlackBox | Runtime traces | Not pre-merge business decisions |
| AI assurance | EY, KPMG, Schellman, ISO 42001 auditors | Trust and certification | Not code-level decision evidence |
| AI insurance | Armilla, Klaimee, Harbor, Ollive, HSB/Munich Re | Risk transfer | Need independent decision evidence/underwriting data |
| M&A diligence | Deloitte, KPMG, Harvey, Positon | Deal workflow and docs | AI/technical decision audit is thin |
| Decision custody | Instantial, Notary Cloud | Chain of custody | Decision quality/review not covered |

### 2.4 Our position
> **The independent, code-level evidence and assurance layer for high-stakes AI-assisted decisions.**

Not a decision log. Not an ADR linter. Not an AI governance dashboard. Not a law firm. Not an insurer. The evidence layer they all need.

### 2.5 Competitive reality (October 2026)

The exact product — an independent, code-level decision evidence pack for technical M&A and post-close assurance — does not exist as a packaged category. The components do.

| Layer | Examples | What they own | What they do not own |
|---|---|---|---|
| AI governance platforms | Credo AI, Holistic AI, IBM watsonx.governance, Microsoft Purview, OneTrust, Vanta, ServiceNow AI Control Tower, Mitratech Alyne | Policy packs, risk registers, model inventories, framework mapping | Code-level deal decisions, contradictions, executable evidence |
| AI audit trails / agent observability | Airia, Lyzr, LangSmith, Langfuse, AgentOps, Arize, Galileo | Runtime traces, prompts, tool calls, evaluation | Pre-merge business decisions, deal impact, auditor-ready decision records |
| Decision logs / ADR tools | ADR tools, Backstage ADR plugins, Log4Brains, decision-log templates | Written decisions and architecture notes | Discovery, evidence linking, enforcement, assurance |
| Technical due diligence | Crosslake, AKF Partners, West Monroe, RSM, Alvarez & Marsal, Deloitte, BD Emerson, boutiques | Human diligence, interviews, code review, integration planning | AI/technical decision audit at code level, repeatable evidence standard |
| AI assurance / audit | EY, KPMG, Schellman, ISO 42001 auditors, Holistic AI | Certification, controls, audit opinions | Code-level decision evidence, deal-grade artifacts |
| AI insurance | Armilla, Klaimee, Harbor, Ollive, HSB/Munich Re | Risk transfer, underwriting, claims | Independent decision evidence and claims data |
| Financial-close evidence | SafeBooks AI and audit-software vendors | Close controls, financial audit evidence | Technical/product decisions and post-close integration risk |
| M&A deal platforms | Datasite, Ansarada, Intralinks | Data rooms, document workflow | Decision evidence, code-level risk, AI decision audit |

**The white space:** an independent, code-level **Decision Evidence Pack** for a specific deal:

1. a decision inventory;
2. claims linked to source evidence;
3. contradictions and unresolved risks;
4. deal-impact ranking;
5. an evidence appendix a deal team, auditor, or insurer can inspect.

No one owns that end-to-end.

**What is already taken:** AI governance dashboards, runtime agent observability, ADR/decision logs, generic technical due diligence, AI audit certification, AI insurance underwriting, and financial-close evidence packs.

**What is not a moat:** the phrase “decision debt” (already used by KPMG and consultancies), the debate UI, the model, the persona system, or a generic “AI-powered” claim.

**The moat:** the decision evidence graph + a repeatable standard + auditor/insurer acceptance + outcome data. The first two are buildable; the last two require partnerships and time.

**The window:** 12–24 months. Big 4 firms and boutiques can add the service; governance vendors can add “decision records.” The opening is a narrow, service-led wedge before the platform.

---

## 3. Product portfolio

### 3.1 Product ladder

| Product | Buyer | Price | Phase | Purpose |
|---|---|---|---|---|
| Decision Debt Scan | CTO/platform lead/agency | Free–$15k | 0–1 | Lead generation, repo insight |
| M&A Decision Diligence | PE/VC/corp dev | $10k–$20k design partner; $25k–$100k/deal standard | 1 | Cash, case studies, evidence corpus |
| Decision Assurance | Board/audit committee/CISO | $30k–$150k/year | 2 | Recurring revenue, standard |
| Decision Bond | Enterprise/PE/insurer | 1–3% of value / $50k–$250k | 3 | Risk transfer, moat |
| Decision Forensics | Insurer/law firm/enterprise | $50k–$250k/incident | 2–3 | High-urgency service, claims data |
| Decision Platform | Enterprise | $50k–$250k/year | 3–4 | Continuous evidence, controls, API |

### 3.2 Core objects

**Decision**
- id, title, type, status
- owner, approver, reviewers
- context, constraints, options
- recommendation, assumptions
- scope: repos, paths, services, APIs
- evidence, claims, dissent
- pins, approvals, signatures
- supersedes / supersededBy
- revisit date, outcome

**Evidence**
- source type, URL/path, quote
- source hash, retrievedAt
- confidence, status (verified/disputed/unsupported)
- linked claims and decisions

**Pin**
- decision point
- chosen value
- separating input/test
- expected result
- code scope
- owner
- last run, last result
- supersession trigger

**Approval**
- actor, role, timestamp
- signature/hash
- conditions
- exception reason

### 3.3 What we will not build

- An AI governance dashboard or policy pack.
- Runtime agent observability or tracing.
- A generic decision log or ADR linter.
- A full GRC suite.
- A financial-close audit evidence pack.
- AI insurance, a bond, or an insurer portal at launch.
- A generic chat app or consumer debate product.
- A social network for agents or teams.
- A custom agent builder or model marketplace.
- A mobile app before the evidence pack is paid for.
- “Decision debt” as a proprietary brand; use it descriptively.

### 3.4 What we already have and how it changes

| Existing asset | New role | Action |
|---|---|---|
| Council / roles | Review board | Rename to professional roles; remove debate mode from primary nav |
| Synthesis + rubric | Decision record and scoring | Add decision status, approvals, dissent, evidence links |
| Shareable run | Evidence pack / client record | Private by default; redaction; expiring links |
| Evidence map | Evidence graph | Replace lexical matching with semantic claims and source snapshots |
| Run inspector | Audit trail | Add approvals, signatures, decision timeline, outcome |
| Head-to-head | Benchmark | Use internally to prove council vs single model; do not lead with it |
| Templates | Decision types | Package as M&A, architecture, AI-system review playbooks |
| Provider test | Managed model gateway | Add managed credits, routing, budgets, BYOK for advanced |
| Manuscript UI | Trustworthy dossier | Keep; simplify navigation and reduce chat cues |

---

## 4. Buyers and jobs to be done

### 4.1 Phase 1 ICP: M&A / PE
- **Buyer:** partner, principal, corp dev lead, CTO-in-residence, boutique tech DD firm.
- **Trigger:** LOI signed, data room open, deal committee date.
- **Budget:** deal expense; technical DD already costs $15k–$60k for mid-market.
- **Job:** “Tell me what technical/AI decisions could change the deal thesis or post-close cost, and give me evidence I can take to the IC.”
- **Success:** findings that affect price, escrow, reps, or integration plan.

### 4.2 Phase 2 ICP: boards and audit committees
- **Buyer:** audit committee chair, CISO, CTO, chief risk officer.
- **Trigger:** annual audit, AI governance review, regulator inquiry, insurer renewal.
- **Budget:** assurance/compliance budget.
- **Job:** “Give me independent evidence that our high-stakes AI-assisted decisions meet a defensible standard.”
- **Success:** signed attestation accepted by board, auditor, or insurer.

### 4.3 Phase 3 ICP: insurers and risk managers
- **Buyer:** AI liability MGA, specialty insurer, broker, enterprise risk manager.
- **Trigger:** policy renewal, claim, new agent deployment, exclusion negotiation.
- **Budget:** underwriting/claims/risk budget.
- **Job:** “Price and monitor AI decision risk with evidence, and reconstruct it when something goes wrong.”
- **Success:** lower loss ratio, faster underwriting, defensible claims.

### 4.4 Phase 4 ICP: enterprise platform
- **Buyer:** CTO, platform team, AI center of excellence.
- **Trigger:** scaling coding agents, multi-team AI adoption, audit requirement.
- **Job:** “Make decision context and evidence part of how every team and agent works.”
- **Success:** weekly active teams, fewer repeated decisions, faster reviews.

### 4.5 The first monetizable product: Decision Diligence Sprint

Do not sell the platform. Sell one report.

- **Offer:** a 10-day Decision Diligence Sprint for one deal.
- **Inputs:** repository access, data room, three interviews.
- **Output:** a 10–15 page report, an evidence appendix, and a 60-minute IC readout.
- **Scope:** 10–20 high-stakes technical/AI decisions; the top five deal-impact risks; contradictions; unresolved evidence; ten diligence questions.
- **Price:** first two design partners at $10k–$20k with case-study rights; standard $25k–$50k after two case studies.
- **Why this is the wedge:** it is budgeted, time-boxed, and produces a tangible artifact. The buyer does not need to adopt a platform, change workflow, or trust a model.
- **What we build for it:** repo ingestion, decision extraction, claim/evidence links, contradiction detection, report generator, human review, and a redacted share link. No bond, no insurer portal, no GRC dashboard.
- **14-day validation:** 20 interviews, 10 repo scans, 2 sample reports, 2 paid offers. If no one pays, stop and keep the research.

---

## 5. Phase 0 — Validation (20 Oct–3 Nov 2026)

### Objective
Prove that a buyer will pay $10k+ for a decision diligence report before we build a platform, with a path to $25k+ after case studies.

### Deliverables
- 20 buyer interviews.
- 10 repo scans.
- 1 Decision Diligence Report sample.
- 1 Decision Debt Report sample.
- Pricing test: $10k, $25k, $50k.
- 2 design partners with signed LOIs or paid pilots at $10k+.
- Legal/NDA template and data-handling policy.
- Go/no-go decision.

### Workstreams

| Workstream | Actions | Output |
|---|---|---|
| Positioning | Rewrite one-page pitch for M&A/PE decision diligence | 1-page PDF |
| Buyer list | 50 PE/VC/corp dev/boutique DD targets | CRM list |
| Outreach | 20 warm intros, 50 cold emails, 20 calls booked | Pipeline |
| Product | Manual scan of 10 repos; build report template | Sample report |
| Evidence | Define decision/evidence schema v0.1 | Schema doc |
| Pricing | Test $10k/$25k/$50k; ask for LOI | Price signal |
| Legal | NDA, data handling, disclaimer, E&O quote | Templates |
| Proof | Interview 3 deal teams about post-close surprises | Case notes |

### Weekly plan

**Week 1**
- Finalize ICP and one-page pitch.
- Build 50-account list.
- Send 30 outreaches.
- Scan 5 repos manually.
- Draft report outline.

**Week 2**
- Complete 20 interviews.
- Produce 2 sample reports.
- Ask 5 buyers for a paid pilot at $10k+.
- Secure 2 LOIs/paid pilots at $10k+.
- Decide go/no-go.

### Gate
- 20 interviews completed.
- 10 repos scanned.
- At least 2 buyers commit to a paid pilot at $10k+.
- At least 1 buyer says the report could change price, escrow, or go/no-go.

**If gate fails:** narrow to agencies or boutique tech DD firms; do not build the platform. If no paid demand after 30 interviews, stop and reassess.

### Budget
- $2k–$5k: travel/events optional, legal template, design.
- Founder time: full-time.
- No hires.

---

## 6. Phase 1 — Wedge and cash (4 Nov 2026–31 Jan 2027)

### Objective
Deliver 2–3 paid decision diligence engagements at $10k+ for design partners, build the repeatable evidence engine, and publish a benchmark.

### Product deliverables
- `tarka scan` CLI and GitHub App.
- Decision inventory and decision-debt scoring.
- Decision Diligence Report (PDF/HTML).
- Evidence pack with source links and hashes.
- Decision pin v0.1 for 3 decision types.
- Internal review console.
- Data room ingestion: GitHub/GitLab, docs, issues, PRs.

### Service deliverables
- Scoping call and access checklist.
- 10-day diligence sprint.
- Draft findings review.
- Final report and IC presentation.
- Post-close remediation plan.

### Workstreams

| Workstream | Actions | Output |
|---|---|---|
| Product | Scan pipeline, report generator, evidence graph | v0.1 |
| Service | Delivery playbook, templates, QA checklist | Repeatable offer |
| Sales | 50 accounts, 100 outreaches, 10 meetings/week | Pipeline |
| Proof | 20 repos, 100 decisions, 20 decision debts | Benchmark data |
| Partnerships | 5 boutique tech DD firms, 3 VCs | Referral channel |
| Finance | Invoicing, contracts, collections | Cash |
| Legal | NDA, MSA, data processing, disclaimer | Contract pack |

### Product scope for Phase 1
Build only what the diligence report needs:
1. Ingest repo and docs.
2. Identify architecturally significant changes.
3. Extract candidate decisions with evidence.
4. Score decision debt.
5. Generate report.
6. Let a human confirm/edit findings.
7. Export signed evidence pack.

Do not build the full assurance portal yet.

### Decision types for v0.1
Start with three high-value, testable categories:
- **Auth/permissions** — who can access what.
- **Tenancy/data ownership** — tenant isolation and data boundaries.
- **Money/rounding/idempotency** — financial correctness and retries.

These are common, high-impact, and testable.

### Pricing
- Design partner pilot: $10k–$20k for a 10-day diligence sprint, with case-study rights.
- Standard: $25k–$50k after two case studies.
- Complex/multi-repo: $75k–$100k.
- Do not discount below $10k for a design partner. After two case studies, do not discount below $25k.

### Gate
- 2 paid engagements completed at $10k+; at least one at $20k+.
- 1 repeat/referral request.
- 70%+ precision on confirmed decision findings.
- Report delivered within 10 business days.
- At least 1 finding changed a deal term or integration plan.
- 1 auditor or insurer intro.

**If gate fails:** stay a boutique diligence service; do not build assurance software. If no paid engagement after 20 qualified conversations, change ICP (agencies or legacy modernization).

### Budget
- $15k–$30k: contract engineer/designer, legal, infra.
- Founder: sales + delivery.
- Target revenue: $25k–$50k from 2–3 design-partner pilots.

---

## 7. Phase 2 — Recurring assurance (1 Feb–31 Jul 2027)

### Objective
Turn the diligence evidence pack into an annual **Decision Assurance** product, with an auditor partner and 5 recurring contracts.

### Product deliverables
- Assurance portal: evidence room, controls, findings, management responses.
- Decision Assurance Standard v0.1 (open, published).
- Controls mapping: ISO/IEC 42001, NIST AI RMF, EU AI Act, SOC 2.
- Audit export and signed attestation.
- Continuous monitoring for decision drift.
- SSO, roles, retention, audit log.
- SOC 2 Type I readiness.

### Service deliverables
- Readiness assessment.
- Evidence gap remediation.
- Annual assurance engagement.
- Attestation report.
- Board/audit committee briefing.

### Workstreams

| Workstream | Actions | Output |
|---|---|---|
| Standard | Write DAS v0.1; map to ISO/NIST/EU | Public standard |
| Product | Portal, controls, evidence export | v1 |
| Audit partner | 5 boutique audit firms; 2 co-selling | Partner LOIs |
| Sales | 30 enterprise accounts; 10 board/audit intros | Pipeline |
| Delivery | Assurance playbook and QA | Repeatable |
| Security | SOC 2 Type I, pen test, DPA | Trust package |
| Insurance | 3 insurer/broker conversations | Design partner |

### Pricing
- Readiness assessment: $15k–$30k.
- Annual assurance: $30k–$75k for mid-market; $100k–$150k for enterprise.
- Continuous monitoring: $15k–$50k/year.
- Bundle: readiness + first-year assurance at $50k–$100k.

### Gate
- 5 annual assurance contracts.
- $250k–$500k ARR.
- 1 audit firm co-selling agreement.
- 1 insurer/broker design partner.
- SOC 2 Type I.
- 90% gross retention.
- At least 80% of evidence collected automatically.

**If gate fails:** remain a high-end diligence firm; do not chase the bond. A $1M services business is still viable.

### Team
- Founder/CEO.
- CTO/engineering lead.
- Full-stack engineer.
- Applied AI/retrieval engineer.
- Assurance lead (contract or fractional).
- Designer (contract).
- Advisor: audit/assurance; advisor: M&A.

### Budget
- $250k–$400k.
- Target revenue: $400k–$750k.

---

## 8. Phase 3 — Insurer partnership and decision bond (Aug 2027–Apr 2028)

### Objective
Become the evidence and underwriting layer for an insurer/MGA, and launch a decision bond pilot.

### Product deliverables
- Underwriting data model.
- Decision risk score and evidence completeness score.
- Claims/forensics module.
- Insurer portal: risk selection, evidence review, loss reconstruction.
- API for policy administration and claims.
- Decision bond contract templates with partner.

### Partnership deliverables
- 1–2 insurer/MGA partners.
- Co-branded policy or warranty.
- Underwriting guidelines.
- Claims workflow and evidence standard.
- Reinsurance/legal review.

### Workstreams

| Workstream | Actions | Output |
|---|---|---|
| Insurance | 10 insurer/MGA/broker meetings; term sheet | Partnership |
| Underwriting | Build risk model on 100+ decisions | Model |
| Forensics | Post-incident reconstruction playbook | Service |
| Legal | Insurance regulatory review; E&O; privacy | Signoff |
| Product | Insurer portal, API, claims export | v1 |
| Sales | 10 enterprise/PE accounts | Pipeline |
| Data | 100+ decisions with outcomes | Dataset |

### Pricing
- Platform/evidence fee: $50k–$150k/year.
- Per-bond fee: 1–3% of decision value, minimum $50k.
- Revenue share with insurer/MGA.
- Claims/forensics: $50k–$250k per incident.

### Gate
- 1 signed insurer/MGA partnership.
- 2 bond pilots.
- 100+ decisions with evidence/outcome data.
- Legal/regulatory signoff.
- Loss ratio or risk model validated with partner.
- $1M+ ARR run rate.

**If gate fails:** remain an assurance platform. Do not become an insurer. The bond is optional; the evidence layer is the business.

### Budget
- $600k–$1M.
- Target revenue: $1M–$2M.

---

## 9. Phase 4 — Category platform (May 2028–Dec 2029)

### Objective
Make decision evidence a standard part of technical M&A, enterprise assurance, and agent workflows.

### Product
- Decision graph across repositories, docs, and deals.
- API/MCP for agents and auditors.
- Marketplace of decision templates and review playbooks.
- Multi-tenant enterprise platform.
- International data residency.
- Outcome tracking and benchmark.

### GTM
- Direct enterprise sales.
- Audit/insurer channel.
- M&A advisor channel.
- Open standard and benchmark.
- Conference and category content.

### Targets
- 50–100 enterprise/assurance customers.
- $5M ARR.
- Net revenue retention >120%.
- 2–3 verticals: technology M&A, AI assurance, agent governance.
- 1–2 international markets.

### Gate
- $5M ARR.
- 50+ customers.
- 3+ channel partners.
- Gross margin >70%.
- Category recognition (analyst/auditor/insurer citations).
- Repeatable sales playbook.

---

## 10. Phase 5 — Risk infrastructure (2030–2031)

### Objective
Become the default decision evidence and risk data layer, with a path to $20M+ ARR or strategic acquisition.

### Products
- Decision risk ratings/data.
- Insurance/underwriting analytics.
- Benchmark and certification.
- Decision graph API.
- M&A and enterprise assurance.

### Targets
- $20M+ ARR.
- 300+ enterprise/assurance customers or 50+ insurer/PE accounts.
- Proprietary outcome dataset.
- Strategic partnerships with insurers, auditors, and deal platforms.
- Acquisition interest from GRC, insurance, DevOps, or decision-intelligence platforms.

### Gate
- $15M+ ARR.
- 110%+ NRR.
- Clear category leadership.
- Strategic acquirer interest or independent profitability.

---

## 11. Technical architecture and build plan

### 11.1 Architecture

```
Data sources
  GitHub / GitLab / Bitbucket
  Notion / Confluence / Google Docs
  Jira / Linear
  Slack / Teams
  Data rooms
        |
        v
Ingestion workers
  repo scanner
  document parser
  git/PR/issue history
  evidence snapshotter
        |
        v
Decision graph (Postgres + pgvector)
  decisions, claims, evidence, pins, approvals, outcomes
  source hashes, links, versions
        |
        v
Analysis engine
  decision discovery
  decision debt score
  contradiction detection
  pin generator
  compliance checker
        |
        v
Surfaces
  CLI / GitHub App
  review console
  diligence report
  assurance portal
  insurer/auditor portal
  MCP/API for agents
```

### 11.2 Phase-by-phase engineering

**Phase 0–1**
- Next.js app + Postgres.
- GitHub App and CLI.
- Repo/doc ingestion.
- LLM extraction with human confirmation.
- Decision/evidence/pin schema v0.1.
- Report generator (HTML/PDF).
- Source snapshots + hashes.
- Basic auth, tenant isolation, NDA-safe data handling.

**Phase 2**
- Assurance portal.
- Controls mapping.
- Audit log and approvals.
- SSO, roles, retention.
- Queue/workers for long scans.
- SOC 2 Type I readiness.
- API v1.

**Phase 3**
- Insurer portal and underwriting data model.
- Claims/forensics export.
- Risk scoring.
- MCP/agent guard.
- Data residency options.

**Phase 4**
- Decision graph at scale.
- Marketplace/templates.
- Public API and webhooks.
- Outcome analytics.
- Benchmark service.

### 11.3 Non-negotiables
- Private by default.
- No training on customer data.
- Source snapshots with hashes.
- Human confirmation for inferred decisions.
- Append-only audit log.
- Expiring share links and redaction.
- Tenant isolation.
- Cost caps and model routing.
- E2E tests before enterprise sales.

---

## 12. Go-to-market playbook

### 12.1 Phase 1: M&A / PE

**Offer:** “AI/technical decision diligence before you sign.”

**Target list:**
- PE firms with software/tech thesis.
- Corporate development teams.
- Boutique technical DD firms.
- VCs doing technical diligence.
- M&A advisors and lawyers.

**Outreach:**
- Warm intro through operators/CTOs.
- LinkedIn: “We audit the technical decisions that never make it into the data room.”
- Content: “The 10 decisions that kill post-close integration.”
- Partner with boutique tech DD firms as a specialist workstream.

**Sales script:**
> “We look at the target’s code, history, and docs to find the technical decisions that are undocumented, contradictory, or unsupported by evidence. We score them by deal impact, show you what could change the thesis or post-close cost, and give you an evidence pack for the IC. Fixed fee, 10 days.”

**Discovery questions:**
1. What technical decisions could change the deal thesis?
2. What AI/technical debt is not visible in the data room?
3. What post-close surprises have you had before?
4. Who owns architecture decisions after close?
5. What evidence would your IC accept?
6. What would make you reprice or walk away?
7. What is the cost of one missed decision?

### 12.2 Phase 2: assurance

**Offer:** “Annual independent assurance over high-stakes AI-assisted decisions.”

**Target:**
- Audit committee chairs.
- CISOs and CTOs.
- AI governance leads.
- Enterprises using AI in regulated decisions.

**Channel:**
- Audit firms as co-sell partners.
- Insurers/brokers as introducers.
- Board/audit committee events.
- Benchmark report and standard.

### 12.3 Phase 3: insurance

**Offer:** “Decision evidence for underwriting and claims.”

**Target:**
- AI liability MGAs and insurers.
- Brokers.
- Enterprise risk managers.

**Channel:**
- Co-branded pilot.
- Evidence standard.
- Claims reconstruction service.

### 12.4 Content engine
- “Decision Debt Report” annual benchmark.
- “AI Decision Diligence Checklist” for M&A.
- “Decision Assurance Standard” public spec.
- Case studies: risks caught, deal terms changed, time saved.
- Webinars with boutique DD firms and insurers.

### 12.5 Pipeline math (Phase 1)
- 100 targeted accounts.
- 30% response.
- 10 meetings.
- 3 proposals.
- 1–2 paid pilots.
- Repeat.

---

## 13. Pricing and financial model

### 13.1 Pricing

| Product | Price | Notes |
|---|---|---|
| Decision Debt Scan | Free | Lead magnet; top 5 findings |
| Paid scan | $5k–$15k | Full report, 3 pins |
| M&A Decision Diligence | $10k–$20k design partner; $25k–$100k standard | Fixed fee; 10–15 days |
| Assurance readiness | $15k–$30k | Gap assessment |
| Annual assurance | $30k–$150k/year | Signed attestation |
| Continuous monitoring | $15k–$50k/year | Decision drift, PR/agent guard |
| Decision Bond | 1–3% of value / $50k min | Insurer-backed |
| Forensics | $50k–$250k/incident | Insurer/law firm |
| Enterprise platform | $50k–$250k/year | SSO, API, audit, retention |

### 13.2 Unit economics targets
- Diligence gross margin: 60–70%.
- Assurance gross margin: 70–80%.
- Platform gross margin: 80%+.
- Bond revenue share: 20–40% of premium.
- Model costs under 20% of revenue.
- Sales and delivery under 50% of revenue by Phase 4.

### 13.3 Revenue targets

| Phase | Period | Revenue | Customers |
|---|---|---:|---:|
| 0 | Oct–Nov 2026 | $0 | 2 design partners |
| 1 | Nov 2026–Jan 2027 | $25k–$50k | 2–3 design-partner pilots |
| 2 | Feb–Jul 2027 | $400k–$750k | 5 assurance + 5 diligence |
| 3 | Aug 2027–Apr 2028 | $1M–$2M | 10 assurance + 10 diligence + 2 bonds |
| 4 | May 2028–Dec 2029 | $5M ARR | 50–100 |
| 5 | 2030–2031 | $20M+ ARR | 300+ or 50+ enterprise |

These are targets, not promises. Gates decide whether to continue.

### 13.4 Funding
- Phase 0–1: bootstrap, $10k–$30k.
- After 2 paid pilots: angel/seed $500k–$1.5M.
- After $1M ARR: Series A optional.
- Do not raise before paid demand.

---

## 14. Team and hiring

### Phase 0
- Founder: sales, product, delivery.
- Contract: designer, legal, security advisor.

### Phase 1
- Founder/CEO.
- Founding engineer (full-stack + data).
- Contract applied AI/retrieval engineer.
- Contract designer.
- Advisor: M&A/PE.
- Advisor: audit/assurance.

### Phase 2
- CTO/engineering lead.
- 2 engineers.
- Assurance lead.
- GTM lead.
- Designer.
- Advisor: insurance.

### Phase 3
- 8–12 people.
- Insurance partnerships lead.
- Forensics lead.
- Security/compliance lead.
- Customer success.

### Phase 4
- 20–30 people.
- Enterprise sales.
- Channel partnerships.
- Research/evaluation.
- International.

### Culture
- Evidence over assertion.
- Human confirmation over automation.
- Narrow wedge over platform sprawl.
- Sell the record, not the agents.
- Publish the benchmark, including failures.

---

## 15. Legal, compliance, and trust

### 15.1 Positioning
Tarka is an evidence and assurance provider, not:
- a law firm
- an auditor of financial statements
- an insurer
- a fiduciary
- a model vendor

Use partners for regulated activities.

### 15.2 Contracts
- NDA.
- MSA.
- Data processing agreement.
- Subprocessor list.
- Security addendum.
- Acceptable use.
- Disclaimer and limitation of liability.
- Professional liability/E&O insurance.

### 15.3 Standards mapping
- ISO/IEC 42001 (AI management system).
- NIST AI Risk Management Framework.
- EU AI Act (transparency, high-risk, post-market monitoring).
- SOC 2 (security, availability, confidentiality).
- ISO 27001 (optional).
- Insurer underwriting requirements.

### 15.4 Data handling
- Private by default.
- No training on customer data.
- Customer-controlled retention.
- Redaction.
- Expiring links.
- Region-specific storage.
- On-prem/VPC option for enterprise.
- Chain-of-custody export.

### 15.5 Evidence integrity
- Hash every source snapshot.
- Timestamp and sign records.
- Append-only audit log.
- Reconstructable decision pack.
- Human approval and dissent.
- Clear separation between evidence and judgment.

### 15.6 Regulatory timeline
- **2 Aug 2026:** EU AI Act majority applies; transparency and enforcement start.
- **2 Dec 2026:** Article 50(2) transition for synthetic content.
- **2 Dec 2027:** High-risk Annex III obligations apply.
- **2 Aug 2028:** High-risk Annex I obligations apply.
- Use this timeline to sell readiness, not fear.

---

## 16. Metrics and gates

### 16.1 North star
**Number of high-stakes decisions with a complete, accepted evidence record per month.**

### 16.2 Phase metrics

| Phase | Metric | Target |
|---|---|---|
| 0 | Buyer interviews | 20 |
| 0 | Repo scans | 10 |
| 0 | Paid pilots/LOIs | 2 |
| 1 | Paid diligence revenue | $25k–$50k |
| 1 | Decision discovery precision | 70%+ |
| 1 | Report turnaround | 10 business days |
| 1 | Findings that changed a deal term | 1+ |
| 2 | Annual assurance contracts | 5 |
| 2 | ARR | $250k–$500k |
| 2 | Gross retention | 90% |
| 2 | Audit/insurer partner | 1 |
| 3 | Insurer/MGA partnership | 1 |
| 3 | Bond pilots | 2 |
| 3 | ARR | $1M–$2M |
| 4 | ARR | $5M |
| 4 | Customers | 50–100 |
| 4 | NRR | 120%+ |
| 5 | ARR | $20M+ |

### 16.3 Kill criteria
- No paid pilot after 20 qualified conversations.
- No repeat engagement after 3 paid diligence projects.
- Discovery precision below 60% on confirmed decisions.
- No auditor/insurer interest after 6 months.
- Gross margin below 50% for two consecutive quarters.
- Founder cannot deliver 2 engagements per month with quality.
- A well-funded incumbent bundles the exact loop and wins distribution.

### 16.4 Pivot options
- **Services-first:** boutique decision diligence firm.
- **Product-led:** decision debt SaaS for engineering teams.
- **Insurance-only:** evidence layer for an MGA.
- **M&A-only:** AI-aware technical diligence boutique.
- **Open standard:** publish the schema and sell certification.

---

## 17. 90-day weekly plan

| Week | Focus | Output |
|---|---|---|
| 1 | ICP, pitch, buyer list | 50 accounts, 1-page pitch |
| 2 | 20 interviews, 5 scans | 2 sample reports, 2 LOIs |
| 3 | Pilot scoping, NDA/MSA | Signed pilot |
| 4 | Build scan pipeline | Repo/doc ingestion |
| 5 | Decision extraction v0.1 | Decision inventory |
| 6 | Decision debt score | Ranked findings |
| 7 | Report generator | First paid report |
| 8 | Deliver pilot 1 | Finding review, IC deck |
| 9 | Deliver pilot 2 / referral | Testimonial, referral |
| 10 | Decision pin v0.1 | 3 executable pins |
| 11 | Benchmark 20 repos | Benchmark draft |
| 12 | Assurance standard outline | DAS v0.1 |
| 13 | Review, price, raise/next | Go/no-go for Phase 2 |

---

## 18. Appendices

### A. Decision evidence schema (v0.1)

```json
{
  "id": "dec_...",
  "title": "",
  "type": "architecture|security|data|vendor|incident|ai",
  "status": "proposed|approved|superseded|rejected",
  "owner": "",
  "approver": "",
  "context": "",
  "constraints": [],
  "options": [],
  "recommendation": "",
  "assumptions": [],
  "scope": {
    "repos": [],
    "paths": [],
    "services": [],
    "apis": []
  },
  "claims": [
    {
      "text": "",
      "evidenceIds": [],
      "status": "verified|disputed|unsupported"
    }
  ],
  "evidence": [
    {
      "source": "",
      "url": "",
      "quote": "",
      "hash": "",
      "retrievedAt": ""
    }
  ],
  "dissent": [],
  "pins": [
    {
      "point": "",
      "chosen": "",
      "input": "",
      "expected": "",
      "test": "",
      "lastRun": ""
    }
  ],
  "approvals": [
    {
      "actor": "",
      "role": "",
      "timestamp": "",
      "signature": ""
    }
  ],
  "supersedes": null,
  "supersededBy": null,
  "revisitAt": "",
  "outcomes": []
}
```

### B. Diligence report outline

1. Executive summary and deal implication.
2. Scope, access, and limitations.
3. Decision inventory (top 20).
4. Decision debt score and heat map.
5. Undocumented or contradictory decisions.
6. AI/model/vendor exposure.
7. Evidence gaps and unsupported claims.
8. Post-close remediation plan and cost.
9. Reps, warranties, escrow, and price considerations.
10. Appendix: evidence pack, pins, code references.

### C. Decision Assurance Standard outline

- Scope and boundary.
- Decision inventory completeness.
- Evidence sufficiency.
- Claim verification.
- Dissent and alternatives.
- Human approval and authority.
- Pin/test coverage.
- Monitoring and change control.
- Incident and claims reconstruction.
- Independence and conflicts.
- Attestation period and exceptions.
- Management response.
- Re-performance and sampling.

### D. Discovery questions

1. What decision could change the deal thesis?
2. What technical decisions are not in the data room?
3. What AI/technical debt would surprise a buyer?
4. Who owns architecture decisions post-close?
5. What evidence would your IC accept?
6. What would make you reprice or walk away?
7. What post-close surprises have you had?
8. What is the cost of one missed decision?
9. Who else reviews this today?
10. What would make you buy this now?

### E. Outreach categories

- PE firms with software/tech thesis.
- Corporate development teams.
- Boutique technical DD firms.
- VC technical diligence teams.
- M&A lawyers and advisors.
- Audit/assurance firms.
- AI liability MGAs/brokers.
- Enterprise AI governance leaders.

### F. Sources

1. BCC Research, AI agents market, 5 Jan 2026. https://www.globenewswire.com/news-release/2026/01/05/3213141/0/en/AI-Agents-Market-to-Grow-43-3-Annually-Through-2030.html
2. MarketsandMarkets, AI agents market, 20 Aug 2026. https://www.globenewswire.com/de/news-release/2026/08/20/3348589/0/en/ai-agents-market-surges-to-52-62-billion-at-a-cagr-46-3-by-2030-report-by-marketsandmarkets.html
3. MarketsandMarkets, decision intelligence market, 22 Mar 2024. https://www.prnewswire.com/news-releases/decision-intelligence-market-worth-50-1-billion-by-2030---exclusive-report-by-marketsandmarkets-302096971.html
4. SNS Insider, decision intelligence market, 5 Aug 2026. https://www.globenewswire.com/news-release/2026/08/05/3339075/0/en/decision-intelligence-market-set-to-surpass-88-98-billion-by-2035-sns-insider.html
5. Gartner, 40% agentic AI projects canceled, 25 Jun 2025. https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
6. Gartner, agent governance failure, 26 May 2026. https://www.gartner.com/en/newsroom/press-releases/2026-05-26-gartner-says-applying-uniform-governance-across-ai-agents-will-lead-to-enterprise-ai-agent-failure
7. Gartner, agentic AI runtime controls, 24 Sep 2026. https://www.gartner.com/en/articles/agentic-ai-infrastructure-governance
8. TechTarget, Gartner evidence custodians, 23 Sep 2026. https://www.techtarget.com/it-strategy/news/366650933/Gartner-sees-CIOs-becoming-AI-evidence-custodians
9. TechTarget, AI decision trails, 4 Jun 2026. https://www.techtarget.com/enterprise-software/feature/AI-decision-trails-are-the-new-audit-trail
10. IDC, AI agent governance spending, 29 Jul 2026. https://www.idc.com/resource-center/blog/ai-agent-governance-enterprise-investment/
11. SWE-CC, repository policy compliance, arXiv:2610.06193, 2026. https://arxiv.org/abs/2610.06193
12. Brief, decision compliance benchmark, arXiv:2605.08112, 27 Apr 2026. https://arxiv.org/abs/2605.08112
13. Decision pins, arXiv:2610.03237, 2 Oct 2026. https://arxiv.org/abs/2610.03237
14. Architecture Without Architects, arXiv:2604.04990, 2026. https://arxiv.org/abs/2604.04990
15. LLM extraction of design decisions from commits, arXiv:2609.03721, 3 Sep 2026. https://arxiv.org/abs/2609.03721
16. AI forensics process model, arXiv:2608.03520, 2026. https://arxiv.org/html/2608.03520v1
17. UK AI assurance market, BCS, 17 Sep 2025. https://www.bcs.org/articles-opinion-and-research/what-is-ai-assurance
18. Schellman AI audit readiness, 29 Jul 2026. https://markets.businessinsider.com/news/stocks/new-schellman-research-74-of-enterprises-say-they-are-audit-ready-for-ai-only-27-actually-are-1036378202
19. ISO 42001 cost estimator, 2026. https://www.iso42k.com/iso-42001-cost-estimator
20. EU AI Act implementation timeline, official. https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act
21. Deloitte, GenAI in M&A pulse study, 2026. https://www.deloitte.com/us/en/what-we-do/capabilities/mergers-acquisitions/articles/m-and-a-generative-ai-study.html
22. KPMG, AI blind spot in M&A, 4 Aug 2026. https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/ai-blindspot.pdf
23. Cloudskope, IT due diligence cost, 2026. https://www.cloudskope.com/audit-advisory/ma-cyber-it-technical-due-diligence
24. Altimi, technical due diligence guide, 22 May 2026. https://altimi.com/insights/technical-due-diligence-the-complete-guide-for-pe-investors
25. Insurance Insider, AI liability insurance pricing, 1 Sep 2026. https://www.insuranceinsider.com/behind-the-paywall/who-wants-ai-liability-insurance
26. Armilla, AI liability limits to $25M, 21 Jan 2026. https://www.armilla.ai/resources/armilla-ai-expands-lloyds-backed-ai-liability-limits-to-25m
27. Klaimee, AI agent insurance and pricing, 2026. https://www.klaimee.ai/
28. Harbor, AI agent liability insurance, 9 Oct 2026. https://beinsure.com/news/harbor-raises-10mn-to-develop-ai-agent-platform/
29. Ollive, insuring agentic AI, 2026. https://ollive.ai/manifesto
30. EY, AI assurance, 14 Sep 2026. https://www.ey.com/en_th/insights/assurance/ai-assurance-with-soc-attestation-and-certification
31. KPMG, AI assurance services, 25 Sep 2025. https://kpmg.com/us/en/media/news/kpmg-expands-ai-trust-services-with-new-ai-assurance-capabilities.html
32. Instantial, AI custody architecture. https://instantial.ai/product
33. Notary Cloud, AI decision evidence. https://notary-cloud.com/partners
34. O’Reilly, coding agents love decision records, 2 Oct 2026. https://www.oreilly.com/radar/coding-agents-love-decision-records

### G. Glossary

- **Decision debt:** accumulated liability from decisions that were never made explicit, owned, evidenced, or revisited.
- **Decision pin:** a named decision point with a separating test/input that distinguishes the chosen behavior from alternatives.
- **Decision assurance:** independent evaluation and attestation that a decision meets a defined evidence and control standard.
- **Decision bond:** an insurer-backed guarantee tied to a high-stakes decision and its evidence record.
- **Decision evidence graph:** linked decisions, claims, evidence, pins, approvals, and outcomes.
- **Decision diligence:** a time-boxed review of a target’s technical/AI decisions before a transaction.

---

## 19. The next 14 days

- [ ] Finalize the one-page M&A decision diligence offer.
- [ ] Build a 50-account list of PE, VC, corp dev, and boutique tech DD firms.
- [ ] Send 30 warm/cold outreaches.
- [ ] Scan 5 repositories manually.
- [ ] Produce one sample Decision Diligence Report.
- [ ] Interview 20 buyers.
- [ ] Ask 5 for a $10k+ design-partner pilot.
- [ ] Secure 2 paid pilots or LOIs.
- [ ] Get legal/NDA/data-handling templates.
- [ ] Decide go/no-go.

If this works, we build Phase 1. If it does not, we do not build a platform on hope.
