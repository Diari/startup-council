import type { ProviderId, ModelInfo } from '../types';
import { PROVIDERS } from '../config/models';

// Patterns to exclude non-chat models from OpenAI/OpenRouter
const EXCLUDE_PATTERNS = [
  /embed/i,
  /tts/i,
  /whisper/i,
  /dall-e/i,
  /moderation/i,
  /davinci/i,
  /babbage/i,
  /ada(?!-)/i,
  /curie/i,
  /realtime/i,
  /audio/i,
  /transcri/i,
];

function shouldExclude(id: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => p.test(id));
}

export async function fetchModels(
  apiKey: string,
  providerId: ProviderId,
): Promise<ModelInfo[]> {
  const provider = PROVIDERS[providerId];

  switch (providerId) {
    case 'openrouter':
      return fetchOpenRouterModels(apiKey, provider.modelsUrl);
    case 'openai':
      return fetchOpenAIModels(apiKey, provider.modelsUrl);
    case 'anthropic':
      return fetchAnthropicModels(apiKey, provider.modelsUrl);
    case 'google':
      return fetchGoogleModels(apiKey, provider.modelsUrl);
    default:
      return [];
  }
}

async function fetchOpenRouterModels(apiKey: string, url: string): Promise<ModelInfo[]> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const models = (data.data as { id: string; name: string }[]) || [];
  return models
    .filter((m) => !shouldExclude(m.id))
    .map((m) => ({ id: m.id, name: m.name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchOpenAIModels(apiKey: string, url: string): Promise<ModelInfo[]> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const models = (data.data as { id: string }[]) || [];
  return models
    .filter((m) => !shouldExclude(m.id))
    .map((m) => ({ id: m.id, name: formatModelName(m.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAnthropicModels(apiKey: string, url: string): Promise<ModelInfo[]> {
  const allModels: ModelInfo[] = [];
  let hasMore = true;
  let afterId: string | undefined;

  while (hasMore) {
    const params = new URLSearchParams({ limit: '100' });
    if (afterId) params.set('after_id', afterId);

    const res = await fetch(`${url}?${params}`, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    });
    if (!res.ok) break;
    const data = await res.json();
    const models = (data.data as { id: string; display_name: string }[]) || [];
    for (const m of models) {
      allModels.push({ id: m.id, name: m.display_name || m.id });
    }
    hasMore = data.has_more === true;
    if (hasMore && models.length > 0) {
      afterId = models[models.length - 1].id;
    }
  }

  return allModels.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchGoogleModels(apiKey: string, url: string): Promise<ModelInfo[]> {
  const allModels: ModelInfo[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ key: apiKey, pageSize: '100' });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${url}?${params}`);
    if (!res.ok) break;
    const data = await res.json();
    const models =
      (data.models as {
        name: string;
        baseModelId?: string;
        displayName: string;
        supportedGenerationMethods?: string[];
      }[]) || [];

    for (const m of models) {
      // Only include models that support generateContent (chat)
      if (m.supportedGenerationMethods?.includes('generateContent')) {
        const id = m.baseModelId || m.name.replace('models/', '');
        allModels.push({ id, name: m.displayName || id });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allModels.sort((a, b) => a.name.localeCompare(b.name));
}

function formatModelName(id: string): string {
  // Turn "gpt-4o-mini" into "GPT-4o Mini" etc.
  return id
    .split('-')
    .map((part) => {
      if (part === 'gpt' || part === 'o1' || part === 'o3') return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('-')
    .replace(/-/g, ' ')
    .replace(/(\d{4}) (\d{2}) (\d{2})/, '$1-$2-$3'); // keep dates together
}
