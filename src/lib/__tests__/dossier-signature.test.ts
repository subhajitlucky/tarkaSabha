import { describe, expect, it } from 'vitest'
import {
  DOSSIER_EXPORT_SCHEMA,
  dossierCanonicalPayload,
  signDossierExport,
  signingKeyId,
} from '../dossier-signature'

const dossier = {
  id: 'dos1',
  workspaceId: 'w1',
  workspaceName: 'Project Kestrel',
  version: 1,
  contentHash: 'a'.repeat(64),
  createdAt: '2026-10-22T09:00:00.000Z',
  content: '# Dossier\n\nContent.',
}

describe('dossier signature', () => {
  it('builds a deterministic canonical payload', () => {
    const payload = dossierCanonicalPayload(dossier)

    expect(payload.startsWith(`${DOSSIER_EXPORT_SCHEMA}\ndos1\nw1\n`)).toBe(true)
    expect(payload).toContain('Project Kestrel')
    expect(payload).toContain(dossier.contentHash)
    expect(payload).toContain(dossier.content)
  })

  it('signs with HMAC-SHA256 and identifies the key', () => {
    const signature = signDossierExport(dossier, 'test-signing-key')

    expect(signature.algorithm).toBe('HMAC-SHA256')
    expect(signature.keyId).toBe(signingKeyId('test-signing-key'))
    expect(signature.value).toMatch(/^[a-f0-9]{64}$/)
    expect(signDossierExport(dossier, 'test-signing-key')).toEqual(signature)
  })

  it('produces a different signature for changed content or a different key', () => {
    const base = signDossierExport(dossier, 'test-signing-key')
    const changed = signDossierExport({ ...dossier, content: 'changed' }, 'test-signing-key')
    const otherKey = signDossierExport(dossier, 'other-key')

    expect(changed.value).not.toBe(base.value)
    expect(otherKey.value).not.toBe(base.value)
  })
})
