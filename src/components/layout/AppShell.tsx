import { useCouncilStore } from '../../stores/councilStore';
import { PROVIDERS } from '../../config/models';
import ExportDropdown from '../pdf/ExportDropdown';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { apiKey, provider, clearApiKey, reset, isRunning } = useCouncilStore();

  const providerName = PROVIDERS[provider].name;

  return (
    <div className="min-h-screen bg-slate-50">
      {apiKey && (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">&#x1F3DB;</span>
              <span className="font-semibold text-slate-800">Startup Council</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                disabled={isRunning}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                New Session
              </button>
              <ExportDropdown />
              <div className="flex items-center gap-2 rounded-md bg-green-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-green-700">{providerName}</span>
              </div>
              <button
                onClick={clearApiKey}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Change provider
              </button>
              <a
                href="https://github.com/Diari/startup-council"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="View on GitHub"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </header>
      )}
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}
