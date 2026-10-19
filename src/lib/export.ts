import { SYNTHESIS_RUBRIC } from './synthesis-rubric'

/**
 * Builds a portable record of a council run.
 *
 * The point of this file is not to dump a transcript. It is to produce
 * something a person can hand to someone else and have that someone believe it:
 * the brief that was set, the answer that won, the score it earned criterion by
 * criterion, and the candidates that lost. A transcript alone proves nothing.
 *
 * Kept free of I/O so it can be tested directly.
 */

export interface ExportChat {
  title: string
  topic?: string | null
  mode?: string | null
  objective?: string | null
  deliverableSpec?: string | null
  audience?: string | null
  createdAt: string | Date
  participants?: Array<{
    persona?: { name?: string | null; role?: string | null } | null
  }> | null
}

export interface ExportArtifact {
  id: string
  title: string
  content: string
  model?: string | null
  score?: number | null
  breakdown?: Array<{ key: string; label: string; score: number; reason: string }> | null
  selected?: boolean | null
  round?: number | null
  angle?: string | null
  createdAt: string | Date
}

export interface ExportMessage {
  content: string
  role: string
  personaName?: string | null
  createdAt: string | Date
}

export interface ExportInput {
  chat: ExportChat
  artifacts: ExportArtifact[]
  messages: ExportMessage[]
}

const WEIGHTS = new Map(SYNTHESIS_RUBRIC.map((c) => [c.key, c.weight]))

function when(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

/**
 * Table cells cannot contain a pipe or a newline. Judge reasons are free text,
 * so this is the difference between a table and a mess.
 */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\s*\n+\s*/g, ' ').trim()
}

/** A filename-safe slug, capped so it cannot blow past a filesystem limit. */
export function exportFilename(chat: ExportChat, extension = 'md'): string {
  const base = (chat.title || chat.topic || 'council')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `${base || 'council'}.${extension}`
}

function scoreLine(artifact: ExportArtifact): string {
  const parts = [artifact.score == null ? 'not scored' : `${artifact.score.toFixed(1)} / 10`]
  if (artifact.angle) parts.push(`${artifact.angle} angle`)
  if (artifact.round) parts.push(`round ${artifact.round}`)
  return parts.join(' — ')
}

export function buildRunMarkdown({ chat, artifacts, messages }: ExportInput): string {
  const out: string[] = []
  const ranked = [...artifacts].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const winner = ranked.find((a) => a.selected) ?? ranked[0]
  const others = ranked.filter((a) => a !== winner)

  out.push(`# ${chat.title || chat.topic || 'Council'}`)
  out.push('')
  out.push(`_Convened ${when(chat.createdAt)}_`)
  out.push('')

  // ---------------------------------------------------------------- the brief
  out.push('## The brief')
  out.push('')
  const brief: Array<[string, string | null | undefined]> = [
    ['Mode', chat.mode === 'task' ? 'Task — work towards a deliverable' : chat.mode],
    ['Objective', chat.objective],
    ['Deliverable', chat.deliverableSpec],
    ['Audience', chat.audience],
  ]
  const set = brief.filter(([, value]) => value)
  if (set.length === 0) {
    out.push('_No structured brief was set for this council._')
  } else {
    for (const [label, value] of set) out.push(`- **${label}:** ${value}`)
  }
  out.push('')

  const agents = (chat.participants ?? [])
    .map((p) => p.persona)
    .filter((p): p is { name?: string | null; role?: string | null } => Boolean(p))
  if (agents.length > 0) {
    out.push('### Who sat on it')
    out.push('')
    for (const agent of agents) {
      const role = agent.role ? ` — ${agent.role}` : ''
      out.push(`- ${agent.name ?? 'Unnamed agent'}${role}`)
    }
    out.push('')
  }

  // --------------------------------------------------------------- the verdict
  out.push('---')
  out.push('')
  out.push('## The deliverable')
  out.push('')

  if (!winner) {
    out.push(
      '_No deliverable was produced. Run a few turns and synthesise to generate one._'
    )
    out.push('')
  } else {
    out.push(`### ${winner.title}`)
    out.push('')
    if (winner.score != null) {
      out.push(`**Score: ${winner.score.toFixed(1)} / 10**`)
      out.push('')
    } else {
      // Judging either did not run or failed. Say so, rather than leaving a
      // reader to wonder why a deliverable has no score attached.
      out.push('**Not scored** — rubric judging did not complete for this run.')
      out.push('')
    }
    out.push(winner.content)
    out.push('')

    if (winner.breakdown && winner.breakdown.length > 0) {
      out.push('### How it scored')
      out.push('')
      out.push('| Criterion | Weight | Score | Why |')
      out.push('| --- | --- | --- | --- |')
      for (const criterion of winner.breakdown) {
        const weight = WEIGHTS.get(criterion.key)
        out.push(
          `| ${cell(criterion.label)} | ${
            weight != null ? `${Math.round(weight * 100)}%` : '—'
          } | ${criterion.score} | ${cell(criterion.reason)} |`
        )
      }
      out.push('')
      out.push(
        '_The score is the weighted mean, so a candidate cannot win by being decisive while inventing facts._'
      )
      out.push('')
    }

    const provenance = [
      winner.model ? `Model: ${winner.model}` : null,
      winner.angle ? `Angle: ${winner.angle}` : null,
      winner.round ? `Round: ${winner.round}` : null,
    ].filter(Boolean)
    if (provenance.length > 0) {
      out.push(`_${provenance.join(' · ')}_`)
      out.push('')
    }
  }

  // ------------------------------------------------------ what was rejected
  if (others.length > 0) {
    out.push('---')
    out.push('')
    out.push(`## Considered and rejected (${others.length})`)
    out.push('')
    out.push(
      'These were generated in the same run and scored against the same rubric. They are kept so the choice can be inspected rather than taken on trust.'
    )
    out.push('')
    for (const candidate of others) {
      out.push(`### ${candidate.title}`)
      out.push('')
      out.push(`**${scoreLine(candidate)}**`)
      out.push('')
      if (candidate.model) {
        out.push(`_Model: ${candidate.model}_`)
        out.push('')
      }
      // Enough to recognise the alternative without doubling the file size.
      const excerpt = candidate.content.trim()
      out.push(excerpt.length > 600 ? `${excerpt.slice(0, 600).trimEnd()}…` : excerpt)
      out.push('')
    }
  }

  // ------------------------------------------------------------ the reasoning
  if (messages.length > 0) {
    out.push('---')
    out.push('')
    out.push('## The discussion')
    out.push('')
    for (const message of messages) {
      const speaker =
        message.role === 'user' ? 'You' : message.personaName || 'Agent'
      out.push(`**${cell(speaker)}** · ${when(message.createdAt)}`)
      out.push('')
      out.push(message.content)
      out.push('')
    }
  }

  // -------------------------------------------------------------- provenance
  out.push('---')
  out.push('')
  const scored = artifacts.filter((a) => a.score != null)
  const rounds = artifacts.reduce((max, a) => Math.max(max, a.round ?? 1), 1)
  out.push(
    `_${artifacts.length} candidate${artifacts.length === 1 ? '' : 's'} generated` +
      (scored.length > 0 ? `, ${scored.length} scored` : '') +
      (rounds > 1 ? `, across ${rounds} rounds` : '') +
      `. Exported from Tarka Sabha · Brahmodya Protocol on ${when(new Date())}._`
  )
  out.push('')

  return out.join('\n')
}
