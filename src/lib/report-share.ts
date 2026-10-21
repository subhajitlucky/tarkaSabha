import { randomBytes } from 'node:crypto'
import { sha256 } from './decision-report'

export const DEFAULT_SHARE_DAYS = 7
export const MIN_SHARE_DAYS = 1
export const MAX_SHARE_DAYS = 30

export function createShareToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: sha256(token) }
}

/**
 * A shared copy keeps the argument and quotes but hides the source coordinates
 * that are most likely to identify a private repository or file.
 */
export function redactReportContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      if (/^- \*\*(Source|Commit|SHA-256|Decision ID):\*\*/.test(line)) {
        return line.replace(/`[^`]*`/, '`[redacted]`')
      }

      if (/^  - Snapshot hash:/.test(line)) {
        return line.replace(/`[^`]*`/, '`[redacted]`')
      }

      return line
    })
    .join('\n')
}
