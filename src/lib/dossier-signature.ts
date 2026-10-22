import { createHmac } from 'node:crypto'
import { sha256 } from './decision-report'

export const DOSSIER_EXPORT_SCHEMA = 'tarka-dossier-export/v1'

export interface SignableDossier {
  id: string
  workspaceId: string
  workspaceName: string
  version: number
  contentHash: string
  createdAt: string
  content: string
}

export interface DossierSignature {
  algorithm: 'HMAC-SHA256'
  keyId: string
  value: string
}

export function signingKeyId(key: string): string {
  return sha256(key).slice(0, 12)
}

export function dossierCanonicalPayload(dossier: SignableDossier): string {
  return [
    DOSSIER_EXPORT_SCHEMA,
    dossier.id,
    dossier.workspaceId,
    dossier.workspaceName,
    String(dossier.version),
    dossier.contentHash,
    dossier.createdAt,
    dossier.content,
  ].join('\n')
}

export function signDossierExport(
  dossier: SignableDossier,
  key: string
): DossierSignature {
  const value = createHmac('sha256', key)
    .update(dossierCanonicalPayload(dossier), 'utf8')
    .digest('hex')

  return {
    algorithm: 'HMAC-SHA256',
    keyId: signingKeyId(key),
    value,
  }
}
