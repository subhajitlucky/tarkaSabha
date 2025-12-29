import { Orchestrator, OrchestrationContext } from './orchestrator'
import type { Persona } from '@prisma/client'

// Mock Persona
const mockPersona1: Persona = {
  id: 'p1',
  name: 'Persona 1',
  bio: 'Bio 1',
  personality: 'Personality 1',
  providerId: 'prov1',
  model: 'gpt-4',
  temperature: 0.7,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPersona2: Persona = {
  id: 'p2',
  name: 'Persona 2',
  bio: 'Bio 2',
  personality: 'Personality 2',
  providerId: 'prov1',
  model: 'gpt-4',
  temperature: 0.7,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Orchestrator Interface', () => {
  // This test serves as a "type check" to ensure the interface is defined correctly
  // It won't pass until we actually define the interface in the implementation file
  it('should allow defining an Orchestrator with a selectNextSpeaker method', () => {
    const mockOrchestrator: Orchestrator = {
      selectNextSpeaker: async (
        context: OrchestrationContext,
        participants: Persona[]
      ): Promise<Persona | null> => {
        return participants[0]
      },
    }

    expect(mockOrchestrator).toBeDefined()
    expect(typeof mockOrchestrator.selectNextSpeaker).toBe('function')
  })
})
