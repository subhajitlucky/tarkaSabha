# Decision Dossier Schema v0.1

**Purpose:** The customer-facing artifact for a Tarka Decision Diligence Sprint.
**Not:** a chat transcript, a model evaluation, or a generic AI governance report.
**Owner:** Tarka Sabha
**Status:** Draft for the first paid sprint
**Date:** 21 October 2026

---

## 1. Principles

1. **Evidence over assertion.** Every material claim points to a source.
2. **Human confirmation over automation.** The model proposes; a human confirms.
3. **Separate evidence from judgment.** Facts, interpretation, and recommendation are distinct fields.
4. **No guessed decisions.** An inferred decision is labeled inferred until confirmed.
5. **Private by default.** Redaction and expiring links are part of the artifact, not an afterthought.
6. **Reproducible.** A third party can inspect the cited source and reach the same conclusion.
7. **Bounded.** The dossier states what was not analyzed.
8. **Deal-useful.** The executive summary ranks decisions by deal impact, not by technical novelty.

---

## 2. Dossier structure

### 2.1 Cover and metadata

- Target name and repository/data-room identifier
- Deal stage and engagement type
- Scope: repositories, paths, documents, date range
- Snapshot commit or data-room version
- Author and reviewers
- Date
- Confidentiality level
- Distribution list

### 2.2 Engagement scope and limitations

- What was in scope
- What was out of scope
- Access constraints
- Tools used
- Human review performed
- Known blind spots

### 2.3 Executive summary

For each top finding:

- one-line finding
- deal impact: critical / high / medium / low
- evidence link
- recommended diligence question
- suggested action: price, escrow, reps, integration, or no action

The executive summary contains no more than five findings. The appendix can contain more.

### 2.4 Decision inventory

A table of 10–20 decisions:

| ID | Decision | Area | Status | Deal impact | Evidence count |
|---|---|---|---|---|---|
| D-001 | Provider API keys encrypted at rest | Security | Verified | Medium-High | 4 |

Status values:

- **Verified** — source evidence directly supports the decision.
- **Disputed** — evidence conflicts.
- **Unsupported** — a claim exists without evidence.
- **Inferred** — model/human inference, not yet confirmed by an owner.
- **Open** — decision appears unresolved.

### 2.5 Decision records

One record per decision. See section 3.

### 2.6 Contradictions and unsupported claims

- Claim
- Where it appears
- Conflicting evidence
- Status
- Recommended follow-up

### 2.7 Open questions and diligence requests

- Question
- Why it matters
- Who can answer it
- Suggested evidence to request
- Priority

### 2.8 Evidence appendix

For every cited source:

- evidence ID
- source type: code, commit, PR, issue, doc, config, test
- path or URL
- commit or version
- quoted excerpt
- SHA-256 hash of the snapshot
- retrieved timestamp
- confidence
- linked decision IDs

### 2.9 Method

- Static analysis
- Repository history
- Document review
- Human interviews
- Any model assistance
- What was not executed
- What was not accessed

### 2.10 Redaction and sharing rules

- What is removed: secrets, PII, customer names, proprietary code, personal data.
- What is retained: normalized paths, decision text, evidence excerpts that are necessary.
- Link expiry: 7 days by default.
- Watermark: recipient and date.
- Access log: who opened, when.
- Revocation: one click.

### 2.11 Revision history

- Version
- Date
- Author
- Change
- Reason

---

## 3. Decision record fields

### Identity

- **ID** — D-001
- **Title** — one line
- **Area** — security, tenancy, money, data, infrastructure, product
- **Status** — verified / disputed / unsupported / inferred / open
- **Deal impact** — critical / high / medium / low
- **Confidence** — high / medium / low

### Context

- What problem the decision addresses
- Constraints: time, scale, budget, regulation, team
- What would have happened without it

### Options considered

| Option | Why it was considered | Why it was rejected or chosen |
|---|---|---|

At least two options. If only one option is documented, say so and label the record **inferred**.

### Decision

- The chosen option
- The rationale
- The owner/approver
- The date
- The commit, PR, or document
- The scope: files, services, APIs

### Evidence

- Evidence IDs
- Source paths/URLs
- Commit hashes
- Quoted excerpts
- Tests that exercise the behavior
- Runtime or configuration evidence

### Risks and contradictions

- Residual risk
- Contradictory evidence
- Missing evidence
- Operational dependency
- Security or compliance caveat

### Open questions

- What the buyer should ask
- What to inspect next
- Who owns the answer

### Revisit trigger

- Scale threshold
- Regulatory change
- Incident
- Provider change
- Key rotation
- Cost threshold

---

## 4. Evidence standard

A claim is **verified** only when:

1. The source is identifiable.
2. The source is at a specific commit or version.
3. The quoted excerpt supports the claim.
4. A human has checked the excerpt in context.
5. The evidence is linked to the decision record.

If any of these are missing, the claim is **unsupported** or **inferred**, not verified.

### Evidence types

- Code path and line range
- Commit and diff
- Pull request and review
- Test that asserts the behavior
- Configuration
- Architecture decision record
- Document or data-room file
- Interview note

### Evidence integrity

- Hash the source snapshot.
- Timestamp the retrieval.
- Keep the excerpt short and necessary.
- Do not include secrets or personal data.
- Keep the source path normalized.
- Never train on customer data.

---

## 5. Quality checklist

Before delivery:

- [ ] Every executive-summary finding has an evidence ID.
- [ ] Every decision record has at least two options or is labeled inferred.
- [ ] Every verified claim has a commit and quote.
- [ ] Contradictions are explicit.
- [ ] Open questions are actionable.
- [ ] Limitations are stated.
- [ ] Redaction has been reviewed.
- [ ] Share link expires.
- [ ] A second human has read the dossier.
- [ ] The executive summary can be read in five minutes.

---

## 6. Output formats

- **HTML** — primary, readable, redacted.
- **PDF** — for the IC pack.
- **JSON** — evidence appendix and machine-readable decision records.
- **Markdown** — internal draft only.

The HTML/PDF is the customer artifact. The JSON is the audit layer. The chat is never the deliverable.
