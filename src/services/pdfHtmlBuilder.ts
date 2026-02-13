import type {
  PersonaAssessment,
  PersonaReview,
  DecisionReport,
  LabelMapping,
  AggregateRanking,
} from '../types';
import { PERSONAS } from '../config/personas';
import { deAnonymize, extractVerdict } from '../utils/formatting';
import { markdownToHtml } from '../utils/markdownToHtml';

export interface PdfReportData {
  startupIdea: string;
  stage1Results: PersonaAssessment[];
  stage2Results: PersonaReview[];
  stage3Result: DecisionReport;
  labelMapping: LabelMapping;
  aggregateRankings: AggregateRanking[];
  selectedModel: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function verdictBadgeHtml(text: string): string {
  const colors: Record<string, [string, string, string]> = {
    'STRONG PURSUE': ['#16a34a', '#dcfce7', '#bbf7d0'],
    'PURSUE WITH CAUTION': ['#a16207', '#fef9c3', '#fde68a'],
    'PIVOT NEEDED': ['#c2410c', '#ffedd5', '#fed7aa'],
    'PASS': ['#dc2626', '#fee2e2', '#fecaca'],
  };
  const [color, bg, border] = colors[text] ?? ['#334155', '#f1f5f9', '#cbd5e1'];
  return `<span style="display:inline-block;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.03em;color:${color};background:${bg};border:1px solid ${border};">${escapeHtml(text)}</span>`;
}

function personaHeaderHtml(emoji: string, name: string, title: string): string {
  return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
      <span style="font-size:22px;">${emoji}</span>
      <div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(name)}</div>
        <div style="font-size:11px;color:#94a3b8;letter-spacing:0.02em;">${escapeHtml(title)}</div>
      </div>
    </div>`;
}

function stageHeadingHtml(text: string): string {
  return `<h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 24px;padding-bottom:10px;border-bottom:2px solid #6366f1;">${escapeHtml(text)}</h2>`;
}

function sectionDivider(): string {
  return `<hr style="border:none;border-top:2px solid #e2e8f0;margin:36px 0;">`;
}

function dashedDivider(): string {
  return `<hr style="border:none;border-top:1px dashed #cbd5e1;margin:28px 0 0;">`;
}

function proseBlock(markdown: string): string {
  return `<div class="pdf-prose">${markdownToHtml(markdown)}</div>`;
}

export function buildReportHtml(data: PdfReportData): string {
  const verdict = extractVerdict(data.stage3Result.response);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build stage 1 sections
  const stage1Sections = data.stage1Results.map((result, i) => {
    const persona = PERSONAS[result.personaId];
    const divider = i < data.stage1Results.length - 1
      ? `<div data-pdf-section="stage1-divider-${i}">${dashedDivider()}</div>`
      : '';
    return `
      <div data-pdf-section="stage1-persona-${i}">
        ${personaHeaderHtml(persona.emoji, persona.name, persona.title)}
        ${proseBlock(result.response)}
      </div>
      ${divider}`;
  }).join('');

  // Build stage 2 sections
  const stage2Sections = data.stage2Results.map((result, i) => {
    const persona = PERSONAS[result.personaId];
    const divider = i < data.stage2Results.length - 1
      ? `<div data-pdf-section="stage2-divider-${i}">${dashedDivider()}</div>`
      : '';
    const deAnonymizedReview = deAnonymize(result.review, data.labelMapping);
    return `
      <div data-pdf-section="stage2-persona-${i}">
        ${personaHeaderHtml(persona.emoji, persona.name, persona.title)}
        ${proseBlock(deAnonymizedReview)}
      </div>
      ${divider}`;
  }).join('');

  // Build rankings table
  const rankingsTable = data.aggregateRankings.length > 0 ? `
    <div data-pdf-section="rankings" style="margin-top:32px;padding:20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <h3 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;margin:0 0 14px;">
        Aggregate Rankings
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;color:#475569;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:60px;">Rank</th>
            <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;color:#475569;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Advisor</th>
            <th style="text-align:right;padding:10px 12px;border-bottom:2px solid #e2e8f0;color:#475569;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:100px;">Avg. Rank</th>
          </tr>
        </thead>
        <tbody>
          ${data.aggregateRankings.map((r, i) => {
            const persona = PERSONAS[r.personaId];
            return `
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#6366f1;">#${i + 1}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${persona.emoji} ${escapeHtml(persona.name)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;font-weight:600;">${r.averageRank.toFixed(1)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : '';

  return `
    <div style="width:794px;padding:48px 52px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;background:#ffffff;line-height:1.6;">

      <!-- COVER HEADER -->
      <div data-pdf-section="cover" style="margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
          <span style="font-size:30px;">&#x1F3DB;</span>
          <span style="font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">Startup Council</span>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:20px;padding-left:2px;">
          Evaluation Report &middot; ${escapeHtml(dateStr)} &middot; Model: ${escapeHtml(data.selectedModel)}
        </div>
        <div style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:18px 20px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6366f1;margin-bottom:6px;">Startup Idea</div>
          <div style="font-size:15px;color:#1e293b;line-height:1.5;">${escapeHtml(data.startupIdea)}</div>
        </div>
        ${verdict ? `<div style="margin-top:20px;">${verdictBadgeHtml(verdict)}</div>` : ''}
      </div>

      <div data-pdf-section="divider-1">${sectionDivider()}</div>

      <!-- STAGE 1 -->
      <div data-pdf-section="stage1-heading">${stageHeadingHtml('Stage 1: Individual Assessments')}</div>
      ${stage1Sections}

      <div data-pdf-section="divider-2">${sectionDivider()}</div>

      <!-- STAGE 2 -->
      <div data-pdf-section="stage2-heading">${stageHeadingHtml('Stage 2: Cross-Review & Ranking')}</div>
      ${stage2Sections}
      ${rankingsTable}

      <div data-pdf-section="divider-3">${sectionDivider()}</div>

      <!-- STAGE 3 -->
      <div data-pdf-section="stage3">
        ${stageHeadingHtml('Stage 3: Final Decision')}
        ${verdict ? `<div style="margin-bottom:20px;">${verdictBadgeHtml(verdict)}</div>` : ''}
        ${proseBlock(data.stage3Result.response)}
      </div>

      <!-- FOOTER -->
      <div data-pdf-section="footer" style="margin-top:40px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
        Generated by Startup Council &middot; ${escapeHtml(dateStr)}
      </div>
    </div>`;
}

