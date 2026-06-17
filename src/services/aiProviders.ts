// AI Provider configurations and API calls

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  website: string;
  docsUrl: string;
  features: string[];
  models: AIModel[];
  isFree: boolean;
  rateLimit?: string;
  status: 'available' | 'coming_soon' | 'beta';
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  isFree: boolean;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const GOOGLE_DEFAULT_MODEL = 'gemini-3.5-flash';
const GOOGLE_FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];
const ENV_GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_API_KEY || '') as string;
const googleModelCache = new Map<string, string[]>();

async function discoverGoogleGenerateContentModels(apiKey: string): Promise<string[]> {
  if (googleModelCache.has(apiKey)) {
    return googleModelCache.get(apiKey) || [];
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-goog-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const allModels = Array.isArray(data?.models) ? data.models : [];
    const discovered = allModels
      .filter((model: any) => {
        const methods = model?.supportedGenerationMethods;
        const supportsGenerateContent = Array.isArray(methods) && methods.includes('generateContent');
        if (!supportsGenerateContent) return false;

        const modelName = String(model?.name || '').replace(/^models\//, '');
        if (!modelName.startsWith('gemini-')) return false;

        // Exclude non-text and specialized endpoints not intended for this app flow.
        return !/(image|live|tts|embedding|veo|lyria|computer-use|deep-research|robotics)/i.test(modelName);
      })
      .map((model: any) => String(model?.name || '').replace(/^models\//, ''));

    const uniqueDiscovered = Array.from(new Set(discovered));
    googleModelCache.set(apiKey, uniqueDiscovered);
    return uniqueDiscovered;
  } catch {
    return [];
  }
}

// Get saved AI configuration and fall back to environment key when available
export function getAIConfig(): AIConfig {
  const provider = localStorage.getItem('ai_provider') || 'google';
  const model = localStorage.getItem('ai_model') || GOOGLE_DEFAULT_MODEL;
  const savedApiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key') || '';
  const apiKey = savedApiKey || ENV_GOOGLE_API_KEY;

  return {
    provider,
    apiKey,
    model,
    baseUrl: localStorage.getItem('ai_base_url') || '',
  };
}

// Save AI configuration
export function saveAIConfig(config: Partial<AIConfig>): void {
  if (config.provider !== undefined) localStorage.setItem('ai_provider', config.provider);
  if (config.apiKey !== undefined) {
    localStorage.setItem('ai_api_key', config.apiKey);
    // Also save to gemini_api_key for backward compatibility
    if (config.provider === 'google') {
      localStorage.setItem('gemini_api_key', config.apiKey);
    }
  }
  if (config.provider === 'google') {
    localStorage.setItem('ai_model', GOOGLE_DEFAULT_MODEL);
  } else if (config.model !== undefined) {
    localStorage.setItem('ai_model', config.model);
  }
  if (config.baseUrl !== undefined) localStorage.setItem('ai_base_url', config.baseUrl);
}

// Available AI Providers
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'google',
    name: 'Google AI',
    description: 'Google AI with Gemini Flash free tier for resume tailoring, ATS checking, and CV parsing.',
    icon: '🔷',
    website: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/api-key',
    features: ['Resume Tailoring', 'ATS Checking', 'CV Parsing', 'Cover Letters'],
    isFree: true,
    rateLimit: '15 RPM (free tier)',
    status: 'available',
    models: [
      { id: GOOGLE_DEFAULT_MODEL, name: 'Gemini 3.5 Flash', description: 'Current recommended flash model', contextLength: 2097152, isFree: true },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Lower-latency fallback model', contextLength: 1048576, isFree: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'High-volume fallback model', contextLength: 1048576, isFree: true },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with LPU technology. 800+ tokens/sec!',
    icon: '⚡',
    website: 'https://groq.com',
    docsUrl: 'https://console.groq.com/keys',
    features: ['Lightning Fast', 'Llama Models', 'Mixtral', 'Free Tier'],
    isFree: true,
    rateLimit: '30 RPM, 14,400/day',
    status: 'available',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Best balance of speed and quality', contextLength: 128000, isFree: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-fast responses', contextLength: 128000, isFree: true },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'Complex reasoning tasks', contextLength: 128000, isFree: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'MoE model, good for varied tasks', contextLength: 32768, isFree: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google\'s open model on Groq', contextLength: 8192, isFree: true },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ models through one API, including free options',
    icon: '🌐',
    website: 'https://openrouter.ai',
    docsUrl: 'https://openrouter.ai/keys',
    features: ['200+ Models', 'Free Models', 'OpenAI Compatible', 'Model Switching'],
    isFree: true,
    rateLimit: '20 RPM (free models)',
    status: 'available',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', description: 'Meta\'s best open model', contextLength: 131072, isFree: true },
      { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (Free)', description: 'Google\'s open model', contextLength: 96000, isFree: true },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', description: 'Fast and efficient', contextLength: 32768, isFree: true },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', description: 'Alibaba\'s powerful model', contextLength: 131072, isFree: true },
      { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat (Free)', description: 'Strong coding abilities', contextLength: 65536, isFree: true },
    ],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Access thousands of open-source models',
    icon: '🤗',
    website: 'https://huggingface.co',
    docsUrl: 'https://huggingface.co/settings/tokens',
    features: ['1M+ Models', 'Open Source', 'Research Models', 'Embeddings'],
    isFree: true,
    rateLimit: '~$0.10/month free',
    status: 'available',
    models: [
      { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B', description: 'Compact and fast', contextLength: 8192, isFree: true },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B v0.3', description: 'Efficient instruction model', contextLength: 32768, isFree: true },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B', description: 'Multilingual support', contextLength: 32768, isFree: true },
      { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Google\'s open model', contextLength: 8192, isFree: true },
    ],
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Run open-source models with $5 free credits',
    icon: '🚀',
    website: 'https://together.ai',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    features: ['$5 Free Credits', 'Fast Inference', 'Fine-tuning', 'Embeddings'],
    isFree: true,
    rateLimit: 'Pay per token',
    status: 'available',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'Optimized for speed', contextLength: 131072, isFree: false },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'MoE architecture', contextLength: 32768, isFree: false },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', description: 'Powerful multilingual', contextLength: 32768, isFree: false },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Enterprise AI with free trial credits',
    icon: '🔮',
    website: 'https://cohere.com',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    features: ['Command Models', 'Embeddings', 'RAG', 'Enterprise Ready'],
    isFree: true,
    rateLimit: '1000 calls/month (trial)',
    status: 'available',
    models: [
      { id: 'command-r-plus', name: 'Command R+', description: 'Most capable, best for complex tasks', contextLength: 128000, isFree: true },
      { id: 'command-r', name: 'Command R', description: 'Balanced performance', contextLength: 128000, isFree: true },
      { id: 'command-light', name: 'Command Light', description: 'Fast and efficient', contextLength: 4096, isFree: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude models - requires API access',
    icon: '🎭',
    website: 'https://anthropic.com',
    docsUrl: 'https://console.anthropic.com/account/keys',
    features: ['Claude 3.5', 'Long Context', 'Safe AI', 'Coding'],
    isFree: false,
    rateLimit: 'Pay per token',
    status: 'available',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best balance of intelligence and speed', contextLength: 200000, isFree: false },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest, most affordable', contextLength: 200000, isFree: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models - requires paid API access',
    icon: '🤖',
    website: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/api-keys',
    features: ['GPT-4', 'GPT-3.5', 'DALL-E', 'Whisper'],
    isFree: false,
    rateLimit: 'Pay per token',
    status: 'available',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Fastest GPT-4 class model', contextLength: 128000, isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable and fast', contextLength: 128000, isFree: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable', contextLength: 16385, isFree: false },
    ],
  },
];

