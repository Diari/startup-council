import type { DecisionReport } from '../../types';
import { extractVerdict, verdictColor } from '../../utils/formatting';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function Stage3Decision({
  result,
  loading,
}: {
  result: DecisionReport | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <LoadingSpinner label="Decision Agent is synthesizing the final report..." />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div className="text-slate-300 text-4xl mb-3">&#x26A0;&#xFE0F;</div>
        <p className="text-sm text-slate-500">
          The Decision Agent could not produce a final report. Check the error above and try a new session.
        </p>
      </div>
    );
  }

  const verdict = extractVerdict(result.response);

  return (
    <div>

      {verdict && (
        <div
          className={`mb-4 inline-block rounded-lg border px-4 py-2 text-sm font-bold ${verdictColor(verdict)}`}
        >
          {verdict}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <MarkdownRenderer content={result.response} />
      </div>
    </div>
  );
}
