import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { cryptoService } from './crypto'

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'deepseek' | 'mistral' | 'together' | 'openrouter' | 'perplexity' | 'huggingface' | 'custom'

export interface LLMConfig {
  provider: ProviderType
  apiKey: string
  apiUrl: string
  model: string
  temperature: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  personaName?: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

// Provider-specific implementations
abstract class BaseLLMProvider {
  protected config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  abstract chat(messages: ChatMessage[]): Promise<LLMResponse>
  abstract validateConfig(): { valid: boolean; error?: string }
}

class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl !== 'https://api.openai.com/v1' ? config.apiUrl : undefined,
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      const usage = response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined

      return {
        content: response.choices[0]?.message?.content || '(No response)',
        usage,
      }
    } catch (error: any) {
      if (error instanceof OpenAI.APIError) {
        const specificError = this.getSpecificError(error)
        throw new LLMError(specificError.message, specificError.code, error.status)
      }
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        throw new LLMError(
          `Cannot connect to OpenAI. Check internet or API URL.`,
          'CONNECTION_ERROR'
        )
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  private getSpecificError(error: InstanceType<typeof OpenAI.APIError>): { message: string; code: string } {
    const status = error.status
    const message = error.message

    if (status === 401) {
      return { message: 'Invalid OpenAI API key. Must start with sk- or sk-proj-', code: 'INVALID_API_KEY' }
    }
    if (status === 403) {
      return { message: 'Access denied. Check API key permissions.', code: 'ACCESS_DENIED' }
    }
    if (status === 404) {
      if (message.includes('model') || message.includes('not found')) {
        return { message: `Model "${this.config.model}" not found. Check model name.`, code: 'MODEL_NOT_FOUND' }
      }
      return { message: 'API endpoint not found.', code: 'ENDPOINT_NOT_FOUND' }
    }
    if (status === 429) {
      return { message: 'OpenAI rate limit exceeded. Retry after a few seconds.', code: 'RATE_LIMIT' }
    }
    if (status === 400) {
      if (message.includes('model')) {
        return { message: `Model "${this.config.model}" is invalid or unavailable.`, code: 'MODEL_UNAVAILABLE' }
      }
      return { message: 'Bad request. Check your parameters.', code: 'BAD_REQUEST' }
    }
    if (status === 503) {
      return { message: 'OpenAI service temporarily unavailable.', code: 'SERVICE_UNAVAILABLE' }
    }
    return { message: message || 'OpenAI API error', code: 'OPENAI_ERROR' }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (!this.config.apiKey.startsWith('sk-') && !this.config.apiKey.startsWith('sk-proj-')) {
      return { valid: false, error: 'Invalid OpenAI API key format (must start with sk- or sk-proj-)' }
    }
    return { valid: true }
  }
}

class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic

  constructor(config: LLMConfig) {
    super(config)
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.apiUrl !== 'https://api.anthropic.com' ? config.apiUrl : undefined,
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = messages.filter(m => m.role !== 'system')

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new LLMError('Unexpected response type', 'ANTHROPIC_ERROR')
      }

      return {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      }
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new LLMError(error.message, 'ANTHROPIC_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (!this.config.apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Invalid Anthropic API key format' }
    }
    return { valid: true }
  }
}

class GoogleProvider extends BaseLLMProvider {
  private client: OpenAI // Google uses OpenAI-compatible API

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://generativelanguage.googleapis.com/v1beta',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      // Google Gemini models via OpenAI-compatible endpoint
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'GOOGLE_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    // Google API keys vary, just check it's not empty
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid Google API key' }
    }
    return { valid: true }
  }
}

class GroqProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api.groq.com/openai/v1',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'GROQ_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (!this.config.apiKey.startsWith('gsk-')) {
      return { valid: false, error: 'Invalid Groq API key format' }
    }
    return { valid: true }
  }
}

class OllamaProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    // Ollama uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: 'ollama', // Ollama doesn't require a real key
      baseURL: config.apiUrl || 'http://localhost:11434/v1',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'OLLAMA_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    // Ollama is local, just check URL is reachable
    return { valid: true }
  }
}

class CustomProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
      defaultHeaders: {
        // OpenRouter requires these headers
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Tarka Sabha',
      },
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error: any) {
      if (error instanceof OpenAI.APIError) {
        // Provide specific error messages for common issues
        const specificError = this.getSpecificError(error)
        throw new LLMError(specificError.message, specificError.code, error.status)
      }
      // Network/connection errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        throw new LLMError(
          `Cannot connect to API server. Check URL: ${this.config.apiUrl}`,
          'CONNECTION_ERROR'
        )
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  private getSpecificError(error: InstanceType<typeof OpenAI.APIError>): { message: string; code: string } {
    const status = error.status
    const message = error.message

    if (status === 401) {
      return { message: 'Invalid API key. Please check your credentials.', code: 'INVALID_API_KEY' }
    }
    if (status === 403) {
      return { message: 'Access denied. Check API key permissions.', code: 'ACCESS_DENIED' }
    }
    if (status === 404) {
      if (message.includes('model')) {
        return { message: `Model "${this.config.model}" not found. Check model name.`, code: 'MODEL_NOT_FOUND' }
      }
      return { message: 'API endpoint not found. Check API URL.', code: 'ENDPOINT_NOT_FOUND' }
    }
    if (status === 429) {
      return { message: 'Rate limit exceeded. Try again later or reduce requests.', code: 'RATE_LIMIT' }
    }
    if (status === 400 && message.includes('model')) {
      return { message: `Model "${this.config.model}" is not available.`, code: 'MODEL_UNAVAILABLE' }
    }
    return { message: message || 'API request failed', code: 'CUSTOM_ERROR' }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (!this.config.apiUrl) {
      return { valid: false, error: 'API URL is required for custom providers' }
    }
    // Validate URL format
    try {
      new URL(this.config.apiUrl)
    } catch {
      return { valid: false, error: 'Invalid API URL format (e.g., https://api.example.com/v1)' }
    }
    if (!this.config.apiKey || this.config.apiKey.length < 5) {
      return { valid: false, error: 'API key is required and must be at least 5 characters' }
    }
    if (!this.config.model || this.config.model.length < 2) {
      return { valid: false, error: 'Model name is required' }
    }
    return { valid: true }
  }
}

class DeepSeekProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api.deepseek.com',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'DEEPSEEK_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid DeepSeek API key' }
    }
    return { valid: true }
  }
}

class MistralProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api.mistral.ai/v1',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'MISTRAL_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid Mistral API key' }
    }
    return { valid: true }
  }
}

class TogetherAIProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api.together.ai/v1',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'TOGETHER_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid Together AI API key' }
    }
    return { valid: true }
  }
}

class OpenRouterProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Tarka Sabha',
      },
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'OPENROUTER_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid OpenRouter API key' }
    }
    return { valid: true }
  }
}

class PerplexityProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api.perplexity.ai',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'PERPLEXITY_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid Perplexity API key' }
    }
    return { valid: true }
  }
}

class HuggingFaceProvider extends BaseLLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl || 'https://api-inference.huggingface.co/models',
    })
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens || 500,
      })

      return {
        content: response.choices[0]?.message?.content || '(No response)',
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(error.message, 'HUGGINGFACE_ERROR', error.status)
      }
      throw new LLMError(String(error), 'UNKNOWN_ERROR')
    }
  }

  validateConfig(): { valid: boolean; error?: string } {
    if (this.config.apiKey.length < 10) {
      return { valid: false, error: 'Invalid HuggingFace API key' }
    }
    return { valid: true }
  }
}