// Call AI provider based on configuration
export async function callAI(prompt: string, config?: AIConfig): Promise<string> {
  const cfg = config || getAIConfig();
  if (cfg.provider !== 'google') {
    throw new Error(`Only Google AI is supported in this app. Found provider: ${cfg.provider}`);
  }
  return callGoogleAI(prompt, cfg);
}

// Test AI connection
export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = config.apiKey || ENV_GOOGLE_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'No API key available. Set it in the connector or define VITE_GOOGLE_API_KEY.' };
    }
    const response = await callAI('Reply with only the word: OK', { ...config, apiKey });
    if (response && response.length > 0) {
      return { success: true };
    }
    return { success: false, error: 'Empty response from API' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection failed' };
  }
}

// Google AI
async function callGoogleAI(prompt: string, config: AIConfig): Promise<string> {
  const modelName = config.model || GOOGLE_DEFAULT_MODEL;
  const apiKey = config.apiKey || ENV_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('No Google API key available for Google AI request.');
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      candidateCount: 1,
    },
  };

  const discoveredModels = await discoverGoogleGenerateContentModels(apiKey);
  const modelCandidates = Array.from(
    new Set([modelName, GOOGLE_DEFAULT_MODEL, ...GOOGLE_FALLBACK_MODELS, ...discoveredModels].filter(Boolean))
  );
  const transientStatusCodes = new Set([429, 500, 502, 503, 504]);
  let lastTransientError = '';
  let lastModelError = '';

  const parseTextFromResponse = (data: any): string => {
    return (
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.text ||
      data?.response?.output?.[0]?.content?.[0]?.text ||
      data?.response?.output?.[0]?.text ||
      ''
    );
  };

  const isTransientError = (status: number, errorText: string): boolean => {
    if (transientStatusCodes.has(status)) {
      return true;
    }
    return /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|temporar/i.test(errorText || '');
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Gemini API keys (including newer AQ.* format) must be sent as API keys, not OAuth bearer tokens.
    'X-goog-api-key': apiKey,
  };

  for (const candidateModel of modelCandidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent`;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        const data = await response.json();
        const text = parseTextFromResponse(data);
        if (!text) {
          throw new Error(`Empty response from Google AI: ${JSON.stringify(data)}`);
        }
        return text;
      }

      const errorText = await response.text();
      const normalizedError = (errorText || '').toLowerCase();

      if (response.status === 404 || normalizedError.includes('not found') || normalizedError.includes('unknown model')) {
        lastModelError = `Model ${candidateModel} is unavailable: ${errorText}`;
        break;
      }

      if (!isTransientError(response.status, errorText)) {
        throw new Error(`Google AI request failed (${response.status}): ${errorText}`);
      }

      lastTransientError = `Google AI request failed (${response.status}) on model ${candidateModel}: ${errorText}`;
      if (attempt < 2) {
        await sleep(500 * attempt);
      }
    }
  }

  if (lastTransientError) {
    throw new Error(`Google AI is temporarily unavailable. Please retry in a moment. Details: ${lastTransientError}`);
  }

  if (lastModelError) {
    throw new Error(`Google AI model selection failed. ${lastModelError}`);
  }

  throw new Error('Google AI request failed for all configured models.');
}

