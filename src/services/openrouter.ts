import type { ChatMessage, ProviderId } from '../types';
import { PROVIDERS } from '../config/models';

function getApiKey(): string {
  const key = sessionStorage.getItem('council_api_key');
  if (!key) {
    throw new Error('No API key found. Please enter your API key.');
  }
  return key;
}

function getProvider(): ProviderId {
  return (sessionStorage.getItem('council_provider') as ProviderId) || 'openrouter';
}

export async function validateApiKey(key: string, providerId: ProviderId): Promise<boolean> {
  const provider = PROVIDERS[providerId];

  if (providerId === 'anthropic') {
    // Validate by hitting the models endpoint
    const response = await fetch(provider.modelsUrl + '?limit=1', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    });
    return response.ok;
  }

  if (providerId === 'google') {
    const response = await fetch(`${provider.modelsUrl}?key=${key}&pageSize=1`);
    return response.ok;
  }

  // OpenRouter and OpenAI use Bearer token + models endpoint
  const response = await fetch(provider.modelsUrl, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  return response.ok;
}

export async function queryModel(
  model: string,
  messages: ChatMessage[],
  timeoutMs: number = 120_000,
): Promise<string> {
  const apiKey = getApiKey();
  const providerId = getProvider();
  const provider = PROVIDERS[providerId];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (providerId === 'anthropic') {
      return await queryAnthropic(provider.chatUrl, apiKey, model, messages, controller.signal);
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (providerId === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Startup Council';
    }

    const response = await fetch(provider.chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg =
        (errorData as { error?: { message?: string } })?.error?.message ||
        response.statusText;
      throw new Error(`${provider.name} API error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Model ${model} timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

async function queryAnthropic(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  // Anthropic Messages API: system prompt is a top-level param, not a message
  const systemMsg = messages.find((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) {
    body.system = systemMsg.content;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg =
      (errorData as { error?: { message?: string } })?.error?.message ||
      response.statusText;
    throw new Error(`Anthropic API error (${response.status}): ${msg}`);
  }

  const data = await response.json();
  // Anthropic returns content as an array of content blocks
  const blocks = data.content as { type: string; text?: string }[];
  const textBlock = blocks.find((b) => b.type === 'text');
  return textBlock?.text || '';
}
