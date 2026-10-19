import { describe, expect, it } from 'vitest'

// The module pulls in the rubric only; no Prisma, no SDKs.
import { buildRunMarkdown, exportFilename } from '../export'

const chat = {
  title: 'Buy vs rent in Bengaluru',
  topic: 'Buy vs rent',
  mode: 'task',
  objective: 'Decide whether a first-time buyer should buy or rent',
  deliverableSpec: 'A one-page recommendation',
  audience: 'A first-time buyer',
  createdAt: new Date('2026-10-19T06:00:00Z'),
  participants: [
    { persona: { name: 'Meera Iyer', role: 'researcher' } },
    { persona: { name: 'Ravi Deshpande', role: 'critic' } },
  ],
}

const winner = {
  id: 'a1',
  title: 'Buy if you will stay five years',
  content: 'The break-even is around five years once stamp duty is counted.',
  model: 'gpt-5.4-mini',
  score: 9,
  selected: true,
  round: 1,
  angle: 'risk-aware',
  createdAt: new Date('2026-10-19T06:05:00Z'),
  breakdown: [
    { key: 'grounding', label: 'Grounding', score: 9, reason: 'Every claim traces to the discussion.' },
    { key: 'coverage', label: 'Coverage', score: 8, reason: 'Covers the inconvenient parts.' },
  ],
}

const loser = {
  id: 'a2',
  title: 'Rent and invest the difference',
  content: 'Renting frees capital that historically beats property.',
  model: 'gpt-5.4-mini',
  score: 6,
  selected: false,
  round: 1,
  angle: 'decisive',
  createdAt: new Date('2026-10-19T06:04:00Z'),
  breakdown: null,
}

const messages = [
  {
    content: 'Rental yields in Bengaluru sit near three percent.',
    role: 'persona',
    personaName: 'Meera Iyer',
    createdAt: new Date('2026-10-19T06:01:00Z'),
  },
  {
    content: 'What about stamp duty?',
    role: 'user',
    personaName: null,
    createdAt: new Date('2026-10-19T06:02:00Z'),
  },
]

