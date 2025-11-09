'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white/90 mb-4 mt-6 border-b border-white/10 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white/90 mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white/85 mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-white/80 mb-2 mt-3">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => <p className="text-white/80 mb-3 leading-relaxed">{children}</p>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-1
                text-pm-teal hover:text-pm-blue
                underline underline-offset-2
                transition-colors duration-200
              "
            >
              {children}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 mb-4 ml-6 text-white/80 marker:text-pm-teal">{children}</ol>
          ),
          li: ({ children, node, ...props }) => {
            // Check if this is part of an ordered list
            const isOrdered = node?.position?.start.column !== undefined;

            if (isOrdered) {
              return (
                <li className="text-white/80 leading-relaxed pl-2" {...props}>
                  {children}
                </li>
              );
            }

            // Unordered list item with custom bullet
            return (
              <li className="text-white/80 leading-relaxed flex items-start gap-2" {...props}>
                <span className="text-pm-teal mt-1 flex-shrink-0">•</span>
                <span className="flex-1">{children}</span>
              </li>
            );
          },

          // Code
          code: ({ inline, className, children }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-pm-teal font-mono text-sm">
                  {children}
                </code>
              );
            }

            // Block code
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return (
              <div className="my-4 rounded-lg overflow-hidden border border-white/10">
                {language && (
                  <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-white/50 uppercase tracking-wide">
                    {language}
                  </div>
                )}
                <pre className="p-4 bg-black/30 overflow-x-auto">
                  <code className="text-sm font-mono text-white/90">{children}</code>
                </pre>
              </div>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-pm-teal pl-4 py-2 my-4 bg-white/5 rounded-r-lg">
              <div className="text-white/70 italic">{children}</div>
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 border-b border-white/10">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-white/80">{children}</td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-t border-white/10" />,

          // Strong/Bold
          strong: ({ children }) => <strong className="font-bold text-white/95">{children}</strong>,

          // Emphasis/Italic
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
