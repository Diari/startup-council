const STAGES = [
  { id: 1, label: 'Individual Assessments', shortLabel: 'Assessments' },
  { id: 2, label: 'Cross-Review & Ranking', shortLabel: 'Reviews' },
  { id: 3, label: 'Decision Report', shortLabel: 'Decision' },
] as const;

export default function StageNav({
  currentStage,
  expandedStage,
  loading,
  onSelect,
}: {
  currentStage: number;
  expandedStage: number;
  loading: { stage1: boolean; stage2: boolean; stage3: boolean };
  onSelect: (stage: number) => void;
}) {
  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:flex flex-col gap-1 w-56 shrink-0 sticky top-24">
        {STAGES.map((s) => {
          const isAvailable = currentStage >= s.id;
          const isExpanded = expandedStage === s.id;
          const isLoading =
            (s.id === 1 && loading.stage1) ||
            (s.id === 2 && loading.stage2) ||
            (s.id === 3 && loading.stage3);
          const isComplete = currentStage > s.id || (currentStage === s.id && !isLoading);

          return (
            <button
              key={s.id}
              onClick={() => isAvailable && onSelect(s.id)}
              disabled={!isAvailable}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                isExpanded
                  ? 'bg-indigo-50 border border-indigo-200'
                  : isAvailable
                    ? 'hover:bg-slate-100 border border-transparent'
                    : 'opacity-40 cursor-not-allowed border border-transparent'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isExpanded
                    ? 'bg-indigo-600 text-white'
                    : isComplete
                      ? 'bg-indigo-600 text-white'
                      : isLoading
                        ? 'border-2 border-indigo-400 text-indigo-500 animate-pulse'
                        : 'border border-slate-300 text-slate-400'
                }`}
              >
                {isComplete && !isLoading ? '\u2713' : s.id}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-medium truncate ${
                    isExpanded ? 'text-indigo-700' : isAvailable ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </div>
                {isLoading && (
                  <div className="text-[10px] text-indigo-400">Processing...</div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: horizontal tabs */}
      <div className="flex gap-1 lg:hidden mb-4">
        {STAGES.map((s) => {
          const isAvailable = currentStage >= s.id;
          const isExpanded = expandedStage === s.id;
          const isLoading =
            (s.id === 1 && loading.stage1) ||
            (s.id === 2 && loading.stage2) ||
            (s.id === 3 && loading.stage3);
          const isComplete = currentStage > s.id || (currentStage === s.id && !isLoading);

          return (
            <button
              key={s.id}
              onClick={() => isAvailable && onSelect(s.id)}
              disabled={!isAvailable}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isExpanded
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : isAvailable
                    ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  isExpanded
                    ? 'bg-indigo-600 text-white'
                    : isComplete
                      ? 'bg-indigo-600 text-white'
                      : isLoading
                        ? 'border-2 border-indigo-400 text-indigo-500 animate-pulse'
                        : 'border border-slate-300 text-slate-400'
                }`}
              >
                {isComplete && !isLoading ? '\u2713' : s.id}
              </div>
              <span>{s.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
