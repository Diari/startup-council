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
          <a
            href="https://github.com/Diari/startup-council"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Open source &middot; MIT License
          </a>
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
