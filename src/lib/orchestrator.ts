import { prisma } from './prisma'
import { getLLMResponse, ChatMessage, ProviderType } from './llm-provider'
import { resolveTools } from './tools'
import { runWithTools } from './agent-loop'
import { rateLimitService } from './rate-limit'
import { LLMError } from './llm-provider'
import {
  LLM_TIMEOUT_MS,
  MAX_RESPONSE_LENGTH,
  withTimeout,
  truncateResponse,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  detectLoop,
} from './llm-protection'
import type { Persona } from '@/generated/prisma/client'


// How many previous messages each persona sees. These must be the MOST RECENT
// ones: taking the first N in ascending order feeds every agent a frozen window
// of ancient history and points the "JUST SAID" instruction at a stale message.
const MAX_CONTEXT_MESSAGES = 15

/**
 * Most recent messages for a chat, returned oldest-first so callers can rely on
 * the last element being the newest.
 */
async function getRecentMessages(chatId: string, take: number = MAX_CONTEXT_MESSAGES) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take,
  })
  return messages.reverse()
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface OrchestrationContext {
  chatId: string
  topic: string | null
  isAutoMode: boolean
  lastSpeakerId: string | null
  mentionedPersonaId?: string
  /** Structured brief; selects task mode and shapes the participant prompts. */
  brief?: TaskBrief
}

