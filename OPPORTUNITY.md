# OPPORTUNITY: Decision Debt Control

**Date:** 20 October 2026
**Status:** Sharpened wedge for the strategy in `STRATEGY.md`.

**Operating plan:** See `MASTER_PLAN.md` for the phase-by-phase execution plan.
**One-line thesis:** Find the decisions your code is already making but nobody wrote down, turn the important ones into executable contracts, and stop humans or AI agents from silently changing them.

---

## 1. The honest finding

There is no completely empty market. Saying “no big company can even dream about this” would be false. The adjacent spaces are already active:

- Decision records and decision logs
- ADR tooling and ADR enforcement
- Architecture drift / erosion detection
- AI agent runtime audit and replay
- Code archaeology and commit-rationale recovery
- Enterprise decision intelligence and governance

But they are **fragmented**. Nobody owns the full loop:

> **Discover hidden decisions → score decision debt → turn them into executable pins → enforce them in PRs and agent sessions → record drift and supersession.**

That loop is the gap. It is narrow enough to launch fast and valuable enough to become infrastructure.

---

## 2. Why the obvious spaces are taken

| Adjacent space | Who is there | What they do | What they do not do |
|---|---|---|---|
| Decision records | Decision Log, Decision Desk | Record decisions, evidence, ownership | Discover missing decisions or enforce them in code |
| ADR enforcement | adrkit, Archgate, ADR Guard, Decision Guardian, Mneme | Lint/enforce ADRs, comment on PRs, MCP context | Find decisions that were never written; score debt; generate executable pins |
| Architecture drift | Drift, ArchDrift, ts-archunit | Detect structural/layer drift | Reason about the decision behind the structure |
| Agent runtime audit | Runback, ProvenanceOne, ByteTrace | Capture/replay agent actions and outputs | Govern the engineering decision before/at merge |
| Code archaeology | Code Archaeology (OSS) | Reconstruct why from commits/PRs/issues | Produce enforceable decisions or stop drift |
| Enterprise decision intelligence | Cloverpop, SAS, IBM, DecisionLedger | Governed decision workflows, models, outcomes | Developer-native, codebase-level decision debt |
| Product context retrieval | Brief | Retrieve recorded product decisions for agents | Discover, pin, and enforce architectural decisions |

The existing tools prove demand. They also prove the white space: **they assume the decision already exists.**

---

## 3. The unclaimed product

### Name
Working name: **Tarka Pin**
Category: **Decision Debt Control**

### What it is
A developer-native system that scans a codebase and its history, finds decisions that are implicit, contradictory, stale, ownerless, or untested, and turns the important ones into **executable decision pins**.

A **decision pin** is:
- the named decision point
- the value/choice the team made
- a test or input that distinguishes the chosen behavior from the alternative
- the code scope it governs
- the owner and evidence
- the revisit trigger

A pin is not a document. It is a contract with a test.

### The loop

1. **Scan**
   Connect GitHub/GitLab. Ingest code, commits, PRs, issues, ADRs, docs, incidents.

2. **Discover**
   Identify architectural choices that were made implicitly:
   - tenancy and data ownership
   - auth and permission boundaries
   - API contracts and error semantics
   - retry/idempotency behavior
   - rounding and money handling
   - model/provider selection
   - data retention and PII handling
   - deployment and rollback assumptions

3. **Score decision debt**
   ```
   decision debt =
     impact (blast radius)
   × ambiguity (competing readings)
   × staleness (no revisit)
   × contradiction (conflicts with another decision)
   × ownership gap
   × enforcement gap (no test/pin)
   ```
   Output: a ranked **Decision Debt Report** with evidence for each candidate.

4. **Pin**
   Generate candidate separating tests/inputs. Keep only those that actually produce different results under the competing interpretations. Ask the owner to confirm the intended choice. The pin becomes executable.

5. **Guard**
   - GitHub App/CI: “This PR changes the retry decision. The pinned test fails. Add a superseding decision or restore the behavior.”
   - MCP/CLI/API: Cursor, Claude Code, Copilot, and Codex query active pins before editing.
   - Agent run: log which pins were consulted and which were violated.

6. **Audit and learn**
   Record drift, supersession, evidence, owner, and revisit date. Export a decision record for audits, onboarding, incidents, and due diligence.

---

## 4. Why this is needed now

### 4.1 AI coding agents are making decisions nobody records
A 2026 paper describes “vibe architecting”: AI coding agents select frameworks, scaffold infrastructure, and wire integrations in seconds, but these architectural decisions are rarely reviewed or recorded [1].

