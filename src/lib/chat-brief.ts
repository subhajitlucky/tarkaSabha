/**
 * The structured brief for a chat.
 *
 * "debate" is the original adversarial-roleplay experience. "task" asks the
 * participants to cooperate on an objective and produce a deliverable, which is
 * what the synthesis step consumes.
 */
export const CHAT_MODES = ['debate', 'task'] as const

export type ChatMode = (typeof CHAT_MODES)[number]

export const MAX_BRIEF_FIELD_LENGTH = 2000

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && (CHAT_MODES as readonly string[]).includes(value)
}

export interface BriefValidation {
  ok: boolean
  error?: string
}

/** Validate the free-text brief fields, which are all optional strings. */
export function validateBriefFields(fields: Record<string, unknown>): BriefValidation {
  for (const [label, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue

    if (typeof value !== 'string') {
      return { ok: false, error: `${label} must be a string` }
    }
    if (value.length > MAX_BRIEF_FIELD_LENGTH) {
      return {
        ok: false,
        error: `${label} must be at most ${MAX_BRIEF_FIELD_LENGTH} characters`,
      }
    }
  }

  return { ok: true }
}
