import { useEffect, useRef, useState } from 'react';
import { useCouncilStore } from '../stores/councilStore';
import { runCouncil } from '../services/council';
import type { StageEvent } from '../types';
import StageNav from './shared/StageNav';
import ErrorBanner from './shared/ErrorBanner';
import Stage1Assessments from './stages/Stage1Assessments';
import Stage2Reviews from './stages/Stage2Reviews';
import Stage3Decision from './stages/Stage3Decision';

export default function CouncilSession() {
  const store = useCouncilStore();
  const hasStarted = useRef(false);
  const [expandedStage, setExpandedStage] = useState(1);

  // Auto-expand the latest active stage as it starts
  const prevStageRef = useRef(store.currentStage);
  useEffect(() => {
    if (store.currentStage > prevStageRef.current) {
      setExpandedStage(store.currentStage);
      prevStageRef.current = store.currentStage;
    }
  }, [store.currentStage]);

  useEffect(() => {
    if (hasStarted.current || !store.startupIdea || !store.isRunning) return;
    hasStarted.current = true;

    const handleEvent = (event: StageEvent) => {
      const s = useCouncilStore.getState();

      switch (event.type) {
        case 'stage1_start':
          s.setCurrentStage(1);
          s.setLoading('stage1', true);
          break;
        case 'stage1_persona_complete':
          s.addStage1Result(event.data);
          break;
        case 'stage1_complete':
          s.setStage1Complete(event.data);
          s.setLoading('stage1', false);
          break;
        case 'stage2_start':
          s.setCurrentStage(2);
          s.setLoading('stage2', true);
          break;
        case 'stage2_complete':
          s.setStage2Complete(event.data, event.labelMapping, event.aggregateRankings);
          s.setLoading('stage2', false);
          break;
        case 'stage3_start':
          s.setCurrentStage(3);
          s.setLoading('stage3', true);
          break;
        case 'stage3_complete':
          s.setStage3Complete(event.data);
          s.setLoading('stage3', false);
          s.setIsRunning(false);
          break;
        case 'error':
          s.setError(event.message);
          s.setLoading('stage1', false);
          s.setLoading('stage2', false);
          s.setLoading('stage3', false);
          s.setIsRunning(false);
          break;
        case 'complete':
          s.setIsRunning(false);
          break;
      }
    };

    runCouncil(store.startupIdea, store.selectedModel, handleEvent);
  }, [store.startupIdea, store.isRunning]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Startup idea summary */}
      <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 mb-6">
        <div className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-1">
          Evaluating
        </div>
        <p className="text-sm text-slate-700">{store.startupIdea}</p>
      </div>

      {/* Error */}
      {store.error && (
        <div className="mb-6">
          <ErrorBanner message={store.error} onDismiss={() => store.setError(null)} />
        </div>
      )}

      {/* Two-column layout: sidebar nav + content */}
      <div className="flex gap-6 items-start">
        <StageNav
          currentStage={store.currentStage}
          expandedStage={expandedStage}
          loading={store.loading}
          onSelect={setExpandedStage}
        />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile stage nav is rendered inside StageNav as a horizontal bar */}

          {/* Stage 1 */}
          {store.currentStage >= 1 && expandedStage === 1 && (
            <Stage1Assessments
              results={store.stage1Results}
              loading={store.loading.stage1}
            />
          )}

          {/* Stage 2 */}
          {store.currentStage >= 2 && expandedStage === 2 && (
            <Stage2Reviews
              results={store.stage2Results}
              labelMapping={store.labelMapping}
              aggregateRankings={store.aggregateRankings}
              loading={store.loading.stage2}
            />
          )}

          {/* Stage 3 */}
          {store.currentStage >= 3 && expandedStage === 3 && (
            <Stage3Decision result={store.stage3Result} loading={store.loading.stage3} />
          )}

          {/* Waiting state when a stage hasn't started yet */}
          {store.currentStage < expandedStage && (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <div className="text-slate-300 text-4xl mb-3">&#x23F3;</div>
              <p className="text-sm text-slate-400">
                This stage hasn't started yet. It will begin once the previous stage completes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
