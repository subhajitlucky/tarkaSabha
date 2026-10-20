import { describe, expect, it } from 'vitest'
import { buildSingleModelPrompt } from '../head-to-head'

describe('buildSingleModelPrompt', () => {
  it('gives the baseline the brief without a transcript', () => {
    const prompt = buildSingleModelPrompt({
      objective: 'Choose a queue for the ingest pipeline.',
      deliverableSpec: 'A one-page decision memo.',
      audience: 'The platform team.',
    })

    expect(prompt).toContain('Choose a queue for the ingest pipeline.')
    expect(prompt).toContain('A one-page decision memo.')
    expect(prompt).toContain('The platform team.')
    expect(prompt).toContain('You do not have a council')
    expect(prompt).not.toContain('DISCUSSION TRANSCRIPT')
  })

  it('omits empty optional fields instead of leaving broken labels', () => {
    const prompt = buildSingleModelPrompt({ objective: 'Pick a database.' })

    expect(prompt).toContain('OBJECTIVE: Pick a database.')
    expect(prompt).not.toContain('DELIVERABLE:')
    expect(prompt).not.toContain('AUDIENCE:')
  })
})
