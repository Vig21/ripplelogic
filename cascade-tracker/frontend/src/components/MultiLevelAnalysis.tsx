'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Effect {
  market_id: string;
  market_name: string;
  market_url?: string;
  direction: string;
  magnitude_percent: number;
  timing: string;
  confidence: number;
  reason: string;
  cascade_level?: number;
  triggered_by?: string;
}

interface ArbitrageOpportunity {
  market_id: string;
  market_name: string;
  current_implied_price: number;
  fair_value_estimate: number;
  reasoning: string;
  confidence: number;
}

interface MultiLevelAnalysisProps {
  primaryEffects?: Effect[];
  secondaryEffects?: Effect[];
  tertiaryEffects?: Effect[];
  arbitrageOpportunities?: ArbitrageOpportunity[];
  contrarianTakes?: string[];
}

type Tab = 'primary' | 'secondary' | 'tertiary' | 'arbitrage';

export default function MultiLevelAnalysis({
  primaryEffects = [],
  secondaryEffects = [],
  tertiaryEffects = [],
  arbitrageOpportunities = [],
  contrarianTakes = []
}: MultiLevelAnalysisProps) {
  const [activeTab, setActiveTab] = useState<Tab>('primary');

  // Helper to find triggering market name
  const findTriggeringMarket = (triggeredBy: string | undefined): string | null => {
    if (!triggeredBy) return null;

    // Search in all effects
    const allEffects = [...primaryEffects, ...secondaryEffects, ...tertiaryEffects];
    const triggerMarket = allEffects.find(e => e.market_id === triggeredBy);
    return triggerMarket ? triggerMarket.market_name : null;
  };

  const tabs = [
    { id: 'primary' as Tab, label: '⚡ Primary', count: primaryEffects.length },
    { id: 'secondary' as Tab, label: '🔄 Secondary', count: secondaryEffects.length },
    { id: 'tertiary' as Tab, label: '🌊 Tertiary', count: tertiaryEffects.length },
    { id: 'arbitrage' as Tab, label: '💰 Arbitrage', count: arbitrageOpportunities.length }
  ];

  const renderEffect = (effect: Effect, index: number) => {
    const triggeringMarketName = findTriggeringMarket(effect.triggered_by);

    return (
      <motion.div
        key={effect.market_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative"
      >
        {/* Triggering relationship indicator */}
        {triggeringMarketName && (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1 text-pm-blue">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-gray-400">Triggered by:</span>
              <span className="font-semibold text-pm-blue">{triggeringMarketName}</span>
            </div>
          </div>
        )}

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 interactive hover:shadow-glow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">{effect.market_name}</h4>
              {effect.market_url && (
                <a
                  href={effect.market_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pm-blue hover:opacity-90 flex items-center gap-1 transition"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Polymarket
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                effect.direction === 'UP'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {effect.direction === 'UP' ? '↑' : '↓'} {effect.magnitude_percent}%
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-3">{effect.reason}</p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Timing:</span>
              <span className="ml-2 text-pm-blue font-semibold">{effect.timing}</span>
            </div>
            <div>
              <span className="text-gray-400">Confidence:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-600 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pm-blue to-pm-teal"
                    style={{ width: `${effect.confidence * 100}%` }}
                  />
                </div>
                <span className="text-cyan-400 font-semibold">{Math.round(effect.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderArbitrage = (arb: ArbitrageOpportunity, index: number) => (
    <motion.div
      key={arb.market_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-yellow-900/30 to-slate-700 rounded-lg p-4 border border-yellow-500/30"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-yellow-300">{arb.market_name}</h4>
        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded font-semibold">
          {Math.round(arb.confidence * 100)}% confidence
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-xs text-gray-400 mb-1">Current Price</div>
          <div className="text-white font-bold">{arb.current_implied_price}%</div>
        </div>
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-xs text-gray-400 mb-1">Fair Value</div>
          <div className="text-green-400 font-bold">{arb.fair_value_estimate}%</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-yellow-300 font-semibold mb-1">Opportunity:</div>
        <div className="text-lg font-bold text-white">
          {arb.current_implied_price - arb.fair_value_estimate}% overpriced
        </div>
      </div>

      <p className="text-xs text-gray-300 italic">"{arb.reasoning}"</p>
    </motion.div>
  );

  return (
    <div className="glass-card gradient-border overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 p-6 border-b border-white/10">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          📈 Multi-Level Cascade Analysis
        </h2>
        <p className="text-sm text-gray-400">
          Watch how effects propagate through markets in real-time
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border-b-2 border-pm-blue'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-xs bg-slate-600 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'primary' && (
            <motion.div
              key="primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">⚡ Primary Effects</h3>
                <p className="text-xs text-gray-400 mb-3">Direct market reactions (2-5 days)</p>

                {/* Flow summary */}
                {primaryEffects.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-pm-blue">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-semibold">Cascade Flow:</span>
                      <span className="text-gray-300">Trigger Event → {primaryEffects.length} Primary Market{primaryEffects.length > 1 ? 's' : ''} → Secondary Wave</span>
                    </div>
                  </div>
                )}
              </div>
              {primaryEffects.length > 0 ? (
                primaryEffects.map((effect, idx) => renderEffect(effect, idx))
              ) : (
                <p className="text-gray-400 text-center py-8">No primary effects data available</p>
              )}
            </motion.div>
          )}

          {activeTab === 'secondary' && (
            <motion.div
              key="secondary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">🔄 Secondary Wave</h3>
                <p className="text-xs text-gray-400 mb-3">Industry adaptation (1-3 weeks)</p>

                {/* Flow summary */}
                {secondaryEffects.length > 0 && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-indigo-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-semibold">Cascade Flow:</span>
                      <span className="text-gray-300">Primary Effects → {secondaryEffects.length} Secondary Market{secondaryEffects.length > 1 ? 's' : ''} → Tertiary Ripples</span>
                    </div>
                  </div>
                )}
              </div>
              {secondaryEffects.length > 0 ? (
                secondaryEffects.map((effect, idx) => renderEffect(effect, idx))
              ) : (
                <p className="text-gray-400 text-center py-8">No secondary effects data available</p>
              )}
            </motion.div>
          )}

          {activeTab === 'tertiary' && (
            <motion.div
              key="tertiary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">🌊 Tertiary Ripples</h3>
                <p className="text-xs text-gray-400 mb-3">Long-term structural changes (2-4 months)</p>

                {/* Flow summary */}
                {tertiaryEffects.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-blue-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">Cascade Flow:</span>
                      <span className="text-gray-300">Secondary Wave → {tertiaryEffects.length} Tertiary Market{tertiaryEffects.length > 1 ? 's' : ''} → Final Equilibrium</span>
                    </div>
                  </div>
                )}
              </div>
              {tertiaryEffects.length > 0 ? (
                tertiaryEffects.map((effect, idx) => renderEffect(effect, idx))
              ) : (
                <p className="text-gray-400 text-center py-8">No tertiary effects data available</p>
              )}
            </motion.div>
          )}

          {activeTab === 'arbitrage' && (
            <motion.div
              key="arbitrage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-yellow-300 mb-1">💰 Arbitrage Opportunities</h3>
                <p className="text-xs text-gray-400">Mispriced markets identified by AI analysis</p>
              </div>
              {arbitrageOpportunities.length > 0 ? (
                arbitrageOpportunities.map((arb, idx) => renderArbitrage(arb, idx))
              ) : (
                <p className="text-gray-400 text-center py-8">No arbitrage opportunities detected</p>
              )}

              {/* Contrarian Takes */}
              {contrarianTakes.length > 0 && (
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-cyan-500/30">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-3">🎯 Contrarian Takes</h4>
                  <ul className="space-y-2">
                    {contrarianTakes.map((take, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{take}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
