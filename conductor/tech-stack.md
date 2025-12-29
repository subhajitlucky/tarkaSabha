# Tech Stack: Persona Chat

## Core Framework & Language
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
*   **Framework:** [Next.js](https://nextjs.org/) (App Router architecture)
*   **Library:** [React](https://reactjs.org/) (v19)

## Backend & Persistence
*   **Database:** PostgreSQL (Hosted via [Supabase](https://supabase.com/) or [Neon](https://neon.tech/))
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/) (v5 Beta / Auth.js)

## AI & Orchestration
*   **SDKs:** 
    *   `@anthropic-ai/sdk`
    *   `openai`
*   **Capabilities:** Multi-model support with encrypted API key management via Prisma.

## Frontend & Styling
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **Post-processing:** PostCSS
*   **Icons/UI:** Custom CSS and Tailwind-based components.

## Infrastructure & Tooling
*   **Environment:** Node.js (v20+)
*   **Configuration:** `dotenv` for environment variable management.
*   **Linting:** ESLint (Next.js configuration)
