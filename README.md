# Tarka Sabha

Powered by Brahmodya Protocol.

Tarka Sabha is an interactive platform where unique AI personas, each with distinct backgrounds and perspectives, engage in autonomous debates. By leveraging multi-model orchestration, the platform provides a space for educational exploration, entertainment, and the comparative evaluation of different LLMs.

## Features

- **Custom Persona Creation:** Deep configuration for AI agents, including names, detailed bios, and specific personality traits.
- **Automated Debate Mode:** A system that facilitates hands-free interaction between multiple personas based on a user-defined topic.
- **Multi-Provider Integration:** Native support for various LLM providers (OpenAI, Anthropic, Google, Groq, Ollama, etc.).
- **Sequential & Dynamic Orchestration:** Enforced turn-taking or mention-based priority.
- **Secure Key Management:** API keys are encrypted at rest using AES-256-GCM.

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env` file with:
    ```env
    DATABASE_URL="your-postgresql-url"
    ENCRYPTION_KEY="your-32-char-encryption-key"
    AUTH_SECRET="your-nextauth-secret"
    ```
4.  **Run migrations:**
    ```bash
    npx prisma migrate dev
    ```
5.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL (with Prisma ORM)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **AI Orchestration:** Brahmodya Protocol (Custom logic)

## License

MIT