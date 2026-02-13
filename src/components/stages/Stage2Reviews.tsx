import { useState } from 'react';
import type { PersonaReview, LabelMapping, AggregateRanking, PersonaId } from '../../types';
import { PERSONAS } from '../../config/personas';
import { deAnonymize } from '../../utils/formatting';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function Stage2Reviews({
  results,
  labelMapping,
  aggregateRankings,
  loading,
}: {
  results: PersonaReview[];
  labelMapping: LabelMapping | null;
  aggregateRankings: AggregateRanking[];
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PersonaId | null>(
    results.length > 0 ? results[0].personaId : null,
  );

  if (activeTab === null && results.length > 0) {
    setActiveTab(results[0].personaId);
  }

  if (loading && results.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <LoadingSpinner label="Advisors are reviewing each other's assessments..." />
      </div>
    );
  }

  if (results.length === 0) return null;

  const activeReview = results.find((r) => r.personaId === activeTab);

  return (
    <div>
      {/* Reviewer tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {results.map((r) => {
          const p = PERSONAS[r.personaId];
          const isActive = activeTab === r.personaId;
          return (
            <button
              key={r.personaId}
              onClick={() => setActiveTab(r.personaId)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active review */}
      {activeReview && labelMapping && (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <MarkdownRenderer
            content={deAnonymize(activeReview.review, labelMapping)}
          />
        </div>
      )}

      {/* Aggregate Rankings */}
      {aggregateRankings.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Aggregate Rankings (lower is better)
          </h4>
          <div className="space-y-2">
            {aggregateRankings.map((r, i) => {
              const persona = PERSONAS[r.personaId];
              const barWidth = Math.max(10, 100 - (r.averageRank - 1) * 25);
              return (
                <div key={r.personaId} className="flex items-center gap-3">
                  <div className="w-6 text-center text-xs font-bold text-slate-500">
                    #{i + 1}
                  </div>
                  <span className="text-lg">{persona.emoji}</span>
                  <span className="w-28 text-xs font-medium text-slate-700">
                    {persona.name}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    avg {r.averageRank.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
