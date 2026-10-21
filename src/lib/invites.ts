import { randomBytes } from 'node:crypto'
import { sha256 } from './decision-report'

export const DEFAULT_INVITE_DAYS = 7
export const MIN_INVITE_DAYS = 1
export const MAX_INVITE_DAYS = 30

export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: sha256(token) }
}
