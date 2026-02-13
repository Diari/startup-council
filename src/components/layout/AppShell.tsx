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
            </div>
          </div>
        </header>
      )}
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}
