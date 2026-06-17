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

const GOOGLE_DEFAULT_MODEL = 'gemini-flash-latest';
const ENV_GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_API_KEY || '') as string;

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
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    features: ['Resume Tailoring', 'ATS Checking', 'CV Parsing', 'Cover Letters'],
    isFree: true,
    rateLimit: '15 RPM (free tier)',
    status: 'available',
    models: [
      { id: GOOGLE_DEFAULT_MODEL, name: 'Gemini Flash Latest', description: 'Latest free-tier Gemini Flash model', contextLength: 2097152, isFree: true },
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

  const isAuthKey = apiKey.startsWith('AQ.') || apiKey.startsWith('ya29.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent${isAuthKey ? '' : `?key=${encodeURIComponent(apiKey)}`}`;
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

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (isAuthKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    headers['X-goog-api-key'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    data?.output?.[0]?.text ||
    data?.response?.output?.[0]?.content?.[0]?.text ||
    data?.response?.output?.[0]?.text ||
    '';

  if (!text) {
    throw new Error(`Empty response from Google AI: ${JSON.stringify(data)}`);
  }

  return text;
}