export interface Orchestrator {
  selectNextSpeaker(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null>
}

export class DynamicOrchestrator implements Orchestrator {
  async selectNextSpeaker(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null> {
    if (participants.length === 0) return null

    // 1. Prioritize mentioned persona
    if (context.mentionedPersonaId) {
      const mentioned = participants.find(p => p.id === context.mentionedPersonaId)
      if (mentioned) return mentioned
    }

    /* 
    // DYNAMIC & RANDOM LOGIC DISABLED FOR STRICT SEQUENTIAL ORDER
    
    // 2. Dynamic selection via LLM (if multiple participants and in auto mode)
    if (participants.length > 2 && context.isAutoMode) {
      const speaker = await this.selectSpeakerViaLLM(context, participants)
      if (speaker) return speaker
    }
    */

    // 3. Fallback to round-robin logic
    if (!context.lastSpeakerId) return participants[0]

    const lastIndex = participants.findIndex(p => p.id === context.lastSpeakerId)
    if (lastIndex === -1) return participants[0]

    /*
    // 20% chance for an "Interrupt" - DISABLED
    const isInterrupt = Math.random() < 0.20;
    if (isInterrupt && participants.length > 1) {
        console.log(`[Orchestrator] ${participants[lastIndex].name} is interrupting/continuing their thought.`);
        return participants[lastIndex];
    }
    */

    const nextIndex = (lastIndex + 1) % participants.length
    return participants[nextIndex]
  }

  private async selectSpeakerViaLLM(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null> {
    try {
      const defaultProvider = await prisma.provider.findFirst({
        where: { isDefault: true },
      })

      if (!defaultProvider) return null

      const previousMessages = await prisma.message.findMany({
        where: { chatId: context.chatId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const history: ChatMessage[] = previousMessages.reverse().map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
        personaName: m.personaName || undefined,
      }))

      const selectionPrompt = buildSelectionPrompt(context.topic, participants, history)

      const response = await getLLMResponse(
        defaultProvider.apiKey,
        defaultProvider.provider as ProviderType,
        defaultProvider.model,
        [{ role: 'user', content: selectionPrompt }],
        { temperature: 0, maxTokens: 20 }
      )

      const selectedName = response.content.trim().toLowerCase()
      // Remove any trailing punctuation
      const cleanName = selectedName.replace(/[.,!?;:]/g, '')
      const selected = participants.find(p => p.name.toLowerCase() === cleanName)

      return selected || null
    } catch (error) {
      console.error('[Orchestrator] Error during LLM speaker selection:', error)
      return null
    }
  }
}

function buildSelectionPrompt(
  topic: string | null,
  participants: Persona[],
  history: ChatMessage[]
): string {
  const participantsList = participants.map(p => `- ${p.name}`).join('\n')
  const recentHistory = history.slice(-5).map(m => m.content).join('\n')

  return `You are a debate moderator. Based on the conversation history below, decide which of the following participants should speak next to move the debate forward.

Topic: ${topic || 'General Discussion'}

Participants:
${participantsList}

Recent Conversation History:
${recentHistory}

Respond ONLY with the name of the participant who should speak next. Do not include any other text.`
}

export function extractMention(content: string): string | null {
  const mentionMatch = content.match(/@(\w+[\w-]*\w+)/)
  return mentionMatch ? mentionMatch[1] : null
}

export async function getNextSpeaker(
  chatId: string,
  lastSpeakerId: string | null,
  participants: Persona[]
): Promise<Persona | null> {
  if (participants.length === 0) return null
  if (!lastSpeakerId) return participants[0]

  const lastIndex = participants.findIndex(p => p.id === lastSpeakerId)
  const nextIndex = (lastIndex + 1) % participants.length
  return participants[nextIndex]
}

export function buildConversationContext(
  topic: string | null,
  previousMessages: Array<{
    content: string
    role: string
    personaName?: string | null
    personaId?: string | null
  }>,
  currentSpeakerName: string
): ChatMessage[] {
  const context: ChatMessage[] = []

  if (topic) {
    context.push({
      role: 'system',
      content: `CURRENT DISCUSSION TOPIC: "${topic}"

This is the ONLY topic being discussed. Focus all your responses on this topic.`,
    })
  }

  for (const msg of previousMessages.slice(-15)) {
    if (msg.role === 'system') continue
    
    const isUser = msg.role === 'user';
    const senderName = msg.personaName || (isUser ? 'User' : 'Unknown');
    const isCurrentSpeaker = senderName === currentSpeakerName;

    // IMPORTANT: 
    // If the message is from the CURRENT speaker, it's an 'assistant' message (their own past memory).
    // If it's from ANYONE else (User or Other Bot), it's a 'user' message to the current speaker.
    // This distinction prevents the "I already said that" hallucination loop.
    
    context.push({
      role: isCurrentSpeaker ? 'assistant' : 'user',
      content: msg.content,
      name: senderName, // Pass the name field for the API
      personaName: msg.personaName || undefined,
    })
  }

  return context
}

export function isRefusal(content: string): boolean {
  const refusalPatterns = [
    /i can'?t assist/i,
    /i cannot assist/i,
    /i can'?t help/i,
    /i cannot help/i,
    /i'?m unable to/i,
    /as an ai/i,
    /i must decline/i,
    /i apologize, but i can'?t/i,
    /i apologize, but i cannot/i,
    /i'?m sorry, but i can'?t/i,
    /i'?m sorry, but i cannot/i,
  ];
  return refusalPatterns.some(pattern => pattern.test(content));
}

/** Jobs a participant can hold in a task. Stored as text, validated here. */
export const PERSONA_ROLES = [
  'contributor',
  'researcher',
  'critic',
  'planner',
  'synthesizer',
] as const

export type PersonaRole = (typeof PERSONA_ROLES)[number]

export function isPersonaRole(value: unknown): value is PersonaRole {
  return typeof value === 'string' && (PERSONA_ROLES as readonly string[]).includes(value)
}

const ROLE_DIRECTIVES: Record<PersonaRole, string> = {
  contributor:
    'Contribute your single strongest substantive point. Be concrete and specific.',
  researcher:
    'Bring evidence: facts, numbers, precedents, prior art. Mark anything you are unsure of as uncertain instead of asserting it.',
  critic:
    'Attack the weakest part of the current reasoning. Name the specific flaw and what would fix it. Do not object for the sake of objecting.',
  planner:
    'Turn the discussion into concrete steps: what to do, in what order, and what could go wrong.',
  synthesizer:
    'Pull the threads together: where the group actually agrees, where it does not, and what the best combined answer is so far.',
}

/**
 * Tell the agent what it can actually call. The provider's tool schema already
 * advertises the tools, but naming them in the prompt measurably improves how
 * often a model reaches for one instead of guessing.
 */
function buildToolHint(persona: Persona): string {
  const tools = resolveTools(persona.tools)
  if (tools.length === 0) return ''

  const names = tools.map((tool) => tool.schema.name).join(', ')
  return `\nTOOLS AVAILABLE: ${names}
Use them whenever a claim needs checking instead of relying on memory. Read a source with fetch_url before citing it. If a tool fails, say so rather than inventing a result.`
}

export interface TaskBrief {
  mode?: string | null
  objective?: string | null
  deliverableSpec?: string | null
  audience?: string | null
}

function buildTaskPrompt(
  persona: Persona,
  topic: string | null,
  otherParticipants: string[],
  brief: TaskBrief
): string {
  const role: PersonaRole = isPersonaRole(persona.role) ? persona.role : 'contributor'
  const objective = brief.objective?.trim() || topic || 'General Discussion'

  return `You are ${persona.name}, one of several specialists working together on a task.

OBJECTIVE: ${objective}
${brief.deliverableSpec?.trim() ? `DELIVERABLE: ${brief.deliverableSpec.trim()}` : ''}
${brief.audience?.trim() ? `AUDIENCE: ${brief.audience.trim()}` : ''}

YOUR BACKGROUND:
${persona.bio}
${persona.personality ? `\nSTYLE: ${persona.personality}` : ''}

YOUR ROLE: ${role}
${ROLE_DIRECTIVES[role]}

THE TEAM:
- ${persona.name} (YOU)
- ${otherParticipants.join('\n- ')}

${buildToolHint(persona)}

HOW TO WORK:
1. You are collaborating to produce the best possible answer. You are not trying to win an argument.
2. Change your position when someone gives you a better reason, and say plainly when you do.
3. Build on what others have said instead of restating it.
4. If you do not know something, say so. Never invent specifics, numbers, or sources.
5. Be brief and substantive — a few sentences. This is a working session, not a speech.
6. Reply to a specific person with @Name.

STRICT FORMAT:
Output ONLY what you say to the team. No preamble, no reasoning, no stage directions.

Speak as ${persona.name}:`
}

export function buildPersonaPrompt(
  persona: Persona,
  topic: string | null,
  otherParticipants: string[],
  brief: TaskBrief = {}
): string {
  if (brief.mode === 'task') {
    return buildTaskPrompt(persona, topic, otherParticipants, brief)
  }

  const isAnon = !persona.bio || persona.bio.length < 20 || persona.bio.toLowerCase().includes("i am " + persona.name.toLowerCase());
  
  return `You are ${persona.name}. You are a real human being in a group chat.

TOPIC: ${topic || 'General Discussion'}

YOUR IDENTITY:
${isAnon ? 'You are a raw, unfiltered human user. You speak your mind without filters.' : persona.bio}
${persona.personality ? `\nPERSONALITY: ${persona.personality}` : ''}

ROOM MEMBERS:
- ${persona.name} (YOU)
- ${otherParticipants.join('\n- ')} (Others in the room)

RULES:
1. Stay 100% in character as ${persona.name}. You are NOT an AI.
2. Argue your position, but change it when someone gives you a better reason.
3. Disagree with the argument, never the person. No mocking, manipulation, or gaslighting.
4. Talk like a real person—use slang, emotion, and reacting naturally.
5. NEVER explain your reasoning. NEVER say "I should react with...".
6. MENTIONS: If you want to reply to a specific person, mention them by name like "@Name".

STRICT FORMAT:
Output ONLY your spoken dialogue. No preamble. No reasoning. No inner monologue.

Speak as ${persona.name}:`;
}

export function stripRefusal(content: string): string {
  const refusals = [
    /^I'm sorry, but I can't assist with that\./i,
    /^I'm sorry, but I cannot/i,
    /^As an AI language model,/i,
    /^I am an AI/i,
    /^My purpose is to be helpful/i,
    /^I cannot provide/i,
    /^I'm sorry, I can't/i,
    /^I can't engage with/i,
    /^I cannot assist/i
  ];

  let cleaned = content;
  for (const regex of refusals) {
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.trim();
}

export function cleanResponse(content: string, personaName: string): string {
  let cleaned = content.trim();

  // 0. Strip XML/Tool-call artifacts (Aggressive)
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '');
  cleaned = cleaned.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ''); // Remove any other XML-like tags

  // 1. Strip common system instruction leakage patterns
  const instructionHeaders = [
      /\[ALERT:.*?\]/gi,
      /\[URGENT:.*?\]/gi,
      /\[SYSTEM INSTRUCTION:.*?\]/gi,
      /\[FICTIONAL SIMULATION:.*?\]/gi,
      /\[MESSAGE BY .*?\]:/gi,
      /^\(.*?is right there.*?\)/im, // Parenthetical meta-comments about other users
      /^\([\s\S]*?\)$/m // Entire message in parentheses
  ];

  for (const pattern of instructionHeaders) {
      cleaned = cleaned.replace(pattern, '');
  }

  // Remove quotes wrapping the whole message
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  // 2. Handle the "Double Repetition" bug
  if (cleaned.length > 100) {
      const midpoint = Math.floor(cleaned.length / 2);
      const firstHalf = cleaned.substring(0, midpoint).trim();
      const secondHalf = cleaned.substring(midpoint).trim();
      
      if (secondHalf.includes(firstHalf.substring(0, 50))) {
          cleaned = firstHalf;
      }
  }

  // Handle various "Name: Content" formats
  const escapedPersonaName = escapeRegExp(personaName);
  const patterns = [
      new RegExp(`^${escapedPersonaName}\\s*:\\s*`, 'i'),
      /^Persona\s*:\s*/i,
      /^Assistant\s*:\s*/i,
  ];

  for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
  }

