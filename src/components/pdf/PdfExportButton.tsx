import { useState } from 'react';
import { useCouncilStore } from '../../stores/councilStore';

export default function PdfExportButton() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useCouncilStore();

  // Only show when stage 3 is complete
  if (!store.stage3Result || !store.labelMapping) return null;

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (exporting) return;

    setExporting(true);
    setError(null);

    try {
      // Snapshot the store data before the async operation
      const data = {
        startupIdea: store.startupIdea,
        stage1Results: store.stage1Results,
        stage2Results: store.stage2Results,
        stage3Result: store.stage3Result!,
        labelMapping: store.labelMapping!,
        aggregateRankings: store.aggregateRankings,
        selectedModel: store.selectedModel,
      };

      const { exportCouncilPdf } = await import('../../services/pdfExport');
      await exportCouncilPdf(data);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        {exporting ? (
          <>
            <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>Export PDF</span>
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full right-0 mt-1 w-56 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 shadow-sm z-50">
          <div className="flex items-start justify-between gap-2">
            <span>Export failed: {error}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
