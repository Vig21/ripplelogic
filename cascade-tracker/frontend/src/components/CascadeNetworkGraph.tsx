'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import cytoscape from 'cytoscape';

interface Market {
  market_id: string;
  market_name: string;
  market_url?: string;
  direction: string;
  magnitude_percent: number;
  confidence: number;
  reason: string;
  cascade_level?: number;
  timing?: string;
  triggered_by?: string;
}

interface MarketRelationship {
  source_market: string;
  target_market: string;
  relationship_type: string;
  mechanism: string;
  time_delay?: string;
  strength?: number;
  confidence?: number;
}

interface CascadeChain {
  chain: string;
  rationale: string;
  timeline_estimate: string;
}

interface CascadeNetworkGraphProps {
  markets: Market[];
  cascadeChains?: CascadeChain[];
  marketRelationships?: MarketRelationship[];
  primaryEffects?: Market[];
  secondaryEffects?: Market[];
  tertiaryEffects?: Market[];
  triggerEvent: string;
}

export default function CascadeNetworkGraph({
  markets,
  cascadeChains = [],
  marketRelationships = [],
  primaryEffects = [],
  secondaryEffects = [],
  tertiaryEffects = [],
  triggerEvent
}: CascadeNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<Market | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchical' | 'circular'>('hierarchical');
  const [highlightLevel, setHighlightLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || markets.length === 0) return;

    // Combine all effects into markets if separate arrays provided
    const allMarkets = markets.length > 0 ? markets : [
      ...primaryEffects,
      ...secondaryEffects,
      ...tertiaryEffects
    ];

    if (allMarkets.length === 0) return;

    // Clear existing graph if changing view mode
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Create nodes from markets with cascade level information
    const nodes = [
      // Trigger event node
      {
        data: {
          id: 'trigger',
          label: 'TRIGGER',
          sublabel: triggerEvent.substring(0, 30) + '...',
          type: 'trigger',
          cascade_level: 0,
          size: 70
        },
        classes: 'trigger-node'
      },
      // Market nodes with cascade level
      ...allMarkets.map((market) => ({
        data: {
          id: market.market_id,
          label: market.market_name.length > 40
            ? market.market_name.substring(0, 37) + '...'
            : market.market_name,
          type: 'market',
          direction: market.direction,
          magnitude: market.magnitude_percent,
          confidence: market.confidence,
          reason: market.reason,
          cascade_level: market.cascade_level || 1,
          timing: market.timing || 'Unknown',
          triggered_by: market.triggered_by,
          market_url: market.market_url,
          size: 35 + Math.min(market.magnitude_percent, 30) // Size based on magnitude
        },
        classes: `level-${market.cascade_level || 1} ${market.direction?.toLowerCase()}`
      }))
    ];

    // Create edges
    const edges: any[] = [];

    // Get all valid node IDs for validation
    const validNodeIds = new Set(['trigger', ...allMarkets.map(m => m.market_id)]);

    // If we have explicit market relationships, use those
    if (marketRelationships.length > 0) {
      marketRelationships.forEach((rel, idx) => {
        // Only add edge if both source and target nodes exist
        if (validNodeIds.has(rel.source_market) && validNodeIds.has(rel.target_market)) {
          edges.push({
            data: {
              id: `rel-${idx}`,
              source: rel.source_market,
              target: rel.target_market,
              label: rel.mechanism ? rel.mechanism.substring(0, 30) : 'Causal relationship',
              relationship_type: rel.relationship_type,
              mechanism: rel.mechanism || 'Direct causal relationship',
              time_delay: rel.time_delay,
              strength: rel.strength || 0.7,
              confidence: rel.confidence || 0.7,
              edge_type: 'relationship'
            },
            classes: 'cascade-edge'
          });
        } else {
          console.warn(`Skipping invalid relationship edge: ${rel.source_market} -> ${rel.target_market}`);
        }
      });
    }

    // Add trigger edges to primary effects (level 1)
    const level1Markets = allMarkets.filter(m => (m.cascade_level || 1) === 1);
    level1Markets.forEach((market) => {
      // Only add trigger edge if not already covered by relationships
      const hasRelationship = edges.some(e => e.data.target === market.market_id);
      if (!hasRelationship) {
        edges.push({
          data: {
            id: `trigger-${market.market_id}`,
            source: 'trigger',
            target: market.market_id,
            strength: market.confidence,
            edge_type: 'trigger'
          },
          classes: 'trigger-edge'
        });
      }
    });

    // Add edges based on triggered_by field
    allMarkets.forEach((market) => {
      if (market.triggered_by && validNodeIds.has(market.triggered_by)) {
        const hasRelationship = edges.some(
          e => e.data.source === market.triggered_by && e.data.target === market.market_id
        );
        if (!hasRelationship) {
          edges.push({
            data: {
              id: `cascade-${market.triggered_by}-${market.market_id}`,
              source: market.triggered_by,
              target: market.market_id,
              strength: market.confidence || 0.6,
              edge_type: 'cascade'
            },
            classes: 'cascade-edge'
          });
        }
      } else if (market.triggered_by && !validNodeIds.has(market.triggered_by)) {
        console.warn(`Skipping triggered_by edge: source node ${market.triggered_by} does not exist`);
      }
    });

    // Parse cascade chains and add edges if relationships don't exist
    if (cascadeChains.length > 0 && marketRelationships.length === 0) {
      cascadeChains.forEach((chain, idx) => {
        const marketNames = chain.chain.split('→').map(m => m.trim());
        for (let i = 0; i < marketNames.length - 1; i++) {
          const sourceMarket = allMarkets.find(m =>
            marketNames[i].toLowerCase().includes(m.market_name.toLowerCase().substring(0, 15)) ||
            m.market_name.toLowerCase().includes(marketNames[i].toLowerCase().substring(0, 15))
          );
          const targetMarket = allMarkets.find(m =>
            marketNames[i + 1].toLowerCase().includes(m.market_name.toLowerCase().substring(0, 15)) ||
            m.market_name.toLowerCase().includes(marketNames[i + 1].toLowerCase().substring(0, 15))
          );

          if (sourceMarket && targetMarket) {
            const existingEdge = edges.find(
              e => e.data.source === sourceMarket.market_id && e.data.target === targetMarket.market_id
            );
            if (!existingEdge) {
              edges.push({
                data: {
                  id: `chain-${idx}-${i}`,
                  source: sourceMarket.market_id,
                  target: targetMarket.market_id,
                  label: chain.rationale.substring(0, 25),
                  mechanism: chain.rationale,
                  strength: 0.7,
                  edge_type: 'chain'
                },
                classes: 'cascade-edge'
              });
            }
          }
        }
      });
    }

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        // Base node style
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '9px',
            'font-weight': 600,
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': '2px',
            'border-color': '#8b5cf6',
            'text-outline-width': '2px',
            'text-outline-color': '#000',
          }
        },
        // Trigger node
        {
          selector: '.trigger-node',
          style: {
            'background-color': '#0ea5e9',
            'border-color': '#38bdf8',
            'border-width': '4px',
            'font-size': '11px',
            'font-weight': 'bold',
            'shape': 'diamond'
          }
        },
        // Level-based coloring
        {
          selector: '.level-1',
          style: {
            'background-color': '#8b5cf6',
            'border-color': '#a78bfa'
          }
        },
        {
          selector: '.level-2',
          style: {
            'background-color': '#6366f1',
            'border-color': '#818cf8'
          }
        },
        {
          selector: '.level-3',
          style: {
            'background-color': '#3b82f6',
            'border-color': '#60a5fa'
          }
        },
        // Direction-based styling
        {
          selector: '.up',
          style: {
            'border-color': '#10b981',
            'border-width': '3px'
          }
        },
        {
          selector: '.down',
          style: {
            'border-color': '#ef4444',
            'border-width': '3px'
          }
        },
        // Edge styles
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.5,
            'arrow-scale': 1.2
          }
        },
        {
          selector: '.trigger-edge',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 3,
            'opacity': 0.7,
            'line-style': 'solid'
          }
        },
        {
          selector: '.cascade-edge',
          style: {
            'line-color': '#a78bfa',
            'target-arrow-color': '#a78bfa',
            'width': 2.5,
            'opacity': 0.6,
            'line-style': 'dashed',
            'label': 'data(label)',
            'font-size': '7px',
            'color': '#cbd5e1',
            'text-background-color': '#1e293b',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px'
          }
        },
        // Selection and highlighting
        {
          selector: 'node:selected',
          style: {
            'border-width': '5px',
            'border-color': '#fbbf24',
            'z-index': 999
          }
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'z-index': 999,
            'line-color': '#fbbf24',
            'target-arrow-color': '#fbbf24',
            'width': 4,
            'border-color': '#fbbf24',
            'border-width': '4px'
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.15
          }
        }
      ],
      layout: {
        name: viewMode === 'hierarchical' ? 'breadthfirst' : 'circle',
        directed: true,
        spacingFactor: 1.5,
        animate: true,
        animationDuration: 800,
        fit: true,
        padding: 40,
        ...(viewMode === 'hierarchical' && {
          roots: '#trigger',
          depthSort: (a: any, b: any) => {
            return (a.data('cascade_level') || 0) - (b.data('cascade_level') || 0);
          }
        })
      }
    });

    // Hover interactions
    cy.on('mouseover', 'node', (event: any) => {
      const node = event.target;
      node.style({
        'width': (node.data('size') as number) + 10,
        'height': (node.data('size') as number) + 10,
      });
    });

    cy.on('mouseout', 'node', (event: any) => {
      const node = event.target;
      node.style({
        'width': node.data('size'),
        'height': node.data('size'),
      });
    });

    // Click handler - trace cascade
    cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      const nodeData = node.data();

      if (nodeData.type === 'market') {
        const market = allMarkets.find(m => m.market_id === nodeData.id);
        setSelectedNode(market || null);
      }

      // Highlight cascade path
      cy.elements().removeClass('highlighted faded');
      cy.elements().addClass('faded');

      // Highlight selected node
      node.removeClass('faded').addClass('highlighted');

      // Highlight all connected paths (both upstream and downstream)
      const predecessors = node.predecessors();
      const successors = node.successors();

      predecessors.removeClass('faded').addClass('highlighted');
      successors.removeClass('faded').addClass('highlighted');
    });

    // Click background to reset
    cy.on('tap', (event: any) => {
      if (event.target === cy) {
        cy.elements().removeClass('highlighted faded');
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [markets, cascadeChains, marketRelationships, primaryEffects, secondaryEffects, tertiaryEffects, triggerEvent, viewMode]);

  // Handle level highlighting
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().removeClass('highlighted faded');

    if (highlightLevel !== null) {
      cyRef.current.elements().addClass('faded');
      cyRef.current.nodes(`[cascade_level=${highlightLevel}]`).removeClass('faded').addClass('highlighted');
      cyRef.current.nodes(`[cascade_level=${highlightLevel}]`).connectedEdges().removeClass('faded').addClass('highlighted');
    }
  }, [highlightLevel]);

  return (
    <div className="w-full h-full relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="glass-card p-2 flex gap-1">
          <button
            onClick={() => setViewMode('hierarchical')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'hierarchical'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Hierarchical
          </button>
          <button
            onClick={() => setViewMode('circular')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'circular'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Circular
          </button>
        </div>

        <div className="glass-card p-2 flex gap-1">
          <button
            onClick={() => setHighlightLevel(null)}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              highlightLevel === null
                ? 'bg-cyan-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setHighlightLevel(1)}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              highlightLevel === 1
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            1°
          </button>
          <button
            onClick={() => setHighlightLevel(2)}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              highlightLevel === 2
                ? 'bg-indigo-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            2°
          </button>
          <button
            onClick={() => setHighlightLevel(3)}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              highlightLevel === 3
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            3°
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="w-full h-full bg-slate-900/50 rounded-lg" />

      {/* Selected Node Panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-4 right-4 glass-card p-4 max-w-md"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">{selectedNode.market_name}</h4>
              {selectedNode.market_url && (
                <a
                  href={selectedNode.market_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition mb-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Polymarket
                </a>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  selectedNode.direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedNode.direction} {selectedNode.magnitude_percent}%
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                  Level {selectedNode.cascade_level || 1}
                </span>
                {selectedNode.timing && (
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                    {selectedNode.timing}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-300 mb-2">{selectedNode.reason}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Confidence: {(selectedNode.confidence * 100).toFixed(0)}%</span>
            {selectedNode.triggered_by && (
              <span className="text-purple-400">→ Triggered by primary effect</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 glass-card p-3 text-xs">
        <div className="font-semibold text-white mb-2">Cascade Levels</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-purple-400"></div>
            <span className="text-gray-300">Primary (2-5 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-indigo-400"></div>
            <span className="text-gray-300">Secondary (1-3 weeks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-400"></div>
            <span className="text-gray-300">Tertiary (2-4 months)</span>
          </div>
        </div>
      </div>
    </div>
  );
}


