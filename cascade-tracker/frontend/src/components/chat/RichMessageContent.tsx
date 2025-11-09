'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MarketCard, MarketList } from './MarketCard';
import { DataTable } from './DataTable';
import { NetworkGraph } from './NetworkGraph';
import { MarkdownContent } from './MarkdownContent';
import {
  parseMessageContent,
  hasIncompleteBlocks,
  extractCompleteBlocks,
  MarketData,
  TableData,
  NetworkGraphData,
} from '@/utils/messageParser';

interface RichMessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export function RichMessageContent({ content, isStreaming = false }: RichMessageContentProps) {
  // Parse the message content
  const parsedContent = useMemo(() => {
    if (isStreaming) {
      // During streaming, only parse complete blocks
      const { complete, pending } = extractCompleteBlocks(content);

      if (complete) {
        const parsed = parseMessageContent(complete);

        // If there's pending content, add it as text
        if (pending.trim()) {
          parsed.push({
            type: 'text',
            content: pending,
            id: 'streaming-text',
          });
        }

        return parsed;
      }

      // No complete blocks yet, show all as streaming text
      return [
        {
          type: 'text' as const,
          content: content,
          id: 'streaming-text-0',
        },
      ];
    }

    // Not streaming, parse complete content
    return parseMessageContent(content);
  }, [content, isStreaming]);

  return (
    <div className="space-y-4">
      {parsedContent.map((block, index) => {
        switch (block.type) {
          case 'market-card':
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <MarketCard market={block.content as MarketData} />
              </motion.div>
            );

          case 'market-list':
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <MarketList markets={block.content as MarketData[]} />
              </motion.div>
            );

          case 'table':
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <DataTable data={block.content as TableData} />
              </motion.div>
            );

          case 'network-graph':
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <NetworkGraph data={block.content as NetworkGraphData} />
              </motion.div>
            );

          case 'text':
          default:
            const textContent = block.content as string;

            // Check if content has markdown formatting
            // Look for common markdown patterns
            const hasMarkdown =
              /^#{1,6}\s/.test(textContent) || // Headings
              textContent.includes('**') ||     // Bold
              textContent.includes('```') ||    // Code blocks
              /\[.+\]\(.+\)/.test(textContent) || // Links
              /^\s*[-*+]\s/.test(textContent) || // Unordered lists
              /^\s*\d+\.\s/.test(textContent);   // Ordered lists

            // Always use markdown renderer if markdown detected (even during streaming for finalized text)
            if (hasMarkdown) {
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MarkdownContent content={textContent} />
                </motion.div>
              );
            }

            // Plain text (possibly streaming)
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="text-white/80 whitespace-pre-wrap leading-relaxed"
              >
                {textContent}
                {isStreaming && block.id.includes('streaming') && (
                  <span className="inline-block ml-1 w-2 h-4 bg-pm-teal animate-pulse" />
                )}
              </motion.div>
            );
        }
      })}

      {/* Show skeleton loaders for incomplete blocks during streaming */}
      {isStreaming && hasIncompleteBlocks(content) && (
        <SkeletonLoader />
      )}
    </div>
  );
}

// Skeleton loader for pending visualizations
function SkeletonLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="h-32 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
      <div className="flex gap-2">
        <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-1/4 animate-pulse" />
      </div>
    </motion.div>
  );
}
