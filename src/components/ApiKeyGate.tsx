import { useState } from 'react';
import { useCouncilStore } from '../stores/councilStore';
import { validateApiKey } from '../services/openrouter';
import { PROVIDERS, PROVIDER_IDS } from '../config/models';
import type { ProviderId } from '../types';

export default function ApiKeyGate() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('openrouter');
  const [key, setKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const setApiKey = useCouncilStore((s) => s.setApiKey);

  const provider = PROVIDERS[selectedProvider];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;

    setValidating(true);
    setError('');

    try {
      const valid = await validateApiKey(trimmed, selectedProvider);
      if (valid) {
        setApiKey(trimmed, selectedProvider);
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch {
      setError('Could not validate key. Check your network connection.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">&#x1F3DB;</div>
          <h1 className="text-2xl font-bold text-slate-800">Startup Council</h1>
          <p className="mt-2 text-sm text-slate-500">
            Get your startup idea evaluated by an AI advisory board
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          {/* Provider selector */}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Choose your AI provider
          </label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {PROVIDER_IDS.map((id) => {
              const p = PROVIDERS[id];
              const isSelected = selectedProvider === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(id);
                    setKey('');
                    setError('');
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {p.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {id === 'openrouter' ? 'All providers' : p.name + ' models'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* API key input */}
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {provider.name} API Key
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Your key stays in this browser tab only. It is never stored or sent to any server
            other than {provider.name}. Cleared when you close the tab.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={provider.keyPlaceholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!key.trim() || validating}
            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {validating ? 'Validating...' : 'Continue'}
          </button>
          <p className="mt-3 text-xs text-center text-slate-400">
            Get a key at{' '}
            <a
              href={provider.keysUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              {provider.keysUrl.replace('https://', '')}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
