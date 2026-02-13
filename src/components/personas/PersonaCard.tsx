import type { PersonaId } from '../../types';
import { PERSONAS } from '../../config/personas';
import MarkdownRenderer from '../shared/MarkdownRenderer';

export default function PersonaCard({
  personaId,
  content,
}: {
  personaId: PersonaId;
  content: string;
}) {
  const persona = PERSONAS[personaId];

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
        <span className="text-2xl">{persona.emoji}</span>
        <div>
          <div className="font-semibold text-slate-800">{persona.name}</div>
          <div className="text-xs text-slate-400">{persona.title}</div>
        </div>
      </div>
      <div className="px-5 py-4">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
