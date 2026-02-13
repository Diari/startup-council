import { useState } from 'react';
import type { PersonaAssessment, PersonaId } from '../../types';
import { PERSONAS } from '../../config/personas';
import PersonaCard from '../personas/PersonaCard';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function Stage1Assessments({
  results,
  loading,
}: {
  results: PersonaAssessment[];
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PersonaId | null>(
    results.length > 0 ? results[0].personaId : null,
  );

  // Update active tab when first result arrives
  if (activeTab === null && results.length > 0) {
    setActiveTab(results[0].personaId);
  }

  const completedIds = new Set(results.map((r) => r.personaId));

  return (
    <div>
      {/* Persona tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {(['cpo', 'gtm', 'vc', 'customer'] as PersonaId[]).map((id) => {
          const p = PERSONAS[id];
          const done = completedIds.has(id);
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => done && setActiveTab(id)}
              disabled={!done}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : done
                    ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
              {done && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      {activeTab && completedIds.has(activeTab) ? (
        <PersonaCard
          personaId={activeTab}
          content={results.find((r) => r.personaId === activeTab)!.response}
        />
      ) : loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <LoadingSpinner label="Advisors are evaluating your idea..." />
        </div>
      ) : null}

      {loading && results.length > 0 && results.length < 4 && (
        <div className="mt-3">
          <LoadingSpinner label={`${results.length}/4 assessments complete...`} />
        </div>
      )}
    </div>
  );
}
