# Tarka Sabha

Tarka Sabha is a multi-agent AI debate platform. Users create personas, configure model providers, start topic-based conversations, and let autonomous agents respond through an inspectable debate workflow.

The project focuses on orchestration rather than a single chatbot prompt: provider configuration, encrypted credentials, persona state, conversation history, rate limiting, and speaker selection are modeled as separate parts of the system.

- Live: https://tarkasabha.vercel.app
- Portfolio case study: https://subhajitpradhan.vercel.app/projects/tarka-sabha

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

- Node.js 20+
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
npm run lint
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
