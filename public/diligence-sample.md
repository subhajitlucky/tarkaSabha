# Sample Decision Dossier — Tarka Sabha

**Artifact type:** Sample self-audit for schema validation, not a real transaction.
**Target:** Tarka Sabha public repository (`github.com/subhajitlucky/tarkaSabha`)
**Snapshot:** `ebee93f5f842ecc3c293ed960a38b850a4f1e04c`
**Date:** 21 October 2026
**Scope:** Security-critical decisions in the provider-credential path.
**Status:** One decision fully analyzed; two candidate decisions listed but not analyzed.
**Confidentiality:** Public sample. No customer data or real credentials are included.

---

## 1. Engagement scope and limitations

### In scope

- `src/lib/crypto.ts`
- `src/app/api/providers/route.ts`
- `src/lib/llm-provider.ts`
- `src/lib/__tests__/crypto.test.ts`
- `prisma/schema.prisma`
- `README.md`
- Relevant Git history

### Out of scope

- Runtime infrastructure
- Production key management
- Database backups and access controls
- Cloud IAM
- Provider-side logging
- Incident history
- Customer interviews

### Limitations

This is a static review of a public repository at one commit. It does not prove runtime behavior, key custody, backup encryption, or production configuration. It is a sample of the artifact, not a full diligence engagement.

---

## 2. Executive summary

### D-001 — Provider API keys are encrypted at rest with AES-256-GCM

**Finding:** Provider API keys are encrypted before storage, masked in API responses, and decrypted only server-side before a provider call.

**Deal impact:** **Medium-High.** A plaintext key store would expose every customer’s provider account and potentially their data. The control is materially better than plaintext, but the master-key lifecycle is not visible in the repository.

**Evidence:** E-01 through E-06.

**Recommended diligence question:**

> Where is `ENCRYPTION_KEY` stored, who can read it, and how would the target rotate it without re-encrypting every provider record?

**Suggested action:** Reps/warranty on key custody and rotation; integration question if the acquirer requires KMS/HSM-backed keys.

**Residual risk:** The application uses a single environment-based master key with no key ID or rotation mechanism. A master-key leak compromises all stored provider keys. Legacy ciphertext remains decryptable with a fixed-salt derived key.

---

## 3. Decision inventory

| ID | Decision | Area | Status | Deal impact | Evidence |
|---|---|---|---|---|---|
| D-001 | Encrypt provider API keys at rest with AES-256-GCM | Security | Verified | Medium-High | E-01–E-06 |
| D-002 | Use deterministic round-robin speaker order | Product/reliability | Candidate, not analyzed | Low-Medium | — |
| D-003 | Run debates through a server-side runner with atomic claims | Reliability | Candidate, not analyzed | Medium | — |

D-002 and D-003 are listed to show the inventory format. They are not analyzed in this sample.

---

## 4. Decision record D-001

### Identity

- **ID:** D-001
- **Title:** Encrypt provider API keys at rest with AES-256-GCM
- **Area:** Security / credential management
- **Status:** Verified
- **Deal impact:** Medium-High
- **Confidence:** High for the implementation; Medium for production key custody

### Context

Tarka lets users bring their own LLM provider credentials. The server stores those keys so it can make provider calls on the user’s behalf. A plaintext store would expose paid provider accounts, usage, and potentially customer content if a key were abused.

The decision addresses:

- credential confidentiality at rest;
- safe display in the UI;
- server-side-only use;
- backward compatibility with earlier ciphertext.

### Options considered

| Option | Why considered | Outcome |
|---|---|---|
| Plaintext storage | Simplest implementation | Rejected: a database leak exposes every key |
| One-way hash | Protects the secret | Rejected: the server must recover the key to call the provider |
| Application-level AES-256-GCM | Reversible, authenticated encryption, no external dependency | **Chosen** |
| KMS/envelope encryption | Stronger key custody and rotation | Not implemented; residual gap |

### Decision

Store provider keys encrypted with **AES-256-GCM**. New ciphertext uses a versioned format:

