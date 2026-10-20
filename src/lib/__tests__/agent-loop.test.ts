import { describe, expect, it, vi } from 'vitest'
import { LLMResponse } from '../llm-provider'
import { MAX_TOOL_ITERATIONS, parseToolArguments, runWithTools } from '../agent-loop'
import { ToolDefinition } from '../tools'

function makeTool(name: string, run: ToolDefinition['run']): ToolDefinition {
  return {
    label: name,
    summary: name,
    schema: {
      name,
      description: name,
      parameters: { type: 'object', properties: {}, required: [] },
    },
    run,
  }
}

const echoTool = makeTool('echo', async (input) => ({
  ok: true,
  content: `echoed:${String(input.value ?? '')}`,
}))

function toolCallResponse(name: string, args: unknown, id = 'call_1'): LLMResponse {
  return {
    content: '',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  }
}

describe('parseToolArguments', () => {
  it('parses an object and never throws on junk', () => {
    expect(parseToolArguments('{"a":1}')).toEqual({ a: 1 })
    expect(parseToolArguments('not json')).toEqual({})
    expect(parseToolArguments('')).toEqual({})
    expect(parseToolArguments('[1,2]')).toEqual({})
    expect(parseToolArguments('null')).toEqual({})
  })
})

describe('runWithTools', () => {
  it('is a single call when no tools are granted', async () => {
    const complete = vi.fn().mockResolvedValue({ content: 'plain answer' })

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [],
      complete,
    })

    expect(complete).toHaveBeenCalledTimes(1)
    expect(result.response.content).toBe('plain answer')
    expect(result.invocations).toEqual([])
    expect(result.hitIterationLimit).toBe(false)
  })

  it('executes a requested tool and feeds the result back', async () => {
    const run = vi.fn().mockResolvedValue({ ok: true, content: 'echoed:42' })
    const tool = makeTool('echo', run)

    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCallResponse('echo', { value: 42 }))
      .mockResolvedValueOnce({ content: 'final answer' })

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [tool],
      complete,
    })

    expect(run).toHaveBeenCalledWith({ value: 42 }, undefined)
    expect(result.response.content).toBe('final answer')
    expect(result.invocations).toHaveLength(1)
    expect(result.invocations[0]).toMatchObject({ name: 'echo', ok: true })

    // The follow-up must carry the assistant's request and the tool result.
    const secondCall = complete.mock.calls[1][0] as Array<{ role: string }>
    expect(secondCall.map((m) => m.role)).toEqual(['user', 'assistant', 'tool'])
  })

  it('sums usage across every provider call in the turn', async () => {
    const tool = makeTool('echo', async () => ({ ok: true, content: 'ok' }))
    const complete = vi
      .fn()
      .mockResolvedValueOnce({
        ...toolCallResponse('echo', {}),
        usage: { promptTokens: 10, completionTokens: 2, totalTokens: 12 },
      })
      .mockResolvedValueOnce({
        content: 'final answer',
        usage: { promptTokens: 20, completionTokens: 5, totalTokens: 25 },
      })

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [tool],
      complete,
    })

    expect(result.usage).toEqual({
      promptTokens: 30,
      completionTokens: 7,
      totalTokens: 37,
    })
  })

  it('reports an unknown tool back to the model instead of throwing', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCallResponse('not_a_tool', {}))
      .mockResolvedValueOnce({ content: 'recovered' })

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [echoTool],
      complete,
    })

    expect(result.invocations[0]).toMatchObject({ name: 'not_a_tool', ok: false })
    expect(result.response.content).toBe('recovered')
  })

  it('survives a tool that throws', async () => {
    const exploding = makeTool('boom', async () => {
      throw new Error('tool exploded')
    })
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCallResponse('boom', {}))
      .mockResolvedValueOnce({ content: 'carried on' })

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [exploding],
      complete,
    })

    expect(result.invocations[0].ok).toBe(false)
    expect(result.response.content).toBe('carried on')
  })

  it('stops at the iteration limit when the model keeps calling tools', async () => {
    // Always asks for another tool: without a bound this would never end.
    const complete = vi.fn().mockResolvedValue(toolCallResponse('echo', { value: 1 }))

    const result = await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [echoTool],
      complete,
    })

    expect(result.hitIterationLimit).toBe(true)
    // One initial call plus one per permitted round.
    expect(complete).toHaveBeenCalledTimes(MAX_TOOL_ITERATIONS + 1)
    expect(result.invocations).toHaveLength(MAX_TOOL_ITERATIONS)
  })

  it('truncates a very large tool result before feeding it back', async () => {
    const big = makeTool('big', async () => ({ ok: true, content: 'x'.repeat(50_000) }))
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCallResponse('big', {}))
      .mockResolvedValueOnce({ content: 'done' })

    await runWithTools({
      apiKey: 'k',
      provider: 'custom',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [big],
      complete,
    })

    const secondCall = complete.mock.calls[1][0] as Array<{ role: string; content: string }>
    const toolMessage = secondCall.find((m) => m.role === 'tool')
    expect(toolMessage).toBeDefined()
    expect((toolMessage as { content: string }).content.length).toBeLessThan(7000)
  })
})
