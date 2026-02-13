import { queryModel } from './openrouter';
import { PERSONAS, PERSONA_IDS } from '../config/personas';
import { buildStage2Prompt, buildDecisionAgentPrompt } from '../utils/prompts';
import { parseRankingFromText, calculateAggregateRankings } from '../utils/rankings';
import type {
  PersonaAssessment,
  PersonaReview,
  DecisionReport,
  LabelMapping,
  ChatMessage,
  StageEvent,
} from '../types';

export type StageCallback = (event: StageEvent) => void;

export async function runCouncil(
  startupIdea: string,
  model: string,
  onEvent: StageCallback,
): Promise<void> {
  try {
    // ===== STAGE 1: Independent Assessments =====
    onEvent({ type: 'stage1_start' });

    const stage1Results: PersonaAssessment[] = [];

    const stage1Promises = PERSONA_IDS.map(async (personaId) => {
      const persona = PERSONAS[personaId];
      const messages: ChatMessage[] = [
        { role: 'system', content: persona.systemPrompt },
        {
          role: 'user',
          content: `Please evaluate the following startup idea:\n\n${startupIdea}`,
        },
      ];

      try {
        const content = await queryModel(model, messages);
        const assessment: PersonaAssessment = {
          personaId,
          personaName: persona.name,
          response: content,
          model,
        };
        stage1Results.push(assessment);
        onEvent({ type: 'stage1_persona_complete', data: assessment });
      } catch (err) {
        console.error(`Stage 1 failed for ${persona.name}:`, err);
      }
    });

    await Promise.allSettled(stage1Promises);

    if (stage1Results.length === 0) {
      onEvent({ type: 'error', message: 'All persona assessments failed. Check your API key and try again.' });
      return;
    }
    onEvent({ type: 'stage1_complete', data: stage1Results });

    // ===== STAGE 2: Cross-Review & Ranking =====
    onEvent({ type: 'stage2_start' });

    const labels = stage1Results.map((_, i) => String.fromCharCode(65 + i));
    const labelMapping: LabelMapping = {};
    labels.forEach((label, i) => {
      labelMapping[`Assessment ${label}`] = stage1Results[i].personaId;
    });

    const assessmentsText = stage1Results
      .map((result, i) => `Assessment ${labels[i]}:\n${result.response}`)
      .join('\n\n---\n\n');

    const stage2Results: PersonaReview[] = [];

    const stage2Promises = PERSONA_IDS.map(async (personaId) => {
      const persona = PERSONAS[personaId];
      const reviewPrompt = buildStage2Prompt(startupIdea, assessmentsText);

      const messages: ChatMessage[] = [
        { role: 'system', content: persona.systemPrompt },
        { role: 'user', content: reviewPrompt },
      ];

      try {
        const content = await queryModel(model, messages);
        const parsed = parseRankingFromText(content);
        stage2Results.push({
          personaId,
          personaName: persona.name,
          review: content,
          parsedRanking: parsed,
          model,
        });
      } catch (err) {
        console.error(`Stage 2 failed for ${persona.name}:`, err);
      }
    });

    await Promise.allSettled(stage2Promises);

    const aggregateRankings = calculateAggregateRankings(stage2Results, labelMapping);
    onEvent({
      type: 'stage2_complete',
      data: stage2Results,
      labelMapping,
      aggregateRankings,
    });

    // ===== STAGE 3: Decision Agent Synthesis =====
    onEvent({ type: 'stage3_start' });

    const stage1SummaryText = stage1Results
      .map((r) => `### ${PERSONAS[r.personaId].title}\n${r.response}`)
      .join('\n\n');

    const stage2SummaryText = stage2Results
      .map((r) => `### ${PERSONAS[r.personaId].title} Review\n${r.review}`)
      .join('\n\n');

    const decisionPrompt = buildDecisionAgentPrompt(
      startupIdea,
      stage1SummaryText,
      stage2SummaryText,
    );

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are the Decision Agent for a Startup Council. You synthesize expert opinions into clear, actionable recommendations.',
      },
      { role: 'user', content: decisionPrompt },
    ];

    try {
      const content = await queryModel(model, messages);
      const report: DecisionReport = { response: content, model };
      onEvent({ type: 'stage3_complete', data: report });
    } catch (err) {
      onEvent({
        type: 'error',
        message: `Decision Agent failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      return;
    }

    onEvent({ type: 'complete' });
  } catch (error) {
    onEvent({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
