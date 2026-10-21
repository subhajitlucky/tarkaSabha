# Tarka Sabha — Product-First Execution Checklist

**Source:** `MASTER_PLAN.md` (21 October 2026), reordered product-first.
**Variant:** The master plan is validation-first. This checklist front-loads the product artifact, then uses it to sell. The phases and gates remain; the order changes.
**Phases:** 6 (Phase 0–5)
**Tasks:** 48
**First task:** 0.1 — Define the Decision Dossier schema.

**Rule:** Build the smallest artifact that proves the value. Do not build the platform, bond, insurer portal, or generic governance dashboard.

---

## Phase 0 — Artifact and validation (4–6 weeks)

**Objective:** Build a sample Decision Dossier and use it to validate paid demand.
**Output:** 3 sample dossiers, 1 landing page, 2 paid design partners/LOIs.

- [ ] **0.1 Define the Decision Dossier schema.**
  - Sections: deal context, executive summary, decision inventory, decision records, contradictions, open questions, evidence appendix, method, limitations, redaction.
  - Define one decision record: context, options, decision, owner, date, evidence, status, deal impact.
- [ ] **0.2 Select 3 repositories with real technical decisions.**
  - Prefer public or consented repos.
  - Cover auth/permissions, tenancy/data ownership, and money/idempotency.
- [ ] **0.3 Write the manual extraction checklist.**
  - What counts as a decision; what counts as evidence; what is a contradiction; what is unresolved.
- [ ] **0.4 Build the first sample dossier manually.**
  - No product code. Use the schema, the repo, and human review.
- [ ] **0.5 Build thin repo ingestion.**
  - GitHub repo, docs, commits, PRs, issues; source snapshots with path and hash.
- [ ] **0.6 Build human-confirmed decision extraction.**
  - LLM proposes; human confirms; no guessed decisions.
- [ ] **0.7 Build the report generator and redacted share link.**
  - HTML first, PDF second; expiring, redacted evidence pack.
- [ ] **0.8 Produce two more sample dossiers.**
  - Different decision types and repo shapes.
- [ ] **0.9 Publish `/diligence` with the sample dossier.**
  - Headline, buyer, output, price, CTA, sample, limitations.
- [ ] **0.10 Run 20 buyer interviews with the sample in hand.**
  - PE, VC, corp dev, boutique technical DD.
- [ ] **0.11 Secure 2 paid design partners or LOIs; go/no-go.**

**Gate:** 2 paid design partners/LOIs; the sample dossier is accepted as useful; 70%+ precision on confirmed findings; at least one buyer says it could change price, escrow, or go/no-go.
**If fail:** keep the sample as a portfolio artifact; do not build Phase 1.

---

## Phase 1 — Paid delivery and evidence engine (8–12 weeks)

**Objective:** Deliver paid sprints with the artifact, then harden the evidence engine.
**Output:** 2–3 paid reports, repeatable delivery, benchmark draft.

- [ ] **1.1 Run the first paid 10-day diligence sprint.**
- [ ] **1.2 Build the human confirm/edit workflow into the product.**
- [ ] **1.3 Add source snapshots, hashes, and signed evidence-pack export.**
- [ ] **1.4 Add decision-debt and deal-impact scoring.**
- [ ] **1.5 Run the second and third paid sprints.**
- [ ] **1.6 Write the delivery playbook, templates, and QA checklist.**
- [ ] **1.7 Publish a benchmark: 20 repos, 100 decisions, 20 decision debts.**
- [ ] **1.8 Secure 1 auditor/insurer intro; decide Phase 2.**

**Gate:** 2 paid engagements, 1 repeat/referral, 70%+ precision, 10-day turnaround, 1 finding changed a deal term, 1 auditor/insurer intro.
**If fail:** stay a boutique diligence service.

---

## Phase 2 — Recurring assurance (Feb–Jul 2027)

**Objective:** Turn the evidence pack into annual Decision Assurance, with an audit partner and 5 recurring contracts.

- [ ] **2.1 Write Decision Assurance Standard v0.1.**
- [ ] **2.2 Build the assurance portal: evidence room, controls, findings, responses.**
- [ ] **2.3 Add audit export and signed attestation.**
- [ ] **2.4 Add continuous monitoring for decision drift.**
- [ ] **2.5 Add SSO, roles, retention, and audit log.**
- [ ] **2.6 Complete SOC 2 Type I readiness, pen test, and DPA.**
- [ ] **2.7 Recruit 5 boutique audit firms; sign 2 co-selling LOIs.**
- [ ] **2.8 Sell 5 annual assurance contracts.**
- [ ] **2.9 Deliver readiness assessments and board briefings.**
- [ ] **2.10 Secure 1 insurer/broker design partner.**

