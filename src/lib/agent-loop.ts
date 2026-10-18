import { ChatMessage, LLMResponse, ToolCall, getLLMResponse, ProviderType } from './llm-provider'
import { ToolDefinition, toolSchemas } from './tools'

/**
 * Hard ceiling on tool round-trips per turn.
 *
 * A model can keep asking for tools indefinitely, and each round trip costs a
 * provider call. This bound guarantees the turn always terminates.
 */
export const MAX_TOOL_ITERATIONS = 4

/** Tool output is untrusted and can be large; keep it well inside the context. */
export const MAX_TOOL_RESULT_CHARS = 6000

export interface ToolInvocation {
  name: string
  arguments: string
  ok: boolean
  /** Truncated preview, for tracing. */
  preview: string
}

export interface ToolLoopResult {
  response: LLMResponse
  invocations: ToolInvocation[]
  /** True when the loop stopped because it hit MAX_TOOL_ITERATIONS. */
  hitIterationLimit: boolean
}

function preview(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 200 ? `${clean.slice(0, 200)}…` : clean
}

function clipToolResult(text: string): string {
  if (text.length <= MAX_TOOL_RESULT_CHARS) return text
  return `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n\n[... truncated at ${MAX_TOOL_RESULT_CHARS} characters]`
}

/** Parse the model's JSON arguments without ever throwing. */
export function parseToolArguments(raw: string): Record<string, unknown> {
  if (!raw || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * Run a completion, executing any tools the model asks for and feeding the
 * results back until it answers or the iteration bound is reached.
 *
 * Tool results are appended as `tool` role messages. They are never merged into
 * the system prompt: fetched web content is untrusted and must not be able to
 * issue instructions.
 */
export async function runWithTools(params: {
  apiKey: string
  provider: ProviderType
  model: string
  messages: ChatMessage[]
  tools: ToolDefinition[]
  options?: { apiUrl?: string; temperature?: number; maxTokens?: number }
  signal?: AbortSignal
  /** Injectable for tests. */
  complete?: (messages: ChatMessage[]) => Promise<LLMResponse>
}): Promise<ToolLoopResult> {
  const { tools } = params
  const invocations: ToolInvocation[] = []

  const complete =
    params.complete ??
    ((messages: ChatMessage[]) =>
      getLLMResponse(params.apiKey, params.provider, params.model, messages, {
        ...params.options,
        tools: tools.length > 0 ? toolSchemas(tools) : undefined,
      }))

  const conversation: ChatMessage[] = [...params.messages]

  // With no tools this is a single call, identical to the previous behaviour.
  const maxRounds = tools.length > 0 ? MAX_TOOL_ITERATIONS : 1

  let response = await complete(conversation)
  let rounds = 0

  while (response.toolCalls && response.toolCalls.length > 0) {
    if (rounds >= maxRounds) {
      return { response, invocations, hitIterationLimit: true }
    }
    rounds++

    const calls: ToolCall[] = response.toolCalls

    // Record the assistant turn that asked, so the provider can match results.
    conversation.push({
      role: 'assistant',
      content: response.content || '',
      toolCalls: calls,
    })

    for (const call of calls) {
      const tool = tools.find((candidate) => candidate.schema.name === call.name)

      let content: string
      let ok: boolean

      if (!tool) {
        ok = false
        content = `Error: the tool "${call.name}" is not available to you.`
      } else {
        try {
          const result = await tool.run(parseToolArguments(call.arguments), params.signal)
          ok = result.ok
          content = result.content
        } catch (error) {
          ok = false
          content = `Error: ${error instanceof Error ? error.message : 'tool failed'}`
        }
      }

      invocations.push({
        name: call.name,
        arguments: call.arguments,
        ok,
        preview: preview(content),
      })

      conversation.push({
        role: 'tool',
        toolCallId: call.id,
        content: clipToolResult(content),
      })
    }

    response = await complete(conversation)
  }

  return { response, invocations, hitIterationLimit: false }
}