// Factory for creating providers
export class LLMProviderFactory {
  static create(config: LLMConfig): BaseLLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config)
      case 'anthropic':
        return new AnthropicProvider(config)
      case 'google':
        return new GoogleProvider(config)
      case 'groq':
        return new GroqProvider(config)
      case 'ollama':
        return new OllamaProvider(config)
      case 'deepseek':
        return new DeepSeekProvider(config)
      case 'mistral':
        return new MistralProvider(config)
      case 'together':
        return new TogetherAIProvider(config)
      case 'openrouter':
        return new OpenRouterProvider(config)
      case 'perplexity':
        return new PerplexityProvider(config)
      case 'huggingface':
        return new HuggingFaceProvider(config)
      case 'custom':
        return new CustomProvider(config)
      default:
        throw new LLMError(`Unknown provider: ${config.provider}`, 'UNKNOWN_PROVIDER')
    }
  }

  static getModelsForProvider(provider: ProviderType): string[] {
    const models: Record<ProviderType, string[]> = {
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'o1', 'o1-mini'],
      anthropic: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-3-20250514'],
      google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
      groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'deepseek-r1'],
      deepseek: ['deepseek-chat', 'deepseek-reasoner'],
      mistral: ['mistral-small', 'mistral-medium', 'mistral-large', 'open-mistral-7b', 'open-mixtral-8x7b'],
      together: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.1-405B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct'],
      openrouter: ['openrouter/auto', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.0-flash-exp'],
      perplexity: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro'],
      huggingface: ['meta-llama/Llama-3.3-70B-Instruct', 'microsoft/Phi-4-mini-instruct', 'Qwen/Qwen2.5-72B-Instruct'],
      custom: ['custom'],
    }
    return models[provider] || ['custom']
  }

  static getProviderInfo(provider: ProviderType): {
    name: string
    defaultUrl: string
    requiresKey: boolean
  } {
    const info: Record<ProviderType, { name: string; defaultUrl: string; requiresKey: boolean }> = {
      openai: {
        name: 'OpenAI',
        defaultUrl: 'https://api.openai.com/v1',
        requiresKey: true,
      },
      anthropic: {
        name: 'Anthropic',
        defaultUrl: 'https://api.anthropic.com',
        requiresKey: true,
      },
      google: {
        name: 'Google Gemini',
        defaultUrl: 'https://generativelanguage.googleapis.com/v1beta',
        requiresKey: true,
      },
      groq: {
        name: 'Groq',
        defaultUrl: 'https://api.groq.com/openai/v1',
        requiresKey: true,
      },
      ollama: {
        name: 'Ollama (Local)',
        defaultUrl: 'http://localhost:11434/v1',
        requiresKey: false,
      },
      deepseek: {
        name: 'DeepSeek',
        defaultUrl: 'https://api.deepseek.com',
        requiresKey: true,
      },
      mistral: {
        name: 'Mistral AI',
        defaultUrl: 'https://api.mistral.ai/v1',
        requiresKey: true,
      },
      together: {
        name: 'Together AI',
        defaultUrl: 'https://api.together.ai/v1',
        requiresKey: true,
      },
      openrouter: {
        name: 'OpenRouter',
        defaultUrl: 'https://openrouter.ai/api/v1',
        requiresKey: true,
      },
      perplexity: {
        name: 'Perplexity',
        defaultUrl: 'https://api.perplexity.ai',
        requiresKey: true,
      },
      huggingface: {
        name: 'HuggingFace',
        defaultUrl: 'https://api-inference.huggingface.co/models',
        requiresKey: true,
      },
      custom: {
        name: 'Custom API',
        defaultUrl: '',
        requiresKey: true,
      },
    }
    return info[provider]
  }
}

// Main function to get response with provider config
export async function getLLMResponse(
  apiKey: string,
  provider: ProviderType,
  model: string,
  messages: ChatMessage[],
  options: {
    apiUrl?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<LLMResponse> {
  const config: LLMConfig = {
    provider,
    apiKey: cryptoService.decrypt(apiKey),
    apiUrl: options.apiUrl || LLMProviderFactory.getProviderInfo(provider).defaultUrl,
    model,
    temperature: options.temperature || 0.7,
    maxTokens: options.maxTokens,
  }

  const llmProvider = LLMProviderFactory.create(config)

  // Validate before making request
  const validation = llmProvider.validateConfig()
  if (!validation.valid) {
    throw new LLMError(validation.error || 'Invalid config', 'VALIDATION_ERROR')
  }

  return llmProvider.chat(messages)
}
