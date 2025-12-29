# Track Plan: Autonomous Debate Orchestration

This plan outlines the steps to implement dynamic, autonomous debate orchestration between AI personas.

---

## Phase 1: Foundation & Analysis [checkpoint: be5878d]
- [x] Task: Analyze existing `src/lib/orchestrator.ts` and `src/lib/llm.ts` to identify gaps in autonomous logic
- [x] Task: Define the `Orchestrator` interface for dynamic speaker selection e9bebcf
- [x] Task: Conductor - User Manual Verification 'Foundation & Analysis' (Protocol in workflow.md) be5878d

## Phase 2: Dynamic Speaker Selection [checkpoint: 76c4d0e]
- [x] Task: Implement the `selectNextSpeaker` logic in `src/lib/orchestrator.ts` 2c1107c
- [x] Task: Write unit tests for `selectNextSpeaker` with various conversation contexts e082cf8
- [x] Task: Implement a lightweight selection prompt to assist the orchestrator 82ae254
- [x] Task: Conductor - User Manual Verification 'Dynamic Speaker Selection' (Protocol in workflow.md) 76c4d0e

## Phase 3: Contextual Interaction & Persona Integrity
- [x] Task: Refine persona system prompts to better handle "autonomous" context (knowing they are in a debate) 6301914
- [ ] Task: Implement state management for "debate intent" to keep personas on topic
- [ ] Task: Write unit tests for refined prompt generation
- [ ] Task: Conductor - User Manual Verification 'Contextual Interaction & Persona Integrity' (Protocol in workflow.md)

## Phase 4: Integration & End-to-End Testing
- [ ] Task: Connect the autonomous orchestrator to the `/api/chat/send` and `/api/chat/history` routes
- [ ] Task: Update the frontend to handle "Autonomous Mode" triggers and real-time updates (auto-polling/SWR)
- [ ] Task: Implement "Typing..." indicator for active personas in the chat UI
- [ ] Task: Improve Chat UI aesthetics (remove blandness, better spacing/colors)
- [ ] Task: Update User UI to display "Username" instead of email if available
- [ ] Task: Perform end-to-end testing of a full debate (10+ messages)
- [ ] Task: Conductor - User Manual Verification 'Integration & End-to-End Testing' (Protocol in workflow.md)
