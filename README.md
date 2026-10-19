# Tarka Sabha

Tarka Sabha is a multi-agent AI debate platform. Users create personas, configure model providers, start topic-based conversations, and let autonomous agents respond through an inspectable debate workflow.

The project focuses on orchestration rather than a single chatbot prompt: provider configuration, encrypted credentials, persona state, conversation history, rate limiting, and speaker selection are modeled as separate parts of the system.

- Live: https://tarkasabha.vercel.app
- Portfolio case study: https://subhajitpradhan.vercel.app/projects/tarka-sabha
- Status: Live platform

## Product Problem

Most AI chat demos are single-user, single-model conversations. Tarka Sabha explores a harder workflow: multiple named agents with different personas need to debate the same topic while the application tracks who speaks, what context each agent receives, and which provider/model should generate each response.

## Core Features

- Custom persona creation with name, bio, personality, provider, model, and temperature.
- Topic-based debate sessions with multiple persona participants.
- Sequential speaker orchestration with mention-aware priority.
- Multi-provider LLM adapter layer for OpenAI, Anthropic, Google-compatible, Groq, Ollama, DeepSeek, Mistral, Together, OpenRouter, Perplexity, Hugging Face, and custom endpoints.
- Encrypted API key storage using AES-256-GCM.
- Provider-specific validation and clearer error handling.
- Conversation history shaping so each persona receives recent context with speaker names.
- Rate limit persistence through the database.
- Auth-backed user, provider, persona, chat, message, and feedback models.

## Architecture

```text
Next.js App Router
  Pages for dashboard, debate, history, login, feedback, and about

Auth layer
  NextAuth, Prisma adapter, user sessions

Provider layer
  Provider records store encrypted API keys, model names, API URLs, and temperature

LLM adapter
  Normalizes provider-specific SDK/API calls behind a shared chat interface

Orchestrator
  Selects the next speaker, handles mentions, and builds persona-aware context

Persistence
  PostgreSQL + Prisma models for users, providers, personas, chats, messages, and rate limits

Protection layer
  Timeouts, response length limits, content sanitization, loop detection, and circuit state
```

## Data Model

Key Prisma models:

- `User`: owns sessions, chats, providers, personas, and feedback.
- `Provider`: stores provider type, API URL, encrypted API key, model, and temperature.
- `Persona`: stores debate identity and optional provider/model overrides.
- `Chat`: stores title, topic, auto-mode state, last speaker, and participants.
- `Message`: stores role, content, persona identity, chat, and timestamps.
- `RateLimit`: persists request counters and reset windows.

## Debate Flow

```text
User starts a topic
  -> selects persona participants
  -> app reads recent messages
  -> orchestrator chooses next speaker
  -> provider adapter builds the LLM request
  -> response is sanitized, truncated if needed, and stored
  -> chat state updates lastSpeakerId
```

The current production path favors deterministic round-robin speaker selection. Mention detection can prioritize a named persona, while the LLM-based dynamic speaker selector remains isolated as an optional orchestration path.

## Server-Side Debate Runner

Turns are executed by the server, not by the browser. Starting a debate sets
`autoAdvanceAt` on the chat; a runner then claims chats that are due and advances
one turn each. **A debate therefore keeps going after the tab is closed.**

One endpoint drives it, and you choose the trigger:

| Trigger | Notes |
|---|---|
| GitHub Actions schedule | **What this repo uses.** Five-minute floor, free on public repos. |
| `npm run worker` | Self-hosted, a container, or local development. Ticks every few seconds. |
| Vercel Cron | **Pro plans only** — see below. |
| Any external scheduler | GitHub Actions on a schedule, cron-job.org, etc. |

All of them authenticate with `Authorization: Bearer $CRON_SECRET`. The endpoint
fails closed if `CRON_SECRET` is unset.

**GitHub Actions (what this repo uses).** `.github/workflows/runner.yml` calls
the endpoint every five minutes, which is GitHub's scheduling floor. It needs one
repository secret, `CRON_SECRET`, matching the Vercel environment variable of the
same name:

```bash
gh secret set CRON_SECRET --repo <owner>/<repo>
```

Two behaviours of the GitHub scheduler are worth knowing: runs can be delayed by
several minutes under load, and GitHub disables a schedule after 60 days without
repository activity. Any push re-enables it, and the workflow can be run on demand
from the Actions tab. Because a trigger may be late, the endpoint advances several
turns per call rather than one.

**Vercel Cron and plan limits.** Vercel's Hobby plan only permits *daily* cron
schedules; a per-minute expression is rejected at deploy time and the whole
deployment fails. That is why this repo deliberately ships no `vercel.json`
crons block. On Pro, add:

```json
{
  "crons": [{ "path": "/api/debates/tick?turns=5", "schedule": "*/5 * * * *" }]
}
```

On Hobby, either run the worker somewhere, or point an external scheduler at the
same URL. Note that `/api/debates/tick` defaults to 5 turns per chat per call, so
a slower trigger still makes progress.

