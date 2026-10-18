/**
 * Tool contracts.
 *
 * Every tool result is UNTRUSTED text: it comes from the open web or from model
 * output. Callers must pass it back to the model as a tool-role message and must
 * never promote it into a system message.
 */
export interface ToolSchema {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolResult {
  ok: boolean
  /** Text handed back to the model. */
  content: string
}

export interface ToolDefinition {
  schema: ToolSchema
  /** Human label for the UI. */
  label: string
  /** One-line description for the UI. */
  summary: string
  run(input: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult>
}

export function toolError(message: string): ToolResult {
  return { ok: false, content: `Error: ${message}` }
}

export function toolOk(content: string): ToolResult {
  return { ok: true, content }
}

/** Coerce a tool argument to a trimmed string, or null when absent. */
export function readString(input: Record<string, unknown>, key: string): string | null {
  const value = input[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Coerce a tool argument to a finite number, or null. */
export function readNumber(input: Record<string, unknown>, key: string): number | null {
  const value = input[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}
