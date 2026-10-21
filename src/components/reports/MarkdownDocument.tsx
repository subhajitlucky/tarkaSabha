import { Fragment, ReactNode } from 'react'
import { parseReportMarkdown } from '@/lib/report-markdown'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  if (text.startsWith('_') && text.endsWith('_') && text.length > 2) {
    return [<em key={`${keyPrefix}-em`}>{text.slice(1, -1)}</em>]
  }

  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded-[2px] border border-line bg-surface-2 px-1 py-0.5 font-mono text-[0.82em] text-accent"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return <Fragment key={key}>{part}</Fragment>
  })
}

/** Renders generated report content as a safe, styled document. */
export function MarkdownDocument({ content }: { content: string }) {
  const blocks = parseReportMarkdown(content)

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const key = `block-${index}`

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h1 key={key} className="font-display text-3xl leading-tight text-text">
                {renderInline(block.text, key)}
              </h1>
            )
          }
          if (block.level === 2) {
            return (
              <h2
                key={key}
                className="border-b border-line pb-2 pt-4 font-display text-xl text-text"
              >
                {renderInline(block.text, key)}
              </h2>
            )
          }
          return (
            <h3 key={key} className="pt-2 font-display text-base text-text">
              {renderInline(block.text, key)}
            </h3>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={key} className="space-y-2 text-sm leading-relaxed text-muted">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="pl-4">
                  <span className="mr-2 text-accent">·</span>
                  {renderInline(item.text, `${key}-${itemIndex}`)}
                  {item.children.length > 0 && (
                    <ul className="mt-1.5 space-y-1 pl-4">
                      {item.children.map((child, childIndex) => (
                        <li key={`${key}-${itemIndex}-${childIndex}`} className="text-xs">
                          {renderInline(child, `${key}-${itemIndex}-${childIndex}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={key}
              className="border-l-2 border-accent-line bg-surface-2/50 py-2 pl-4 text-sm leading-relaxed text-muted"
            >
              {block.lines.map((line, lineIndex) => (
                <p key={`${key}-${lineIndex}`}>{renderInline(line, `${key}-${lineIndex}`)}</p>
              ))}
            </blockquote>
          )
        }

        return (
          <p key={key} className="text-sm leading-relaxed text-muted">
            {renderInline(block.text, key)}
          </p>
        )
      })}
    </div>
  )
}