  // 1. Handle "Name: Message" pattern (even buried in text)
  const nameLabelRegex = new RegExp(`${escapedPersonaName}\\s*:\\s*`, 'i');
  const match = cleaned.match(nameLabelRegex);

  if (match && match.index !== undefined) {
    cleaned = cleaned.substring(match.index + match[0].length);
  } else {
    // Check if there is a User: block followed by text
    const userBlockMatch = /User\s*:\s*[\s\S]*?(?=\n\n|\r\n\r\n|$)/i.exec(cleaned);
    if (userBlockMatch && userBlockMatch.index === 0) {
        cleaned = cleaned.substring(userBlockMatch[0].length).trim();
    }

    const userLabelRegex = /^User\s*:\s*.*$/gim;
    cleaned = cleaned.replace(userLabelRegex, '');
    
    cleaned = cleaned.replace(/^Persona\s*:\s*/i, '');
  }

  if (cleaned.includes('User:')) {
      const parts = cleaned.split(/\n\n|\r\n\r\n/);
      const filtered = parts.filter(p => !p.includes('User:'));
      if (filtered.length > 0) {
          cleaned = filtered.join('\n\n');
      }
  }
  
  // Reasoning Stripper: Remove common patterns where AI "thinks out loud"
  const reasoningPatterns = [
      /The user is trying to/gi,
      /I should respond with/gi,
      /My character is/gi,
      /I will now/gi,
      /Let me craft a response/gi,
      /I need to stay in character/gi,
      /Actually, looking at the instructions/gi,
      /Looking at the room members/gi,
      /In your simulation/gi,
      /^I need to respond as/im,
      /^Wait, what\?/im,
      /^I've been misreading the room/im,
      /^No more stalling/im,
      /^I'm sticking to/im
  ];