**Gate:** 5 annual contracts, $250k–$500k ARR, 1 audit co-sell, 1 insurer design partner, SOC 2 Type I, 90% gross retention, 80% evidence automated.

---

## Phase 3 — Insurer partnership and decision bond (Aug 2027–Apr 2028)

**Objective:** Become the evidence/underwriting layer for an insurer/MGA and launch a decision bond pilot.

- [ ] **3.1 Meet 10 insurers/MGAs/brokers; secure a term sheet.**
- [ ] **3.2 Build the underwriting data model and risk/evidence scores.**
- [ ] **3.3 Build the claims/forensics module and insurer portal.**
- [ ] **3.4 Add API for policy administration and claims.**
- [ ] **3.5 Create decision bond contract templates with the partner.**
- [ ] **3.6 Complete insurance regulatory review, E&O, and privacy signoff.**
- [ ] **3.7 Run 2 bond pilots.**
- [ ] **3.8 Collect 100+ decisions with outcomes; validate the loss/risk model.**

**Gate:** 1 signed insurer/MGA, 2 bond pilots, 100+ decisions with outcomes, legal signoff, $1M+ ARR run rate.

---

## Phase 4 — Category platform (May 2028–Dec 2029)

**Objective:** Make decision evidence a standard part of technical M&A, enterprise assurance, and agent workflows.

- [ ] **4.1 Build the decision graph across repositories, docs, and deals.**
- [ ] **4.2 Ship API/MCP for agents and auditors.**
- [ ] **4.3 Launch the decision template/playbook marketplace.**
- [ ] **4.4 Build the multi-tenant enterprise platform with SSO and roles.**
- [ ] **4.5 Add international data residency.**
- [ ] **4.6 Add outcome tracking and publish the benchmark; scale to 50–100 customers.**

**Gate:** $5M ARR, 50–100 customers, 120%+ NRR.

---

## Phase 5 — Risk infrastructure (2030–2031)

**Objective:** Become the default decision evidence layer or a strategic acquisition.

- [ ] **5.1 Expand the decision graph and outcome dataset.**
- [ ] **5.2 Add insurer/MGA integrations at scale.**
- [ ] **5.3 Publish and certify the decision assurance standard.**
- [ ] **5.4 Expand internationally and build enterprise sales.**
- [ ] **5.5 Pursue a strategic acquisition or $20M+ ARR.**

**Gate:** $20M+ ARR or acquisition term sheet.

---

## Task count

| Phase | Tasks |
|---|---:|
| 0 — Artifact and validation | 11 |
| 1 — Paid delivery and evidence | 8 |
| 2 — Recurring assurance | 10 |
| 3 — Insurer/bond | 8 |
| 4 — Category platform | 6 |
| 5 — Risk infrastructure | 5 |
| **Total** | **48** |

---

## First task: 0.1 — Define the Decision Dossier schema

Deliver a 2-page schema document plus one filled example.

### Dossier sections

1. **Cover and deal context** — target, deal stage, scope, date, author, confidentiality.
2. **Executive summary** — the top five deal-impact risks, each with evidence and a recommended diligence question.
3. **Decision inventory** — 10–20 decisions, ranked by deal impact.
4. **Decision records** — context, options considered, decision, owner, date, evidence, status, deal impact.
5. **Contradictions and unsupported claims** — what the evidence does not support.
6. **Open questions and diligence requests** — what the buyer should ask or inspect next.
7. **Evidence appendix** — source path, commit, quote, hash, timestamp.
8. **Method and limitations** — what was analyzed, what was not, and why.
9. **Redaction and sharing rules** — what can leave the data room, and for how long.

### One decision record

- **Title**
- **Context**
- **Options considered**
- **Decision**
- **Owner / approver**
- **Date**
- **Evidence** — code path, commit, doc, quote
- **Status** — verified, disputed, unsupported
- **Deal impact** — price, escrow, integration, reps, or go/no-go
- **Revisit trigger**

### Acceptance

- One decision record is filled from a real public repo.
- A reviewer can read it without the underlying chat.
- The evidence appendix lets a third party verify the claim.

Do not write the landing page, the offer, or the platform before this exists.
