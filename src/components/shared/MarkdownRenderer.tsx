import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div
      className={[
        'prose prose-slate max-w-none',
        // Headings
        'prose-headings:font-semibold prose-headings:text-slate-800',
        'prose-h1:text-xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h1:mb-4',
        'prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2',
        'prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1',
        // Body text
        'prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-600',
        // Lists
        'prose-li:text-sm prose-li:leading-relaxed prose-li:text-slate-600',
        'prose-ul:my-2 prose-ol:my-2',
        // Bold / emphasis
        'prose-strong:text-slate-800 prose-strong:font-semibold',
        // Links
        'prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline',
        // Code
        'prose-code:text-xs prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-700 prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:text-xs',
        // Tables
        'prose-th:text-xs prose-th:font-semibold prose-th:text-slate-700 prose-th:bg-slate-50',
        'prose-td:text-sm prose-td:text-slate-600',
        // Blockquotes
        'prose-blockquote:border-indigo-300 prose-blockquote:text-slate-500 prose-blockquote:text-sm prose-blockquote:not-italic',
        // Horizontal rules
        'prose-hr:border-slate-200',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