### 4.2 Agents violate the decisions that do exist
The SWE-CC benchmark found that modern coding agents produce functionally correct patches but still violate **43.1% of applicable project policies**; AI-assisted contribution policies had only **15% compliance** in the native setting [2].

### 4.3 Missing context causes most decision failures
Brief’s benchmark measured **46% decision compliance** for Claude Code with codebase access alone versus **95%** with product-context retrieval. On decisions invisible in the codebase, baseline compliance was **0–33%** [3].

### 4.4 Imperfect requirements are settled silently
A 2026 study of 600 generated test suites found **42.7% contained no test that distinguished competing readings** of the requirement [4]. The proposed remedy — decision pins with separating inputs — identified the intended decision **85–90%** of the time and produced separating inputs for **92.5%** of decision points [4].

### 4.5 Decision archaeology is technically possible but immature
LLMs can extract architectural design decisions from commits to a moderate degree (BERT-F1 above 0.81), but the generated decisions are often too long, implementation-focused, and miss the rationale [5]. That is an opening for a system that combines commits, PRs, issues, docs, and human confirmation.

### 4.6 The category language is forming
“Decision debt” is entering the mainstream: Forbes described it as why strong companies move slowly [6], FlexRule published a decision-debt explainer [7], and Decision Desk already markets “Decision Debt” to product and engineering teams [8].

Coding agents and decision records are also converging: O’Reilly published “Coding Agents Love Decision Records” in October 2026 [9].

### 4.7 The agent market and governance budgets are growing
AI agents are forecast to grow from roughly $8B in 2025 to $48–53B by 2030 [10][11]. IDC reports enterprises allocate **16.7% of planned AI spending** to AI/agent security and governance [12].

The need is not more agents. The need is control over what they decide and change.

---

## 5. Why incumbents are structurally slow here

- **GitHub/Microsoft** own the code surface but are focused on code review, security, and Copilot. Decision debt is a semantic layer across code, docs, tickets, and history.
- **GRC vendors** (SAS, IBM, OneTrust, ServiceNow) own policy and audit, but not developer workflows or repository-level decisions.
- **Agent observability vendors** (Runback, ProvenanceOne, ByteTrace) log runtime actions, not pre-merge engineering decisions.
- **ADR tools** (adrkit, Archgate, ADR Guard) enforce decisions that humans already wrote. They do not discover missing decisions or score debt.
- **Consultancies** sell architecture reviews and due diligence, but not a product that continuously scans the codebase.

This is a classic startup wedge: a cross-tool semantic layer that incumbents cannot own without breaking their category focus.

**Caveat:** This is not invisible to big companies forever. The window is real but not permanent. The OSS tools are moving fast. Speed and category ownership matter more than feature completeness.

---

## 6. Who pays first

### Beachhead
**Teams inheriting or modernizing a codebase they do not fully understand.**
- post-acquisition integration
- legacy modernization
- platform migrations
- agencies taking over a client codebase
- technical due diligence / PE diligence

They have an urgent, budgeted question:
> “What decisions does this system depend on, which ones are undocumented or contradictory, and what will break if we change them?”

### Second wedge
**Teams using coding agents on an existing codebase.**
They need agents to stop re-litigating settled decisions and stop silently changing architecture.

### Buyer
- CTO / VP Engineering
- Head of Platform / Staff Engineer
- Agency technical director
- Due diligence / M&A technical lead

---

## 7. Monetization: the high-value ladder

The $99 report is a lead magnet, not the business. High prices come from **risk transfer, regulatory acceptance, or avoidable loss**. The product underneath is the same decision evidence graph; the packaging changes by buyer.

### The golden idea

> **The independent evidence and assurance layer for high-stakes AI-assisted decisions.**

Sell it first as **technical decision diligence** to buyers with a deadline and a budget, then as **annual decision assurance**, then as an **insurer-backed decision bond**.

### The ladder

| Offer | Price | Buyer | What they buy |
|---|---|---|---|
| Free repo scan | $0 | Engineering teams | Top 5 hidden decisions / decision-debt findings |
| Decision Debt Audit | $5k–15k | CTO, platform lead, agency | Full decision-debt report, evidence, prioritized backlog |
| M&A / PE Decision Diligence | $25k–100k per deal | PE, VC, corp dev, M&A | AI/technical decision risk, undocumented decisions, post-close exposure |
| Decision Assurance / Attestation | $30k–150k/year | Board, audit committee, CISO, CTO | Signed evidence pack and annual attestation that high-stakes decisions meet a defined standard |
| Decision Bond / Warranty | 1–3% of decision value, or $50k–250k | Enterprise, PE, board | Insurer-backed protection against material undisclosed decision risk |
| Enterprise platform | $50k–250k/year | Regulated enterprise | Continuous decision evidence, approvals, audit exports, integrations |

