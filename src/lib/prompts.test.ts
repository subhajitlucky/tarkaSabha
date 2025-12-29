import { buildPersonaPrompt } from './orchestrator'
import type { Persona } from '@prisma/client'

const mockPersona: Persona = {
  id: 'p1',
  name: 'Socrates',
  bio: 'Classical Greek philosopher.',
  personality: 'Inquisitive, questioning.',
  providerId: 'prov1',
  model: 'gpt-4',
  temperature: 0.7,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Prompt Generation', () => {
  it('should include the persona name and bio', () => {
    const prompt = buildPersonaPrompt(mockPersona, 'Ethics')
    expect(prompt).toContain('You are Socrates')
    expect(prompt).toContain('Classical Greek philosopher')
  })

  it('should include the topic', () => {
    const prompt = buildPersonaPrompt(mockPersona, 'The nature of reality')
    expect(prompt).toContain('The nature of reality')
  })

  it('should include debate-specific instructions', () => {
    const prompt = buildPersonaPrompt(mockPersona, 'Ethics')
    // We want to ensure it encourages interaction and debate
    expect(prompt).toContain('DIRECTLY ADDRESS previous speakers')
    expect(prompt).toContain('Build upon or challenge')
  })
})
