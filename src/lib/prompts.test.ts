import { buildPersonaPrompt, buildConversationContext } from './orchestrator'
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
    expect(prompt).toContain('Directly address others')
    expect(prompt).toContain('TALK LIKE A HUMAN')
    expect(prompt).toContain('DO NOT prepend your name')
  })
})

describe('Conversation Context', () => {
  it('should prepend persona names to message content', () => {
    const messages = [
      { content: 'Hello', role: 'persona', personaName: 'T-1' },
      { content: 'How are you?', role: 'user', personaName: null }
    ]
    const context = buildConversationContext('Test Topic', messages, 'T-2')
    
    expect(context[1].content).toBe('T-1: Hello')
    expect(context[2].content).toBe('User: How are you?')
  })
})

describe('Anon Mode', () => {
  it('should detect an "anon" persona when bio is empty', () => {
    const anonPersona: any = { name: 'T-1', bio: '', personality: '' }
    const prompt = buildPersonaPrompt(anonPersona, 'Test')
    expect(prompt).toContain('anonymous person')
    expect(prompt).toContain('TALK LIKE A HUMAN')
    expect(prompt).toContain('BE CONCISE')
  })
})