**Sequence:** free scan → paid diligence → annual assurance → decision bond.

The first two are cash now. Assurance creates recurring revenue. The bond is the category-defining moat, but it requires an insurer partner and claims data.

### Why these prices are defensible

- A failed architecture or acquisition decision costs far more than $100k.
- Boards and audit committees already pay for assurance.
- Insurers are excluding or limiting AI risk and need evidence to underwrite it.
- M&A teams already pay for technical due diligence and AI-aware diligence.
- The buyer is not “a developer with a $20 budget.” The buyer is a deal team, board, or insurer with a risk budget.

### What already exists — and the gap

| High-value space | Existing players | What they do | The gap |
|---|---|---|---|
| AI assurance | EY, KPMG, Schellman, ISO 42001 auditors | System-level governance, SOC/ISO attestations | Decision-level, code-level evidence for specific high-stakes decisions |
| AI liability insurance | Armilla, Klaimee, Harbor, Ollive, HSB/Munich Re | Carrier products, warranties, risk monitoring | Independent decision evidence and underwriting data across vendors |
| AI forensics | AIBlackBox, Project AIR, agentblackbox, Microsoft playbook | Runtime logs, replay, incident reconstruction | Court-grade, cross-vendor reconstruction of a *business decision*, not just agent logs |
| M&A diligence | Deloitte, KPMG, Harvey, Positon | Document review, AI-enabled deal platforms | AI/technical decision audit with executable evidence and decision debt |
| Decision custody | Instantial, Notary Cloud | Signed decision records, chain of custody, attestation | Review quality, evidence standards, and decision-level assurance |

This is not greenfield. It is a **high-value layer that incumbents do not own end to end**.

### The wedge: M&A / PE decision diligence

Why this is the best first paid offer:
- One deal has a deadline and a budget.
- The buyer is already paying advisors.
- AI/technical debt is a known blind spot in M&A.
- The deliverable is a report a deal team can act on.
- It creates the evidence corpus needed for assurance and insurance.

### The moat: decision bond

The long-term golden idea is a **decision bond**: a financial guarantee attached to a high-stakes decision, backed by independent evidence. If a material risk was missed or a decision was misrepresented, the bond responds. The insurer prices it; Tarka supplies the evidence, monitoring, and claims reconstruction.

This turns Tarka from a tool into **risk infrastructure**. It is hard to copy because it requires:
- a standardized decision evidence record
- an underwriting dataset
- insurer relationships
- claims/forensics capability
- a benchmark that buyers trust

Do not start with the bond. Start with diligence and assurance; earn the data and the trust; then partner with an insurer.

---

## 8. 90-day launch plan

### Weeks 1–2: Scan and report
- CLI: `tarka scan <repo>`; GitHub App.
- Ingest git history, PRs, issues, ADRs, docs.
- Discover candidate decisions with evidence.
- Generate a Decision Debt Report (HTML/PDF).
- Run on 5 public repos and 3 design-partner repos.

### Weeks 3–4: Pins
- Implement the decision-pin schema.
- Generate candidate separating tests/inputs for the top 10 decisions.
- Run the tests; keep only real separators.
- Human confirmation flow.
- Store pins with scope, owner, evidence, revisit date.

### Weeks 5–8: Guard
- GitHub PR check: “This change conflicts with pin X.”
- MCP server for Claude Code/Cursor/Copilot.
- Agent consultation log.
- Supersession workflow: changing a pin requires a new decision record.

### Weeks 9–12: Prove and sell
- Benchmark on 20 repos:
  - decisions discovered
  - decision debt found
  - agent violations prevented
  - review time saved
  - false-positive rate
- Publish 3 case studies.
- Sell 2 paid decision-diligence pilots at $25k+.
- Secure one auditor or insurer design partner.
- Convert one pilot into an annual assurance contract.

---

## 9. The benchmark that proves the category

Build a public **Decision Debt Benchmark**:
- 20 open-source repos with known ADRs and architectural changes.
- 100 decision points with competing interpretations.
- Measure:
  - discovery precision/recall
  - pin separation rate
  - agent compliance before/after context
  - PR violation detection
  - false positives
  - time to review

Target:
- 80%+ discovery precision on confirmed decisions.
- 70%+ pin separation rate.
- 30%+ reduction in agent policy violations.
- 50% reduction in time spent reconstructing why.

