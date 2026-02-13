import { useState, useRef, useEffect } from 'react';
import type { ModelInfo } from '../../types';

export default function ModelSelector({
  models,
  selected,
  onChange,
  loading,
}: {
  models: ModelInfo[];
  selected: string;
  onChange: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()),
      )
    : models;

  const selectedModel = models.find((m) => m.id === selected);
  const displayName = selectedModel?.name || selected;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
        <span className="text-xs text-slate-400">Loading models...</span>
      </div>
    );
  }

  // Fewer than 15 models — use a plain select
  if (models.length > 0 && models.length <= 15) {
    return (
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    );
  }

  // Many models — searchable dropdown
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setSearch('');
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 hover:border-slate-400 focus:border-indigo-500 focus:outline-none max-w-60 truncate"
      >
        <span className="truncate">{displayName}</span>
        <svg className="h-3 w-3 shrink-0 text-slate-400" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Model list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No models match "{search}"
              </div>
            ) : (
              filtered.slice(0, 100).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full flex-col rounded-md px-3 py-1.5 text-left transition-colors ${
                    m.id === selected
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-medium truncate">{m.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">{m.id}</span>
                </button>
              ))
            )}
            {filtered.length > 100 && (
              <div className="px-3 py-2 text-center text-[10px] text-slate-400">
                {filtered.length - 100} more — refine your search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