describe('buildRunMarkdown', () => {
  it('records the brief that was set', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner], messages })
    expect(md).toContain('# Buy vs rent in Bengaluru')
    expect(md).toContain('**Objective:** Decide whether a first-time buyer should buy or rent')
    expect(md).toContain('**Deliverable:** A one-page recommendation')
    expect(md).toContain('**Audience:** A first-time buyer')
    expect(md).toContain('Task — work towards a deliverable')
  })

  it('names the agents and their roles', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner], messages })
    expect(md).toContain('Meera Iyer — researcher')
    expect(md).toContain('Ravi Deshpande — critic')
  })

  it('leads with the winning deliverable and its score', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner, loser], messages })
    expect(md).toContain('**Score: 9.0 / 10**')
    expect(md).toContain('The break-even is around five years')
    // The winner must appear before the rejected section.
    expect(md.indexOf('The break-even')).toBeLessThan(md.indexOf('Considered and rejected'))
  })

  it('builds a rubric table carrying the weights', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner], messages })
    expect(md).toContain('| Criterion | Weight | Score | Why |')
    expect(md).toContain('| Grounding | 25% | 9 | Every claim traces to the discussion. |')
    expect(md).toContain('| Coverage | 25% | 8 | Covers the inconvenient parts. |')
  })

  it('keeps the rejected candidates, with their scores', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner, loser], messages })
    expect(md).toContain('## Considered and rejected (1)')
    expect(md).toContain('### Rent and invest the difference')
    expect(md).toContain('6.0 / 10 — decisive angle — round 1')
  })

  it('never lists the winner among the rejected', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner, loser], messages })
    const rejected = md.slice(md.indexOf('Considered and rejected'))
    expect(rejected).not.toContain('Buy if you will stay five years')
  })

  it('picks the highest scorer when nothing is marked selected', () => {
    const unmarked = { ...loser, selected: false }
    const better = { ...winner, selected: false, score: 9 }
    const md = buildRunMarkdown({ chat, artifacts: [unmarked, better], messages })
    expect(md).toContain('**Score: 9.0 / 10**')
    expect(md).toContain('## Considered and rejected (1)')
  })

  it('says so plainly when the winner could not be scored', () => {
    const unscored = { ...loser, score: null, breakdown: null }
    const md = buildRunMarkdown({ chat, artifacts: [unscored], messages })
    // Silence here would read as an oversight rather than a failed judge call.
    expect(md).toContain('**Not scored**')
    expect(md).toContain('rubric judging did not complete')
  })

  it('reports an unscored rejected candidate too', () => {
    const unscored = { ...loser, score: null, breakdown: null }
    const md = buildRunMarkdown({ chat, artifacts: [winner, unscored], messages })
    expect(md).toContain('not scored — decisive angle — round 1')
  })

  it('handles a run with no deliverable yet', () => {
    const md = buildRunMarkdown({ chat, artifacts: [], messages })
    expect(md).toContain('_No deliverable was produced')
    expect(md).not.toContain('Considered and rejected')
  })

  it('handles a council with no structured brief', () => {
    const bare = { ...chat, mode: null, objective: null, deliverableSpec: null, audience: null }
    const md = buildRunMarkdown({ chat: bare, artifacts: [], messages: [] })
    expect(md).toContain('_No structured brief was set for this council._')
  })

  it('escapes pipes so a judge reason cannot break the table', () => {
    const nasty = {
      ...winner,
      breakdown: [
        { key: 'grounding', label: 'Grounding', score: 9, reason: 'a | b | c' },
      ],
    }
    const md = buildRunMarkdown({ chat, artifacts: [nasty], messages })
    expect(md).toContain('a \\| b \\| c')
    // A row must still have exactly the four cells the header declares.
    const row = md.split('\n').find((l) => l.includes('a \\| b \\| c')) as string
    // Count only unescaped pipes: the escaped ones are content, not delimiters.
    expect((row.match(/(?<!\\)\|/g) ?? []).length - 1).toBe(4)
  })

  it('collapses newlines inside a table cell', () => {
    const nasty = {
      ...winner,
      breakdown: [
        { key: 'grounding', label: 'Grounding', score: 9, reason: 'first\nsecond' },
      ],
    }
    const md = buildRunMarkdown({ chat, artifacts: [nasty], messages })
    expect(md).toContain('| Grounding | 25% | 9 | first second |')
  })

  it('includes the transcript with speakers and times', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner], messages })
    expect(md).toContain('## The discussion')
    expect(md).toContain('**Meera Iyer** · 2026-10-19 06:01 UTC')
    expect(md).toContain('**You** · 2026-10-19 06:02 UTC')
    expect(md).toContain('Rental yields in Bengaluru sit near three percent.')
  })

  it('truncates a rejected candidate rather than doubling the file size', () => {
    const long = { ...loser, content: 'x'.repeat(2000) }
    const md = buildRunMarkdown({ chat, artifacts: [winner, long], messages })
    expect(md).toContain('…')
    expect(md).not.toContain('x'.repeat(1000))
  })

  it('does not truncate the winning deliverable', () => {
    const longWinner = { ...winner, content: 'y'.repeat(2000) }
    const md = buildRunMarkdown({ chat, artifacts: [longWinner], messages })
    expect(md).toContain('y'.repeat(2000))
  })

  it('states the provenance of the run', () => {
    const md = buildRunMarkdown({ chat, artifacts: [winner, loser], messages })
    expect(md).toContain('2 candidates generated, 2 scored')
  })

  it('counts rounds when a retry happened', () => {
    const roundTwo = { ...loser, id: 'a3', round: 2 }
    const md = buildRunMarkdown({ chat, artifacts: [winner, loser, roundTwo], messages })
    expect(md).toContain('across 2 rounds')
  })
})

describe('exportFilename', () => {
  it('slugifies the title', () => {
    expect(exportFilename(chat)).toBe('buy-vs-rent-in-bengaluru.md')
  })

  it('falls back to the topic, then to a generic name', () => {
    expect(exportFilename({ ...chat, title: '' })).toBe('buy-vs-rent.md')
    expect(exportFilename({ ...chat, title: '', topic: null })).toBe('council.md')
  })

  it('strips characters a filesystem would object to', () => {
    const name = exportFilename({ ...chat, title: 'Buy/Rent: 50% "better"?' })
    expect(name).toBe('buy-rent-50-better.md')
  })

  it('caps the length', () => {
    const name = exportFilename({ ...chat, title: 'a'.repeat(300) })
    expect(name.length).toBeLessThanOrEqual(63)
  })
})
