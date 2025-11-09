'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import cytoscape, { Core } from 'cytoscape';
import { Expand, Minimize } from 'lucide-react';
import { NetworkGraphData } from '@/utils/messageParser';

interface NetworkGraphProps {
  data: NetworkGraphData;
  height?: number;
}

export function NetworkGraph({ data, height = 300 }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...data.nodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type || 'default',
          },
        })),
        ...data.edges.map((edge, index) => ({
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            weight: edge.weight || 1,
          },
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3b82f6',
            'background-gradient-stop-colors': '#3b82f6 #06b6d4',
            'background-gradient-direction': 'to-bottom-right',
            label: 'data(label)',
            color: '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-weight': '600',
            'text-outline-color': '#1e293b',
            'text-outline-width': 2,
            width: 60,
            height: 60,
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.3,
          },
        },
        {
          selector: 'node:hover',
          style: {
            'background-color': '#06b6d4',
            'border-opacity': 0.6,
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#64748b',
            'line-opacity': 0.5,
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.6,
          },
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'line-opacity': 1,
            opacity: 1,
            width: 3,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        padding: 30,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // Add click handler for nodes
    cy.on('tap', 'node', evt => {
      const node = evt.target;
      console.log('Node clicked:', node.data());
      // Could emit event or show details panel
    });

    return () => {
      cy.destroy();
    };
  }, [data]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-lg border border-white/10 bg-white/5
        ${isExpanded ? 'fixed inset-4 z-50' : ''}
      `}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          onClick={handleReset}
          className="
            px-3 py-1.5 rounded-md
            bg-white/10 hover:bg-white/20
            text-white/70 hover:text-white
            text-xs font-medium
            transition-all duration-200
          "
        >
          Reset View
        </button>
        <button
          onClick={handleToggleExpand}
          className="
            p-1.5 rounded-md
            bg-white/10 hover:bg-white/20
            text-white/70 hover:text-white
            transition-all duration-200
          "
        >
          {isExpanded ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        style={{ height: isExpanded ? '100%' : `${height}px` }}
        className="w-full"
      />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-slate-900/90 to-transparent">
        <div className="text-xs text-white/50">
          {data.nodes.length} nodes • {data.edges.length} edges • Click and drag to explore
        </div>
      </div>
    </motion.div>
  );
}
