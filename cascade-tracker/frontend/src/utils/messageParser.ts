// Message content parser for detecting and structuring chatbot responses

export type ContentType = 'text' | 'market-card' | 'market-list' | 'table' | 'network-graph';

export interface MarketData {
  title: string;
  price: number; // 0-1 representing probability
  volume?: string;
  direction?: 'UP' | 'DOWN' | 'NEUTRAL';
  url?: string;
  change24h?: number;
  liquidity?: string;
  endDate?: string;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  sortable?: boolean;
}

export interface NetworkGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight?: number;
  }>;
}

export interface ParsedContent {
  type: ContentType;
  content: string | MarketData | MarketData[] | TableData | NetworkGraphData;
  id: string; // unique ID for React keys
}

/**
 * Parse raw message content to detect structured data blocks
 */
export function parseMessageContent(rawContent: string): ParsedContent[] {
  const parsed: ParsedContent[] = [];
  let remainingContent = rawContent;
  let idCounter = 0;

  // Pattern: [MARKET_DATA]...[/MARKET_DATA]
  const marketDataRegex = /\[MARKET_DATA\]([\s\S]*?)\[\/MARKET_DATA\]/g;

  // Pattern: [MARKET_LIST]...[/MARKET_LIST]
  const marketListRegex = /\[MARKET_LIST\]([\s\S]*?)\[\/MARKET_LIST\]/g;

  // Pattern: [TABLE]...[/TABLE]
  const tableRegex = /\[TABLE\]([\s\S]*?)\[\/TABLE\]/g;

  // Pattern: [NETWORK_GRAPH]...[/NETWORK_GRAPH]
  const networkGraphRegex = /\[NETWORK_GRAPH\]([\s\S]*?)\[\/NETWORK_GRAPH\]/g;

  // Extract all structured blocks and their positions
  const blocks: Array<{ start: number; end: number; type: ContentType; content: any }> = [];

  // Find market data blocks
  let match;
  while ((match = marketDataRegex.exec(rawContent)) !== null) {
    try {
      const marketData = JSON.parse(match[1].trim()) as MarketData;
      blocks.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'market-card',
        content: marketData,
      });
    } catch (e) {
      console.error('Failed to parse market data:', e);
    }
  }

  // Find market list blocks
  while ((match = marketListRegex.exec(rawContent)) !== null) {
    try {
      const marketList = JSON.parse(match[1].trim()) as MarketData[];
      blocks.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'market-list',
        content: marketList,
      });
    } catch (e) {
      console.error('Failed to parse market list:', e);
    }
  }

  // Find table blocks
  while ((match = tableRegex.exec(rawContent)) !== null) {
    try {
      const tableData = JSON.parse(match[1].trim()) as TableData;
      blocks.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'table',
        content: tableData,
      });
    } catch (e) {
      console.error('Failed to parse table data:', e);
    }
  }

  // Find network graph blocks
  while ((match = networkGraphRegex.exec(rawContent)) !== null) {
    try {
      const graphData = JSON.parse(match[1].trim()) as NetworkGraphData;
      blocks.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'network-graph',
        content: graphData,
      });
    } catch (e) {
      console.error('Failed to parse network graph data:', e);
    }
  }

  // Sort blocks by position
  blocks.sort((a, b) => a.start - b.start);

  // Build parsed content array with text and structured blocks
  let lastIndex = 0;

  for (const block of blocks) {
    // Add text before this block
    if (block.start > lastIndex) {
      const textContent = rawContent.substring(lastIndex, block.start).trim();
      if (textContent) {
        parsed.push({
          type: 'text',
          content: textContent,
          id: `text-${idCounter++}`,
        });
      }
    }

    // Add the structured block
    parsed.push({
      type: block.type,
      content: block.content,
      id: `${block.type}-${idCounter++}`,
    });

    lastIndex = block.end;
  }

  // Add remaining text
  if (lastIndex < rawContent.length) {
    const textContent = rawContent.substring(lastIndex).trim();
    if (textContent) {
      parsed.push({
        type: 'text',
        content: textContent,
        id: `text-${idCounter++}`,
      });
    }
  }

  // If no structured blocks found, return whole content as text
  if (parsed.length === 0) {
    parsed.push({
      type: 'text',
      content: rawContent,
      id: 'text-0',
    });
  }

  return parsed;
}

/**
 * Check if content contains incomplete structured blocks (during streaming)
 */
export function hasIncompleteBlocks(content: string): boolean {
  const openTags = [
    '[MARKET_DATA]',
    '[MARKET_LIST]',
    '[TABLE]',
    '[NETWORK_GRAPH]',
  ];

  const closeTags = [
    '[/MARKET_DATA]',
    '[/MARKET_LIST]',
    '[/TABLE]',
    '[/NETWORK_GRAPH]',
  ];

  for (let i = 0; i < openTags.length; i++) {
    const openCount = (content.match(new RegExp(escapeRegExp(openTags[i]), 'g')) || []).length;
    const closeCount = (content.match(new RegExp(escapeRegExp(closeTags[i]), 'g')) || []).length;

    if (openCount > closeCount) {
      return true; // Incomplete block detected
    }
  }

  return false;
}

/**
 * Extract complete blocks from streaming content
 */
export function extractCompleteBlocks(content: string): {
  complete: string;
  pending: string;
} {
  if (!hasIncompleteBlocks(content)) {
    return { complete: content, pending: '' };
  }

  // Find the last complete closing tag
  const closeTags = ['[/MARKET_DATA]', '[/MARKET_LIST]', '[/TABLE]', '[/NETWORK_GRAPH]'];
  let lastCompleteIndex = -1;

  for (const tag of closeTags) {
    const index = content.lastIndexOf(tag);
    if (index > lastCompleteIndex) {
      lastCompleteIndex = index + tag.length;
    }
  }

  if (lastCompleteIndex === -1) {
    // No complete blocks yet
    return { complete: '', pending: content };
  }

  return {
    complete: content.substring(0, lastCompleteIndex),
    pending: content.substring(lastCompleteIndex),
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
