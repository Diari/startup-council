import { create } from 'zustand';
import type {
  PersonaAssessment,
  PersonaReview,
  DecisionReport,
  LabelMapping,
  AggregateRanking,
  StageLoadingState,
  ProviderId,
  ModelInfo,
} from '../types';
import { PROVIDERS, DEFAULT_PROVIDER } from '../config/models';
import { fetchModels as fetchModelsFromApi } from '../services/models';

interface CouncilStore {
  // API key & provider
  apiKey: string | null;
  provider: ProviderId;
  setApiKey: (key: string, provider: ProviderId) => void;
  clearApiKey: () => void;

  // Models
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: ModelInfo[];
  modelsLoading: boolean;
  loadModels: () => Promise<void>;

  // Session
  startupIdea: string;
  currentStage: 0 | 1 | 2 | 3;
  isRunning: boolean;
  error: string | null;

  // Stage results
  stage1Results: PersonaAssessment[];
  stage2Results: PersonaReview[];
  stage3Result: DecisionReport | null;
  labelMapping: LabelMapping | null;
  aggregateRankings: AggregateRanking[];

  // Loading
  loading: StageLoadingState;

  // Actions
  startSession: (idea: string) => void;
  addStage1Result: (result: PersonaAssessment) => void;
  setStage1Complete: (results: PersonaAssessment[]) => void;
  setStage2Complete: (results: PersonaReview[], mapping: LabelMapping, rankings: AggregateRanking[]) => void;
  setStage3Complete: (result: DecisionReport) => void;
  setCurrentStage: (stage: 0 | 1 | 2 | 3) => void;
  setLoading: (stage: keyof StageLoadingState, value: boolean) => void;
  setError: (error: string | null) => void;
  setIsRunning: (running: boolean) => void;
  reset: () => void;
}

function loadProvider(): ProviderId {
  const stored = sessionStorage.getItem('council_provider') as ProviderId | null;
  return stored && stored in PROVIDERS ? stored : DEFAULT_PROVIDER;
}

const storedProvider = loadProvider();

const initialState = {
  apiKey: sessionStorage.getItem('council_api_key'),
  provider: storedProvider,
  selectedModel: PROVIDERS[storedProvider].defaultModel,
  availableModels: [] as ModelInfo[],
  modelsLoading: false,
  startupIdea: '',
  currentStage: 0 as const,
  isRunning: false,
  error: null,
  stage1Results: [] as PersonaAssessment[],
  stage2Results: [] as PersonaReview[],
  stage3Result: null,
  labelMapping: null,
  aggregateRankings: [] as AggregateRanking[],
  loading: { stage1: false, stage2: false, stage3: false },
};

export const useCouncilStore = create<CouncilStore>((set, get) => ({
  ...initialState,

  setApiKey: (key, provider) => {
    sessionStorage.setItem('council_api_key', key);
    sessionStorage.setItem('council_provider', provider);
    set({
      apiKey: key,
      provider,
      selectedModel: PROVIDERS[provider].defaultModel,
      availableModels: [],
    });
  },

  clearApiKey: () => {
    sessionStorage.removeItem('council_api_key');
    sessionStorage.removeItem('council_provider');
    set({ apiKey: null, provider: DEFAULT_PROVIDER, availableModels: [] });
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  loadModels: async () => {
    const { apiKey, provider } = get();
    if (!apiKey) return;
    set({ modelsLoading: true });
    try {
      const models = await fetchModelsFromApi(apiKey, provider);
      set({ availableModels: models, modelsLoading: false });
    } catch {
      set({ modelsLoading: false });
    }
  },

  startSession: (idea) =>
    set({
      startupIdea: idea,
      currentStage: 0,
      isRunning: true,
      error: null,
      stage1Results: [],
      stage2Results: [],
      stage3Result: null,
      labelMapping: null,
      aggregateRankings: [],
      loading: { stage1: false, stage2: false, stage3: false },
    }),

  addStage1Result: (result) =>
    set((state) => ({
      stage1Results: [...state.stage1Results, result],
    })),

  setStage1Complete: (results) =>
    set({
      stage1Results: results,
      loading: { stage1: false, stage2: false, stage3: false },
    }),

  setStage2Complete: (results, mapping, rankings) =>
    set({
      stage2Results: results,
      labelMapping: mapping,
      aggregateRankings: rankings,
      loading: { stage1: false, stage2: false, stage3: false },
    }),

  setStage3Complete: (result) =>
    set({
      stage3Result: result,
      loading: { stage1: false, stage2: false, stage3: false },
    }),

  setCurrentStage: (stage) => set({ currentStage: stage }),

  setLoading: (stage, value) =>
    set((state) => ({
      loading: { ...state.loading, [stage]: value },
    })),

  setError: (error) => set({ error, isRunning: false }),

  setIsRunning: (running) => set({ isRunning: running }),

  reset: () => {
    const p = loadProvider();
    const { availableModels } = get();
    set({
      ...initialState,
      apiKey: sessionStorage.getItem('council_api_key'),
      provider: p,
      selectedModel: PROVIDERS[p].defaultModel,
      availableModels,
    });
  },
}));