/** CSS to inject into document.head for markdown prose styling in the PDF container */
export const PDF_PROSE_CSS = `
#pdf-export-container .pdf-prose {
  font-size: 14px;
  line-height: 1.75;
  color: #334155;
}

/* Headings */
#pdf-export-container .pdf-prose h1 {
  font-size: 19px;
  font-weight: 700;
  color: #0f172a;
  margin: 24px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}
#pdf-export-container .pdf-prose h2 {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 22px 0 8px;
}
#pdf-export-container .pdf-prose h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 18px 0 6px;
}
#pdf-export-container .pdf-prose h4 {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin: 14px 0 4px;
}

/* Paragraphs */
#pdf-export-container .pdf-prose p {
  margin: 8px 0;
}

/* Lists — bullet markers */
#pdf-export-container .pdf-prose ul {
  list-style-type: disc;
  padding-left: 24px;
  margin: 10px 0;
}
#pdf-export-container .pdf-prose ol {
  list-style-type: decimal;
  padding-left: 24px;
  margin: 10px 0;
}
#pdf-export-container .pdf-prose li {
  margin: 5px 0;
  padding-left: 4px;
}
#pdf-export-container .pdf-prose ul ul {
  list-style-type: circle;
  margin: 4px 0;
}
#pdf-export-container .pdf-prose ol ol {
  margin: 4px 0;
}

/* Inline styles */
#pdf-export-container .pdf-prose strong {
  font-weight: 700;
  color: #0f172a;
}
#pdf-export-container .pdf-prose em {
  font-style: italic;
}

/* Tables */
#pdf-export-container .pdf-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 13px;
}
#pdf-export-container .pdf-prose th {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  color: #475569;
  background: #f8fafc;
  font-size: 12px;
}
#pdf-export-container .pdf-prose td {
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
}

/* Code */
#pdf-export-container .pdf-prose code {
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4f46e5;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}
#pdf-export-container .pdf-prose pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  margin: 12px 0;
}
#pdf-export-container .pdf-prose pre code {
  background: none;
  padding: 0;
  color: inherit;
}

/* Blockquotes */
#pdf-export-container .pdf-prose blockquote {
  border-left: 3px solid #a5b4fc;
  padding-left: 14px;
  color: #64748b;
  margin: 14px 0;
  font-style: italic;
}

/* Horizontal rules */
#pdf-export-container .pdf-prose hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 20px 0;
}

/* Links */
#pdf-export-container .pdf-prose a {
  color: #4f46e5;
  text-decoration: underline;
}

/* Strikethrough */
#pdf-export-container .pdf-prose del {
  text-decoration: line-through;
  color: #94a3b8;
}

/* Task lists */
#pdf-export-container .pdf-prose input[type="checkbox"] {
  margin-right: 6px;
}
`;
