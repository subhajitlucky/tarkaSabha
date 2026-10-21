import { describe, expect, it } from 'vitest'
import { parseReportMarkdown } from '../report-markdown'

const content = [
  '# Decision Evidence Report — Kestrel',
  '',
  '## Evidence',
  '',
  '### 1. CODE — VERIFIED (HIGH confidence)',
  '',
  '#### Evidence detail',
  '',
  '- **Source:** `src/lib/workspaces.ts`',
  '- **Commit:** `abc123`',
  '',
  '> Membership is the authorization boundary.',
  '',
  '## Approvals',
  '',
  '- **APPROVED** by Asha Rao (OWNER) on 2026-10-03T11:00:00.000Z',
  '  - Note: Looks sound.',
].join('\n')

describe('parseReportMarkdown', () => {
  it('parses the report headings, lists, and quotes', () => {
    const blocks = parseReportMarkdown(content)

    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 1,
      text: 'Decision Evidence Report — Kestrel',
    })
    expect(blocks.some((block) => block.type === 'heading' && block.level === 3)).toBe(true)
    expect(blocks).toContainEqual({
      type: 'heading',
      level: 4,
      text: 'Evidence detail',
    })
    expect(blocks).toContainEqual({
      type: 'quote',
      lines: ['Membership is the authorization boundary.'],
    })

    const approvalList = blocks.find(
      (block) => block.type === 'list' && block.items.some((item) => item.text.includes('APPROVED'))
    )
    expect(approvalList).toBeDefined()
    if (approvalList?.type === 'list') {
      expect(approvalList.items).toHaveLength(1)
      expect(approvalList.items[0].children).toEqual(['Note: Looks sound.'])
    }
  })

  it('does not interpret raw HTML as markup', () => {
    const blocks = parseReportMarkdown('<script>alert(1)</script>')
    expect(blocks).toEqual([{ type: 'paragraph', text: '<script>alert(1)</script>' }])
  })
})