Publish the methodology and failures. Trust is the product.

---

## 10. Why this can last

- **Decision debt compounds.** Every codebase accumulates implicit choices.
- **AI increases decision velocity.** More code, more agents, more hidden decisions.
- **Models cannot know your organization.** Context and decisions must live outside the model.
- **Audit and governance demand evidence.** Gartner expects AI evidence custodians and decision trails [13][14].
- **Decision pins create switching costs.** Once teams encode decisions, tests, owners, and history, the graph becomes infrastructure.
- **The outcome dataset is proprietary.** Which pins held, which drifted, which decisions caused incidents.

The moat is not “AI reviews code.” The moat is the **decision graph + executable pins + outcome history**.

---

## 11. Risks and kill criteria

### Risk: false positives
Inferred decisions will be wrong. Mitigation: human confirmation, confidence labels, evidence links, report-only mode first.

### Risk: ADR tools add this
adrkit/Archgate could add discovery. Mitigation: launch the scan/report first, own the “decision debt” category, integrate with their formats rather than fight them.

### Risk: buyers do not care until something breaks
Mitigation: sell to legacy/due-diligence buyers with an immediate triggering event; use incidents as a wedge.

### Risk: extraction quality is poor
Mitigation: combine multiple artifacts, require confirmation, measure precision publicly; do not pretend it is perfect.

### Risk: too broad
Mitigation: one wedge: **decision debt in legacy/agent-modified code**. Do not build a generic decision intelligence platform.

### Kill criteria
- 5 paid audits, fewer than 2 convert to ongoing use → wedge too narrow or report not valuable.
- Discovery precision below 60% on confirmed decisions → improve or narrow to one decision type (e.g., data/tenancy/auth).
- Fewer than 30% of scanned repos have 5+ high-impact debt items → problem not frequent enough.
- OSS tools ship the full loop before you launch → partner/integrate or pick a vertical.

---

## 12. What to build first

1. `tarka scan` CLI + GitHub App.
2. Decision Debt Report.
3. Decision pin schema and separating-test generator.
4. PR guard for 3 decision types (auth, tenancy, money rounding).
5. MCP server for agent consultation.
6. Benchmark harness and public report.

### Do not build yet
- Another chat UI
- A generic decision log
- A full GRC suite
- A marketplace
- Custom agent builder
- Mobile app

---

## 13. The 14-day test

- [ ] Scan 10 public repos.
- [ ] Manually label 50 decisions and 20 decision debts.
- [ ] Generate the first Decision Debt Report.
- [ ] Generate 10 candidate pins and run the separating tests.
- [ ] Put one PR guard in front of a real agent-generated change.
- [ ] Interview 5 CTOs/agency leads about the report.
- [ ] Decide: paid audit, open-source CLI, or team SaaS.

If the report makes a CTO say “I did not know that decision was undocumented,” you have a product.

---

## 14. Sources

1. “Architecture Without Architects: How AI Coding Agents Shape Software Architecture,” arXiv:2604.04990, 2026. https://arxiv.org/abs/2604.04990
2. “Correct Code, Broken Contributions? SWE-CC: Benchmarking Repository Policy Compliance for Coding Agents,” arXiv:2610.06193, 2026. https://arxiv.org/abs/2610.06193
3. Dillon and Varanasi, “Context-Augmented Code Generation: How Product Context Improves AI Coding Agent Decision Compliance by 49%,” arXiv:2605.08112, 27 Apr 2026. https://arxiv.org/abs/2605.08112
4. Mitsui, “Pinning Decisions Before Failure: Executable Records of Underspecified Choices in AI-Assisted Code Generation,” arXiv:2610.03237, 2 Oct 2026. https://arxiv.org/abs/2610.03237
5. Karan et al., “Can LLMs Extract Architectural Design Decisions from Source Code Commits?,” arXiv:2609.03721, 3 Sep 2026. https://arxiv.org/abs/2609.03721
6. Forbes, “Decision Debt Is Why Strong Companies Move Slowly,” 9 Jul 2026. https://www.forbes.com/councils/forbestechcouncil/2026/07/09/decision-debt-is-why-strong-companies-move-slowly/
7. FlexRule, “What is Decision Debt?,” 23 Jul 2026. https://www.flexrule.com/articles/what-is-decision-debt
8. Decision Desk, “Decision Debt” for product and engineering teams. https://decisiondesk.io/solutions/product-engineering
9. O’Reilly, “Coding Agents Love Decision Records,” 2 Oct 2026. https://www.oreilly.com/radar/coding-agents-love-decision-records
10. BCC Research, “AI Agents Market to Grow 43.3% Annually Through 2030,” 5 Jan 2026. https://www.globenewswire.com/news-release/2026/01/05/3213141/0/en/AI-Agents-Market-to-Grow-43-3-Annually-Through-2030.html
11. MarketsandMarkets, “AI Agents Market Surges to $52.62 billion by 2030,” 20 Aug 2026. https://www.globenewswire.com/de/news-release/2026/08/20/3348589/0/en/ai-agents-market-surges-to-52-62-billion-at-a-cagr-46-3-by-2030-report-by-marketsandmarkets.html
12. IDC, “AI Agent Governance Becomes a Core Investment,” 29 Jul 2026. https://www.idc.com/resource-center/blog/ai-agent-governance-enterprise-investment/
13. TechTarget, “Gartner sees CIOs becoming AI ‘evidence custodians’,” 23 Sep 2026. https://www.techtarget.com/it-strategy/news/366650933/Gartner-sees-CIOs-becoming-AI-evidence-custodians
14. TechTarget, “AI decision trails are the new audit trail,” 4 Jun 2026. https://www.techtarget.com/enterprise-software/feature/AI-decision-trails-are-the-new-audit-trail

