import type { PersonaReview, LabelMapping, AggregateRanking, PersonaId } from '../types';
import { PERSONAS } from '../config/personas';

export function parseRankingFromText(text: string): string[] {
  if (text.includes('FINAL RANKING:')) {
    const parts = text.split('FINAL RANKING:');
    if (parts.length >= 2) {
      const rankingSection = parts[1];
      const numberedMatches = rankingSection.match(/\d+\.\s*Assessment [A-Z]/g);
      if (numberedMatches) {
        return numberedMatches
          .map((m) => {
            const match = m.match(/Assessment [A-Z]/);
            return match ? match[0] : '';
          })
          .filter(Boolean);
      }
      const fallbackMatches = rankingSection.match(/Assessment [A-Z]/g);
      return fallbackMatches || [];
    }
  }
  const matches = text.match(/Assessment [A-Z]/g);
  return matches || [];
}

export function calculateAggregateRankings(
  stage2Results: PersonaReview[],
  labelMapping: LabelMapping,
): AggregateRanking[] {
  const positionsByPersona: Record<string, number[]> = {};

  for (const review of stage2Results) {
    for (let i = 0; i < review.parsedRanking.length; i++) {
      const label = review.parsedRanking[i];
      const personaId = labelMapping[label];
      if (personaId) {
        if (!positionsByPersona[personaId]) positionsByPersona[personaId] = [];
        positionsByPersona[personaId].push(i + 1);
      }
    }
  }

  const aggregate: AggregateRanking[] = Object.entries(positionsByPersona).map(
    ([personaId, positions]) => ({
      personaId: personaId as PersonaId,
      personaName: PERSONAS[personaId as PersonaId]?.name || personaId,
      averageRank: positions.reduce((a, b) => a + b, 0) / positions.length,
      rankingsCount: positions.length,
    }),
  );

  aggregate.sort((a, b) => a.averageRank - b.averageRank);
  return aggregate;
}