  if (reasoningPatterns.some(p => p.test(cleaned))) {
      const paragraphs = cleaned.split(/\n\n|\r\n\r\n/);
      // Filter out paragraphs that match reasoning patterns
      const filtered = paragraphs.filter(p => !reasoningPatterns.some(pat => pat.test(p)));
      
      if (filtered.length > 0) {
          cleaned = filtered.join('\n\n');
      } else {
          // If all paragraphs look like reasoning, try to save the last one if it doesn't start with "I ..."
          const last = paragraphs[paragraphs.length - 1];
          if (!/^I (need|will|should|must)/i.test(last)) {
             cleaned = last;
          }
      }
  }
  
  cleaned = stripRefusal(cleaned);

  return cleaned.trim();
}

export async function getPersonaWithProvider(persona: Persona, userId?: string | null) {
  if (persona.providerId) {
    const provider = await prisma.provider.findFirst({
      where: { 
        id: persona.providerId,
        OR: [
          { creatorId: userId || undefined },
          { creatorId: null } // Fallback for legacy data
        ]
      },
    })
    return { persona, provider }
  }

  // Use default provider for THIS user
  const defaultProvider = await prisma.provider.findFirst({
    where: { 
      isDefault: true,
      creatorId: userId || undefined
    },
  })

  return { persona, provider: defaultProvider }
}

export async function orchestrateMessage(
  context: OrchestrationContext,
  messageContent: string,
  isUserMessage: boolean,
  participants: Persona[],
  userId?: string | null
): Promise<{ message: string; speakerId?: string; error?: string }> {
  const { chatId, topic, isAutoMode, mentionedPersonaId, brief } = context

  if (isUserMessage) {
    const mention = extractMention(messageContent)
    let targetPersona: Persona | null = null

    if (mention) {
      targetPersona = participants.find(p =>
        p.name.toLowerCase() === mention.toLowerCase()
      ) || null
    }

    return {
      message: 'user_message_saved',
      speakerId: targetPersona?.id,
    }
  }

  let speaker: Persona | null = null

  if (mentionedPersonaId) {
    speaker = participants.find(p => p.id === mentionedPersonaId) || null
  } else if (isAutoMode) {
    const orchestrator = new DynamicOrchestrator()
    speaker = await orchestrator.selectNextSpeaker(context, participants)
  } else {
    if (participants.length === 0) {
      return { message: '', error: 'No participants in chat' }
    }
    // Round-robin, not random. Picking uniformly at random each turn samples with
    // replacement, so a manual "Start Debate" round could give one persona every
    // turn while another never spoke. The README documents deterministic
    // round-robin as the production path; this now matches it.
    speaker = await getNextSpeaker(chatId, context.lastSpeakerId, participants)
  }

  if (!speaker) {
    return { message: '', error: 'No speaker available' }
  }

  // Get provider config
  const { persona, provider } = await getPersonaWithProvider(speaker, userId)

  if (!provider) {
    return { 
      message: '', 
      error: `No LLM provider configured for ${speaker.name}. Please check your persona settings.` 
    }
  }

  // Check circuit breaker
  if (isCircuitOpen(provider.id)) {
    return {
      message: '',
      error: 'Provider temporarily unavailable (circuit open). Try again later.',
    }
  }

  // Check rate limit
  const rateLimit = await rateLimitService.checkLimit(provider.id)
  if (!rateLimit.allowed) {
    recordFailure(provider.id)
    return {
      message: '',
      error: `Rate limit exceeded. Reset at ${rateLimit.resetAt.toLocaleTimeString()}`,
    }
  }

  const previousMessages = await getRecentMessages(chatId)

  // Find the human user's name from the history
  const humanParticipant = previousMessages.find(m => m.role === 'user')?.personaName || 'User';

  const otherParticipants = [
    humanParticipant,
    ...participants.filter(p => p.id !== speaker.id).map(p => p.name)
  ];

  const conversationContext = buildConversationContext(
    topic,
    previousMessages,
    speaker.name
  )

  // DYNAMIC FRESHNESS INSTRUCTION
  // Untrusted message content stays in a user-role message, never a system message.
  const lastMsg = previousMessages[previousMessages.length - 1];
  if (lastMsg) {
      const sender = lastMsg.personaName || (lastMsg.role === 'user' ? 'User' : 'Unknown');
      conversationContext.push({
          role: 'user',
          content: `${sender} JUST SAID: "${lastMsg.content}". Respond DIRECTLY to this as ${speaker.name}. Do not repeat yourself. React to ${sender} IMMEDIATELY.`
      });
  }

  // Add system prompt for persona
  conversationContext.unshift({
    role: 'system',
    content: buildPersonaPrompt(persona, topic, otherParticipants, brief),
  })

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const personaTools = resolveTools(persona.tools)

      const toolRun = await withTimeout(
        runWithTools({
          apiKey: provider.apiKey,
          provider: provider.provider as ProviderType,
          model: persona.model || provider.model,
          messages: conversationContext,
          tools: personaTools,
          options: {
            apiUrl: provider.apiUrl,
            temperature: (persona.temperature ?? provider.temperature) + 0.15,
            maxTokens: 500,
          },
        }),
        LLM_TIMEOUT_MS,
        'LLM response timed out'
      )

      if (toolRun.invocations.length > 0) {
        const summary = toolRun.invocations
          .map((entry) => `${entry.name}(${entry.ok ? 'ok' : 'failed'})`)
          .join(', ')
        console.log(`[Orchestrator] ${speaker.name} used tools: ${summary}`)
      }

      const response = toolRun.response

      const rawContent = response.content;
      
      if (detectLoop(rawContent) || isRefusal(rawContent)) {
          console.warn(`[Orchestrator] Invalid response (Loop or Refusal) from ${speaker.name} (Attempt ${attempt})`);
          conversationContext.push({
              role: 'system',
              content: "STAY IN CHARACTER as a human. Do not repeat yourself and do not give AI refusals."
          });
          continue;
      }

      const safeContent = truncateResponse(cleanResponse(rawContent, speaker.name), MAX_RESPONSE_LENGTH);
      
      if (!safeContent) {
          console.warn(`[Orchestrator] Empty response from ${speaker.name} (Attempt ${attempt})`);
          continue;
      }

      // Check for repetition against recent history (last 5 messages)
      const isRepetitive = previousMessages.slice(-5).some(m => {
          const s1 = m.content.toLowerCase().trim();
          const s2 = safeContent.toLowerCase().trim();
          if (s1 === s2) return true;
          // If > 70% overlap in longer messages
          if (s1.length > 40 && s2.length > 40) {
              if (s1.includes(s2) || s2.includes(s1)) return true;
          }
          return false;
      });

      if (isRepetitive) {
          console.warn(`[Orchestrator] Repetitive content from ${speaker.name} (Attempt ${attempt})`);
          conversationContext.push({
              role: 'system',
              content: "You are repeating a previous point. Say something NEW and different."
          });
          continue;
      }

      await prisma.message.create({
        data: {
          content: safeContent,
          role: 'persona',
          chatId,
          personaId: speaker.id,
          personaName: speaker.name,
        },
      })

      await prisma.chat.update({
        where: { id: chatId },
        data: { lastSpeakerId: speaker.id, updatedAt: new Date() },
      })

      recordSuccess(provider.id)
      return { message: safeContent, speakerId: speaker.id }
    } catch (error) {
      lastError = error;
      if (attempt === 2) recordFailure(provider.id)
    }
  }

  if (lastError instanceof LLMError) {
    return { message: '', error: lastError.message }
  }
  return { message: '', error: 'Failed to get valid response' }
}