```text
enc:v2:<salt>:<iv>:<authTag>:<ciphertext>
```

- A random 16-byte salt is generated per encryption.
- A 32-byte key is derived with `scrypt(masterKey, salt)`.
- A random 16-byte IV is generated per encryption.
- The authentication tag is stored with the ciphertext.
- The master key comes from `ENCRYPTION_KEY` and must be at least 32 characters.
- Legacy `iv:authTag:ciphertext` values remain decryptable with a fixed-salt key.
- API responses never return the plaintext key; reads use a placeholder, and writes mask the stored value.

### Owner and date

- **Owner/approver:** Founder/CTO (self-approved in the public repository).
- **Original implementation:** `0ae89cf` (2025-12-28).
- **Key-handling refactor:** `103aa15` (2026-01-04).
- **Security hardening:** `e68477a` (2026-10-11).
- **Snapshot:** `ebee93f` (2026-10-20).

### Evidence

| ID | Source | What it proves |
|---|---|---|
| E-01 | `src/lib/crypto.ts` L31–L36, L60–L78 | AES-256-GCM; random salt and IV; versioned format |
| E-02 | `src/lib/crypto.ts` L84–L108 | Versioned and legacy decryption paths |
| E-03 | `src/app/api/providers/route.ts` L48–L56 | GET excludes `apiKey` and returns a placeholder |
| E-04 | `src/app/api/providers/route.ts` L120–L121, L147–L149 | POST encrypts before storage and masks the response |
| E-05 | `src/lib/llm-provider.ts` L944–L960 | Keys are decrypted only server-side before a provider call |
| E-06 | `src/lib/__tests__/crypto.test.ts` L19–L55 | Round-trip, random ciphertext, legacy support, malformed input, masking |
| E-07 | `README.md` L191–L198 | Public security claim: keys encrypted before storage, masked when displayed |
| E-08 | `prisma/schema.prisma` L72–L88 | `Provider.apiKey` is a string field; the application stores ciphertext there |

### Residual risks and contradictions

1. **Single master key, no key ID or rotation.** `ENCRYPTION_KEY` is one environment value. There is no key version in the ciphertext, no KMS/HSM integration, and no rotation procedure. Rotating the key would require decrypting and re-encrypting every record.
2. **Legacy ciphertext.** The legacy format derives the key with a fixed salt (`"salt"`), which is weaker than the per-record salt in v2. Supporting it is reasonable for migration, but the migration end date is not documented.
3. **Build-time dummy key.** `getEncryptionKey()` returns a fixed placeholder during the Next.js production build if `ENCRYPTION_KEY` is missing. Runtime calls fail closed, but a build can succeed without the production key. This is an operational footgun, not a plaintext leak.
4. **POST response masks ciphertext.** `cryptoService.maskKey(newProvider.apiKey)` is applied to the encrypted value, so the last four characters are ciphertext, not the plaintext key. This is not a leak, but the response semantics are misleading.
5. **Database and backup access.** The control protects against a database dump that contains only ciphertext. It does not protect against an attacker who obtains both the database and the master key. Backup encryption and key custody are outside the repository.

No contradiction with the README claim was found. The claim is supported by the code and tests.

### Open questions

1. Where is `ENCRYPTION_KEY` stored in production, and who can read it?
2. Is there a documented rotation procedure and a migration plan for legacy ciphertext?
3. Are database backups encrypted, and who has access to them?
4. Does the acquirer require KMS/HSM-backed keys or per-tenant keys?
5. Is there an incident history for credential exposure?
6. Are provider keys scoped or restricted at the provider side?

### Revisit triggers

- A key-rotation requirement from a customer or auditor.
- A move to KMS/HSM or per-tenant keys.
- A provider-key incident.
- A new provider that requires a different credential shape.
- A compliance requirement for key custody evidence.

---

## 5. Contradictions and unsupported claims

