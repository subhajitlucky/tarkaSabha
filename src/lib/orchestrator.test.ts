import { Orchestrator, OrchestrationContext, DynamicOrchestrator } from './orchestrator'
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

describe('DynamicOrchestrator', () => {
  let orchestrator: DynamicOrchestrator
  let context: OrchestrationContext
  let participants: Persona[]

  beforeEach(() => {
    orchestrator = new DynamicOrchestrator()
    context = {
      chatId: 'chat1',
      topic: 'Testing AI',
      isAutoMode: true,
      lastSpeakerId: null,
    }
    participants = [mockPersona1, mockPersona2]
  })

  it('should select the first participant if no last speaker is set', async () => {
    const nextSpeaker = await orchestrator.selectNextSpeaker(context, participants)
    expect(nextSpeaker?.id).toBe(mockPersona1.id)
  })

    it('should select the next participant in round-robin if no dynamic selection is performed', async () => {

      context.lastSpeakerId = mockPersona1.id

      const nextSpeaker = await orchestrator.selectNextSpeaker(context, participants)

      expect(nextSpeaker?.id).toBe(mockPersona2.id)

    })

  

    it('should prioritize the mentioned persona if present in the context', async () => {

      context.mentionedPersonaId = mockPersona2.id

      const nextSpeaker = await orchestrator.selectNextSpeaker(context, participants)

      expect(nextSpeaker?.id).toBe(mockPersona2.id)

    })

  

    it('should return null if no participants are provided', async () => {

      const nextSpeaker = await orchestrator.selectNextSpeaker(context, [])

      expect(nextSpeaker).toBeNull()

    })

  })

  