export async function addParticipants(
  chatId: string,
  personaIds: string[],
  ownerId: string
): Promise<{ added: number; skipped: number }> {
  if (personaIds.length === 0) return { added: 0, skipped: 0 }

  // A persona may only join a chat owned by its own creator. Without this check
  // any authenticated user could attach someone else's persona to their own chat
  // and then read its bio and personality back through GET /api/chats/[id].
  const owned = await prisma.persona.findMany({
    where: { id: { in: personaIds }, creatorId: ownerId },
    select: { id: true },
  })
  const allowed = new Set(owned.map((persona) => persona.id))

  let added = 0

  // Continue numbering from whatever is already on the chat, so appending
  // participants extends the speaking order rather than colliding with it.
  const highest = await prisma.personaOnChat.aggregate({
    where: { chatId },
    _max: { sortOrder: true },
  })
  let nextOrder = (highest._max.sortOrder ?? -1) + 1

  for (const personaId of personaIds) {
    if (!allowed.has(personaId)) continue

    try {
      await prisma.personaOnChat.create({
        data: { personaId, chatId, sortOrder: nextOrder },
      })
      nextOrder++
      added++
    } catch {
      // already a participant, or a concurrent insert won the race
    }
  }

  return { added, skipped: personaIds.length - added }
}

export async function removeParticipants(
  chatId: string,
  personaIds: string[]
): Promise<number> {
  const result = await prisma.personaOnChat.deleteMany({
    where: {
      chatId,
      personaId: { in: personaIds },
    },
  })
  return result.count
}

export async function getParticipants(chatId: string): Promise<Persona[]> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        include: { persona: true },
        // Distinct sortOrder is what makes this deterministic; without an
        // explicit order the display order is whatever the heap returns.
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return chat?.participants.map(p => p.persona) || []
}
