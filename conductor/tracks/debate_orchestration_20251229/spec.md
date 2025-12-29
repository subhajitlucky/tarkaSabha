# Track Spec: Autonomous Debate Orchestration

## Overview
Implement a dynamic orchestration system that allows AI personas to participate in a debate autonomously. Unlike rigid turn-taking, this system will evaluate the conversation context to determine which persona should speak next, ensuring a more natural and human-like interaction.

## Core Requirements
1.  **Dynamic Speaker Selection:** The orchestrator must analyze the last N messages to decide who among the participants is best suited to respond.
2.  **Context Management:** Maintain the "thread" of the debate, ensuring personas stay on topic while allowing for natural evolution of the discussion.
3.  **Persona Integrity:** Ensure each response adheres to the persona's defined bio, personality, and background.
4.  **Multi-Model Support:** Support different LLM providers (OpenAI, Anthropic) for different personas within the same orchestration loop.

## Technical Design
-   **Orchestrator Module:** A dedicated class or set of functions in `src/lib/orchestrator.ts` (if not already existing/functional) to handle the logic.
-   **Context Window:** Utilize a sliding window of recent messages to provide context to the "selection" prompt.
-   **Selection Prompt:** A lightweight LLM call specifically designed to evaluate "who should speak next" based on the participant list and conversation history.
-   **Integration:** Hook into the existing `/api/chat/send` and `/api/chat/[id]/messages` routes to support autonomous loops.

## Success Criteria
-   The orchestrator can successfully pick a speaker from a list of 2+ participants.
-   Personas respond in a way that directly addresses previous points while maintaining their own unique perspective.
-   The debate can run for at least 10 rounds without losing topic coherence or breaking the persona identity.
