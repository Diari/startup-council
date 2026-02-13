import { useState, useRef, useEffect } from 'react';
import { useCouncilStore } from '../../stores/councilStore';

type ExportFormat = 'pdf' | 'markdown';

export default function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const store = useCouncilStore();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Only show when stage 3 is complete (after all hooks)
  if (!store.stage3Result || !store.labelMapping) return null;

  const snapshotData = () => ({
    startupIdea: store.startupIdea,
    stage1Results: store.stage1Results,
    stage2Results: store.stage2Results,
    stage3Result: store.stage3Result!,
    labelMapping: store.labelMapping!,
    aggregateRankings: store.aggregateRankings,
    selectedModel: store.selectedModel,
  });

  const handleExport = async (format: ExportFormat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (exporting) return;

    setExporting(format);
    setError(null);
    setOpen(false);

    try {
      const data = snapshotData();

      if (format === 'pdf') {
        const { exportCouncilPdf } = await import('../../services/pdfExport');
        await exportCouncilPdf(data);
      } else {
        const { exportCouncilMarkdown } = await import('../../services/markdownExport');
        exportCouncilMarkdown(data);
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} export failed:`, err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!exporting) setOpen((prev) => !prev);
        }}
        disabled={!!exporting}
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
            <span>Export</span>
            <svg
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
          <button
            onClick={(e) => handleExport('pdf', e)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>PDF</span>
          </button>
          <button
            onClick={(e) => handleExport('markdown', e)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span>Markdown</span>
          </button>
        </div>
      )}

      {/* Error tooltip */}
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
