import { ToolDefinition, ToolSchema } from './types'
import { calculatorTool } from './calculator'
import { fetchUrlTool } from './fetch-url'
import { webSearchTool } from './web-search'

export * from './types'
export { calculatorTool, evaluateExpression } from './calculator'
export { fetchUrlTool, checkUrl, isBlockedAddress, htmlToText } from './fetch-url'
export { webSearchTool, searchBackend } from './web-search'

/** Every tool an agent may be granted. Order is the order shown in the UI. */
export const TOOL_REGISTRY: ToolDefinition[] = [webSearchTool, fetchUrlTool, calculatorTool]

const BY_NAME = new Map(TOOL_REGISTRY.map((tool) => [tool.schema.name, tool]))

export const TOOL_NAMES = TOOL_REGISTRY.map((tool) => tool.schema.name)

export function isToolName(value: unknown): value is string {
  return typeof value === 'string' && BY_NAME.has(value)
}

/** Narrow a stored allowlist to tools that actually exist. */
export function resolveTools(names: readonly string[] | null | undefined): ToolDefinition[] {
  if (!names || names.length === 0) return []
  const seen = new Set<string>()
  const resolved: ToolDefinition[] = []
  for (const name of names) {
    if (seen.has(name)) continue
    const tool = BY_NAME.get(name)
    if (tool) {
      seen.add(name)
      resolved.push(tool)
    }
  }
  return resolved
}

export function toolSchemas(tools: ToolDefinition[]): ToolSchema[] {
  return tools.map((tool) => tool.schema)
}