Claiming is atomic — the claim statement pushes `autoAdvanceAt` forward with
`FOR UPDATE SKIP LOCKED` — so overlapping ticks divide the work instead of
advancing the same chat twice.

Two modes:

- **Auto** (`isAutoMode: true`, no turn budget) runs until stopped or a turn fails.
- **Bounded** (`turns: N`) runs N turns and then clears `isAutoMode` automatically.

Manual mode stays user-driven: `POST /api/chats/[id]/advance` runs exactly one
turn on demand.

Note that Vercel's Hobby plan only allows daily cron schedules. For frequent
ticks on Hobby, run the worker yourself; Pro allows per-minute schedules.

## Agent Tools

Participants can be granted tools so they check facts instead of recalling them.
Tools are per-persona allowlists (`Persona.tools`); a participant with none is
offered none.

| Tool | What it does |
|---|---|
| `web_search` | Finds sources. Uses Tavily (`TAVILY_API_KEY`) or Brave (`BRAVE_API_KEY`) when keyed, otherwise a keyless best-effort fallback. |
| `fetch_url` | Reads a public page and returns its text. |
| `calculator` | Exact arithmetic via a hand-written parser — no `eval`, no `new Function`. |

The loop is bounded at 4 tool round-trips per turn, so a model that keeps asking
for tools still terminates. Tool results are appended as `tool`-role messages and
are never merged into the system prompt: fetched web content is untrusted and
must not be able to issue instructions.

`fetch_url` is stricter than the provider URL validator on purpose. That one
permits loopback so a provider can point at a local Ollama; a fetch tool must
not, or an agent becomes an internal-network probe. It refuses loopback, private
ranges, link-local (including cloud metadata), CGNAT, multicast, IPv4-mapped
IPv6, credential-bearing URLs and non-http schemes, re-checks every redirect
hop, and caps response size, time and redirect count.

## Choosing the Best Answer

A synthesis run does not just generate a deliverable; it generates several and
picks one.

1. **Candidates.** Three drafts are produced in parallel from deliberately
   different angles (decisive, risk-aware, actionable) at different
   temperatures. Sampling one prompt repeatedly mostly yields paraphrases, which
   makes comparison meaningless.
2. **Rubric.** Each candidate is graded 1-10 on grounding, coverage,
   decisiveness, honesty and fit, with a stated weight per criterion. The score
   is the weighted mean, so a candidate cannot win by being decisive while
   inventing facts.
3. **Selection.** The highest score wins, ties break on the lower index so the
   result is deterministic. Every candidate is stored with its score, breakdown
   and angle, so a run is auditable rather than a black box.
4. **Retry.** With `rounds: 2`, a best score below 7 triggers one more round
   that is fed the judge's specific criticism. It is skipped if the time budget
   is exhausted.

A run costs 2N provider calls (N drafts, N judgements). `POST
/api/chats/[id]/artifacts` accepts `candidates` (1-4) and `rounds` (1-2); the UI
exposes the default and a "Thorough" two-round option. Judge output is parsed
defensively — malformed JSON leaves candidates unscored rather than failing the
run.

## Security & Reliability Notes

- API keys are encrypted before storage and masked when displayed.
- Provider calls stay server-side.
- Provider-specific API errors are mapped to clearer application errors.
- Message length validation and response truncation reduce runaway outputs.
- Loop detection and circuit state help protect repeated failing flows.
- Rate-limit records are stored in the database instead of only in memory.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL
- Prisma
- NextAuth
- OpenAI SDK
- Anthropic SDK
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 22+ (required by the OpenAI v7 SDK)
- PostgreSQL database
- At least one supported LLM provider API key

### Install

```bash
npm install
```

### Environment

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tarka_sabha"
ENCRYPTION_KEY="use_at_least_32_characters_here"
AUTH_SECRET="generate_a_strong_auth_secret"
NEXTAUTH_URL="http://localhost:3000"
# Shared secret for the debate runner. Vercel Cron sends it automatically.
CRON_SECRET="generate_a_strong_random_secret"
```

Generate a strong encryption key:

```bash
openssl rand -base64 32
```

### Database

```bash
npx prisma generate
npx prisma migrate dev
```

### Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run worker    # self-hosted debate runner; needs CRON_SECRET
npm run lint
npm run typecheck
npm test
```

## Tradeoffs

- Supporting many providers improves flexibility, but each provider has different API formats and failure modes.
- Sequential orchestration is easier to reason about than fully dynamic speaker selection, especially when debugging multi-agent loops.
- Encrypted user-provided keys are useful for prototyping, but production deployments should pair this with strict access controls, audit logs, and secret rotation.
- Multi-agent output quality depends heavily on persona design, topic framing, and context window management.

## Roadmap

- Add tests around provider adapters and orchestration behavior.
- Add a visible debate timeline showing speaker decisions and provider calls.
- Add exportable debate transcripts.
- Add per-chat cost and token usage reporting.
- Add stronger provider health checks before a debate starts.

## License

MIT
