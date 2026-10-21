export interface ReportListItem {
  text: string
  children: string[]
}

export type ReportBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: ReportListItem[] }
  | { type: 'quote'; lines: string[] }

/**
 * A deliberately small Markdown parser for the report format we generate.
 * It never emits HTML; the caller renders text nodes through React.
 */
export function parseReportMarkdown(content: string): ReportBlock[] {
  const blocks: ReportBlock[] = []
  let paragraph: string[] = []
  let list: ReportListItem[] | null = null
  let quote: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }

  const flushList = () => {
    if (!list) return
    blocks.push({ type: 'list', items: list })
    list = null
  }

  const flushQuote = () => {
    if (quote.length === 0) return
    blocks.push({ type: 'quote', lines: quote })
    quote = []
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trimEnd()

    if (line.trim() === '') {
      flushAll()
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      })
      continue
    }

    if (line.startsWith('- ')) {
      flushParagraph()
      flushQuote()
      list ??= []
      list.push({ text: line.slice(2).trim(), children: [] })
      continue
    }

    if (line.startsWith('  - ') && list && list.length > 0) {
      list[list.length - 1].children.push(line.slice(4).trim())
      continue
    }

    if (line.startsWith('>')) {
      flushParagraph()
      flushList()
      quote.push(line.replace(/^>\s?/, ''))
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()
  return blocks
}