### High-value market sources

15. BCS, “What is AI assurance?,” 17 Sep 2025 (UK AI assurance market >£1B, projected £18.8B by 2035). https://www.bcs.org/articles-opinion-and-research/what-is-ai-assurance
16. Schellman, “74% of Enterprises Say They Are Audit-Ready for AI, Only 27% Actually Are,” 29 Jul 2026. https://markets.businessinsider.com/news/stocks/new-schellman-research-74-of-enterprises-say-they-are-audit-ready-for-ai-only-27-actually-are-1036378202
17. EY, “AI assurance with SOC, attestation and certification,” 14 Sep 2026. https://www.ey.com/en_th/insights/assurance/ai-assurance-with-soc-attestation-and-certification
18. KPMG, “KPMG expands AI Trust services with new AI Assurance capabilities,” 25 Sep 2025. https://kpmg.com/us/en/media/news/kpmg-expands-ai-trust-services-with-new-ai-assurance-capabilities.html
19. Armilla AI, “Armilla AI Expands Lloyd’s-Backed AI Liability Limits to $25M,” 21 Jan 2026. https://www.armilla.ai/resources/armilla-ai-expands-lloyds-backed-ai-liability-limits-to-25m
20. Klaimee, “AI Agent Insurance, Certification & Guarantee.” https://www.klaimee.ai/about
21. Beinsure, “Insurtech Harbor raises $10mn to develop AI agent liability insurance platform,” 9 Oct 2026. https://beinsure.com/news/harbor-raises-10mn-to-develop-ai-agent-platform/
22. Ollive, “Insuring the Agentic Revolution.” https://ollive.ai/manifesto
23. “AI Forensics Across White-, Grey-, and Black-Box Access,” arXiv:2608.03520, 2026. https://arxiv.org/html/2608.03520v1
24. Deloitte, “2026 Generative AI in M&A Pulse Study,” 2026 (90% using or piloting GenAI; human review is the top requirement). https://www.deloitte.com/us/en/what-we-do/capabilities/mergers-acquisitions/articles/m-and-a-generative-ai-study.html
25. KPMG, “The AI blind spot in M&A,” 4 Aug 2026. https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/ai-blindspot.pdf
26. Instantial, “The AI custody architecture.” https://instantial.ai/product
27. Notary Cloud, “RegTech OEM Evidence Layer.” https://notary-cloud.com/partners

### Adjacent players worth tracking
- adrkit: https://github.com/mbeacom/adrkit
- Archgate: https://github.com/archgate/cli
- ADR Guard / Decision Guardian: listed in https://github.com/architecture-decision-record/architecture-decision-record
- Mneme HQ and kgai: listed in the same ADR index
- Code Archaeology: https://github.com/Prabodh-dev/code-archaeology
- Decision Log: https://www.decisionlog.ai/product
- DecisionLedger: https://decisionledgerai.com/
- Runback, ProvenanceOne, ByteTrace: agent decision capture/provenance tools
- Brief: https://briefhq.ai
- AIBlackBox: https://www.getaiblackbox.com/
- Project AIR: https://github.com/vindicara-inc/projectair
- Armilla, Klaimee, Harbor, Ollive: AI liability insurance
- EY, KPMG, Schellman: AI assurance incumbents
- Deloitte, KPMG, Harvey, Positon: AI-enabled M&A diligence
- Instantial, Notary Cloud: decision custody/evidence layers