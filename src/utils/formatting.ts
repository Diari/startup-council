import type { LabelMapping, PersonaId } from '../types';
import { PERSONAS } from '../config/personas';

export function deAnonymize(text: string, labelMapping: LabelMapping): string {
  let result = text;
  for (const [label, personaId] of Object.entries(labelMapping)) {
    const persona = PERSONAS[personaId as PersonaId];
    result = result.replaceAll(label, `${label} (${persona.emoji} ${persona.name})`);
  }
  return result;
}

export function extractVerdict(text: string): string | null {
  const match = text.match(
    /Verdict:\s*(STRONG PURSUE|PURSUE WITH CAUTION|PIVOT NEEDED|PASS)/i,
  );
  return match ? match[1].toUpperCase() : null;
}

export function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'STRONG PURSUE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PURSUE WITH CAUTION':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PIVOT NEEDED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'PASS':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}
