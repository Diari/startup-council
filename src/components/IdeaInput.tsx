import { useState, useEffect } from 'react';
import { useCouncilStore } from '../stores/councilStore';
import { PERSONAS, PERSONA_IDS } from '../config/personas';
import ModelSelector from './shared/ModelSelector';

export default function IdeaInput({ onSubmit }: { onSubmit: (idea: string) => void }) {
  const [idea, setIdea] = useState('');
  const {
    selectedModel,
    setSelectedModel,
    isRunning,
    availableModels,
    modelsLoading,
    loadModels,
  } = useCouncilStore();

  useEffect(() => {
    if (availableModels.length === 0 && !modelsLoading) {
      loadModels();
    }
  }, [availableModels.length, modelsLoading, loadModels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim() && !isRunning) {
      onSubmit(idea.trim());
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Describe your startup idea</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your idea will be evaluated by four AI advisors from different perspectives
        </p>
      </div>

      {/* Persona preview cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PERSONA_IDS.map((id) => {
          const p = PERSONAS[id];
          return (
            <div
              key={id}
              className="rounded-lg border border-slate-200 bg-white p-3 text-center"
            >
              <div className="text-2xl">{p.emoji}</div>
              <div className="mt-1 text-xs font-semibold text-slate-700">{p.name}</div>
              <div className="text-[10px] text-slate-400">{p.title}</div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your startup idea... What problem does it solve? Who is the target customer? How does it work?"
          rows={6}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Model:</label>
            <ModelSelector
              models={availableModels}
              selected={selectedModel}
              onChange={setSelectedModel}
              loading={modelsLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!idea.trim() || isRunning}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Evaluate with Council
          </button>
        </div>
      </form>
    </div>
  );
}
