import type { ProviderId, ProviderConfig } from '../types';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    keyPlaceholder: 'sk-or-v1-...',
    keyPrefix: 'sk-or-',
    keysUrl: 'https://openrouter.ai/keys',
    chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    defaultModel: 'anthropic/claude-sonnet-4',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    keysUrl: 'https://platform.openai.com/api-keys',
    chatUrl: 'https://api.openai.com/v1/chat/completions',
    modelsUrl: 'https://api.openai.com/v1/models',
    defaultModel: 'gpt-4o',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    keysUrl: 'https://console.anthropic.com/settings/keys',
    chatUrl: 'https://api.anthropic.com/v1/messages',
    modelsUrl: 'https://api.anthropic.com/v1/models',
    defaultModel: 'claude-sonnet-4-20250514',
  },
  google: {
    id: 'google',
    name: 'Google AI',
    keyPlaceholder: 'AIza...',
    keyPrefix: 'AIza',
    keysUrl: 'https://aistudio.google.com/apikey',
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-2.5-pro',
  },
};

export const PROVIDER_IDS: ProviderId[] = ['openrouter', 'openai', 'anthropic', 'google'];

export const DEFAULT_PROVIDER: ProviderId = 'openrouter';
