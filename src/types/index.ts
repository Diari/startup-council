export type PersonaId = 'cpo' | 'gtm' | 'vc' | 'customer';

export type ProviderId = 'openrouter' | 'openai' | 'anthropic' | 'google';

export interface ModelInfo {
  id: string;
  name: string;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  keyPlaceholder: string;
  keyPrefix: string;
  keysUrl: string;
  chatUrl: string;
  modelsUrl: string;
  defaultModel: string;
}

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  systemPrompt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PersonaAssessment {
  personaId: PersonaId;
  personaName: string;
  response: string;
  model: string;
}

export interface PersonaReview {
  personaId: PersonaId;
  personaName: string;
  review: string;
  parsedRanking: string[];
  model: string;
}

export interface DecisionReport {
  response: string;
  model: string;
}

export interface LabelMapping {
  [label: string]: PersonaId;
}

export interface AggregateRanking {
  personaId: PersonaId;
  personaName: string;
  averageRank: number;
  rankingsCount: number;
}

export interface CouncilSession {
  id: string;
  startupIdea: string;
  stage1: PersonaAssessment[] | null;
  stage2: PersonaReview[] | null;
  stage3: DecisionReport | null;
  labelMapping: LabelMapping | null;
  aggregateRankings: AggregateRanking[] | null;
  currentStage: 0 | 1 | 2 | 3;
  error: string | null;
  createdAt: string;
}

export interface StageLoadingState {
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
}

export type StageEvent =
  | { type: 'stage1_start' }
  | { type: 'stage1_persona_complete'; data: PersonaAssessment }
  | { type: 'stage1_complete'; data: PersonaAssessment[] }
  | { type: 'stage2_start' }
  | { type: 'stage2_complete'; data: PersonaReview[]; labelMapping: LabelMapping; aggregateRankings: AggregateRanking[] }
  | { type: 'stage3_start' }
  | { type: 'stage3_complete'; data: DecisionReport }
  | { type: 'error'; message: string }
  | { type: 'complete' };