| Claim | Where | Status | Note |
|---|---|---|---|
| “API keys are encrypted before storage.” | `README.md` L193 | Verified | Code encrypts before `prisma.provider.create` |
| “Masked when displayed.” | `README.md` L193 | Verified | GET returns a placeholder; POST masks the stored value |
| “Provider calls stay server-side.” | `README.md` L194 | Verified | `getLLMResponse` runs server-side; no client provider call found in scope |
| Key rotation is supported. | Not claimed | Unsupported | No key ID or rotation path found |

---

## 6. Open questions and diligence requests

| Priority | Question | Why it matters | Request |
|---|---|---|---|
| High | Where is the master key stored? | A database dump plus the key defeats the control | KMS/config inventory, IAM policy |
| High | Is there a rotation plan? | The ciphertext has no key ID | Runbook, migration plan |
| Medium | Are backups encrypted? | Backups are a common leak path | Backup policy, access list |
| Medium | Is legacy ciphertext still active? | Fixed-salt legacy format is weaker | Migration status, record counts |
| Low | Why does POST mask ciphertext? | Response semantics are confusing | Confirm client expectations |

---

## 7. Evidence appendix

| ID | Source | Commit | Hash | Quote |
|---|---|---|---|---|
| E-01 | `src/lib/crypto.ts` L31–L36, L60–L78 | `ebee93f` | `a569478146f79df6f18dbc53688af8d6dd266fcb73b7f2c7d2292c921ce197b9` | `const ALGORITHM = 'aes-256-gcm'`; `crypto.randomBytes(SALT_LENGTH)`; `crypto.randomBytes(IV_LENGTH)` |
| E-02 | `src/lib/crypto.ts` L84–L108 | `ebee93f` | same file | `if (encryptedText.startsWith(`${ENCRYPTED_V2_PREFIX}:`))` … legacy path |
| E-03 | `src/app/api/providers/route.ts` L48–L56 | `ebee93f` | `f08cce81b2bdacf564177c4c7b8b272a940f555d93fca81f7b7904963280a63a` | `// Explicitly exclude apiKey`; `apiKey: '********'` |
| E-04 | `src/app/api/providers/route.ts` L120–L121, L147–L149 | `ebee93f` | same file | `const encryptedKey = apiKey ? cryptoService.encrypt(apiKey) : ''`; `apiKey: cryptoService.maskKey(newProvider.apiKey)` |
| E-05 | `src/lib/llm-provider.ts` L944–L960 | `ebee93f` | `69d2cc3384323c21dd711bd444a92fc057d1b5d81c6f421a9cc19c88e6903920` | `apiKey: cryptoService.decrypt(apiKey)` |
| E-06 | `src/lib/__tests__/crypto.test.ts` L19–L55 | `ebee93f` | `cc52878cbe31a1e364945e3d4fb500519a7eab8dece0c4b84ee6b69fb86a3272` | round-trip, random ciphertext, legacy, malformed, mask tests |
| E-07 | `README.md` L191–L198 | `ebee93f` | `430f77fe7ec11a6255ca179c5008cb9ea958e219de6a6fbf371fbe099437029e` | `API keys are encrypted before storage and masked when displayed.` |
| E-08 | `prisma/schema.prisma` L72–L88 | `ebee93f` | `23539b2490e254ef89567d9c973d42b96111e75e0eca5a5ab667c21e428b8a5a` | `apiKey String` in `model Provider` |

Evidence hashes are SHA-256 of the file at the snapshot commit. Line numbers are from that snapshot.

---

## 8. Method

- Static review of the public repository at `ebee93f`.
- Read the crypto module, provider route, provider adapter, tests, schema, and README.
- Checked the Git history for the original implementation and later hardening.
- Did not execute the application.
- Did not access production infrastructure, databases, or backups.
- Did not interview the founder.
- Used no customer data.

---

## 9. Redaction and sharing

- This sample uses the public test string `sk-live-super-secret-api-key` from the test suite. It is not a real credential.
- No personal data, customer names, or proprietary code is included.
- A real dossier would remove secrets, PII, and customer identifiers before sharing.
- Share link should expire after 7 days, be watermarked, and log access.

---

## 10. Revision history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-21 | Initial sample for schema validation |
