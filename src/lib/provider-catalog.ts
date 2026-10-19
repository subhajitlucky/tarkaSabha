import type { PersonaRole, ProviderType } from '@/types'

/**
 * The provider catalogue, shared by the debate wizard and the settings pages.
 * One copy means a new provider, a corrected model id or a reworded role hint
 * cannot land in one place and be forgotten in the other.
 */

/** Debates make many calls per run, so the default trades quality for cost. */
export const DEFAULT_MODEL = 'gpt-5.4-mini'

export const PROVIDER_TYPES: { value: ProviderType; label: string; requiresKey: boolean; defaultUrl: string }[] = [
  { value: 'openai', label: 'OpenAI', requiresKey: true, defaultUrl: 'https://api.openai.com/v1' },
  { value: 'anthropic', label: 'Anthropic', requiresKey: true, defaultUrl: 'https://api.anthropic.com' },
  { value: 'google', label: 'Google Gemini', requiresKey: true, defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { value: 'groq', label: 'Groq', requiresKey: true, defaultUrl: 'https://api.groq.com/openai/v1' },
  { value: 'ollama', label: 'Ollama (Local)', requiresKey: false, defaultUrl: 'http://localhost:11434/v1' },
  { value: 'deepseek', label: 'DeepSeek', requiresKey: true, defaultUrl: 'https://api.deepseek.com' },
  { value: 'mistral', label: 'Mistral AI', requiresKey: true, defaultUrl: 'https://api.mistral.ai/v1' },
  { value: 'together', label: 'Together AI', requiresKey: true, defaultUrl: 'https://api.together.ai/v1' },
  { value: 'openrouter', label: 'OpenRouter', requiresKey: true, defaultUrl: 'https://openrouter.ai/api/v1' },
  { value: 'perplexity', label: 'Perplexity', requiresKey: true, defaultUrl: 'https://api.perplexity.ai' },
  { value: 'huggingface', label: 'HuggingFace', requiresKey: true, defaultUrl: 'https://router.huggingface.co/v1' },
  { value: 'custom', label: 'Custom API', requiresKey: true, defaultUrl: '' },
]


export const ROLE_OPTIONS: { value: PersonaRole; label: string; hint: string }[] = [
  { value: 'contributor', label: 'Contributor', hint: 'Argues the strongest substantive point' },
  { value: 'researcher', label: 'Researcher', hint: 'Brings evidence and flags uncertainty' },
  { value: 'critic', label: 'Critic', hint: 'Attacks the weakest reasoning' },
  { value: 'planner', label: 'Planner', hint: 'Turns the discussion into concrete steps' },
  { value: 'synthesizer', label: 'Synthesizer', hint: 'Pulls the threads together' },
]


export const TOOL_OPTIONS = [
  { value: 'web_search', label: 'Web search', hint: 'Find sources to ground a claim' },
  { value: 'fetch_url', label: 'Read a page', hint: 'Open a URL and read its text' },
  { value: 'calculator', label: 'Calculator', hint: 'Exact arithmetic, no guessing' },
]


export const MODEL_OPTIONS: Record<ProviderType, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
    { value: 'gpt-5.4', label: 'GPT-5.4' },
    { value: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
    { value: 'gpt-5.4-pro', label: 'GPT-5.4 pro' },
    { value: 'gpt-4o', label: 'GPT-4o (legacy)' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
  ],
  groq: [
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
  ollama: [
    { value: 'llama3.2', label: 'Llama 3.2' },
    { value: 'llama3.1', label: 'Llama 3.1' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'codellama', label: 'CodeLlama' },
    { value: 'deepseek-r1', label: 'DeepSeek R1' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  ],
  mistral: [
    { value: 'mistral-small', label: 'Mistral Small' },
    { value: 'mistral-medium', label: 'Mistral Medium' },
    { value: 'mistral-large', label: 'Mistral Large' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B' },
    { value: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
  ],
  openrouter: [
    { value: 'openrouter/auto', label: 'Auto-Select Best' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
  ],
  perplexity: [
    { value: 'sonar', label: 'Sonar' },
    { value: 'sonar-pro', label: 'Sonar Pro' },
    { value: 'sonar-reasoning', label: 'Sonar Reasoning' },
  ],
  huggingface: [
    { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B' },
    { value: 'microsoft/Phi-4-mini-instruct', label: 'Phi-4 Mini' },
    { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
  ],
  custom: [
    { value: 'custom', label: 'Custom Model' },
  ],
}

