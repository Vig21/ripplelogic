'use client';

import { motion } from 'framer-motion';

interface TimelineEffect {
  market_id: string;
  market_name: string;
  market_url?: string;
  direction: string;
  magnitude_percent: number;
  timing: string;
  confidence: number;
  reason: string;
  cascade_level?: number;
}

interface CascadeTimelineProps {
  triggerEvent: string;
  primaryEffects?: TimelineEffect[];
  secondaryEffects?: TimelineEffect[];
  tertiaryEffects?: TimelineEffect[];
}

export default function CascadeTimeline({
  triggerEvent,
  primaryEffects = [],
  secondaryEffects = [],
  tertiaryEffects = []
}: CascadeTimelineProps) {
  const hasData = primaryEffects.length > 0 || secondaryEffects.length > 0 || tertiaryEffects.length > 0;

  if (!hasData) {
    return null;
  }

  // Calculate total markets affected
  const totalMarkets = primaryEffects.length + secondaryEffects.length + tertiaryEffects.length;

  return (
    <div className="glass-card gradient-border overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 p-6 border-b border-white/10">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          ⏱️ Cascade Timeline
        </h2>
        <p className="text-sm text-gray-400">
          Watch how effects unfold across {totalMarkets} markets over time
        </p>
      </div>

      {/* Timeline Content */}
      <div className="p-6">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500" />

          {/* Trigger Event */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex items-start gap-6 mb-8"
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-4 border-slate-800 shadow-lg shadow-cyan-500/50">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-lg">🎯 Trigger Event</h3>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-semibold">
                  T+0 (Now)
                </span>
              </div>
              <p className="text-sm text-gray-300">{triggerEvent}</p>
            </div>
          </motion.div>

          {/* Primary Effects */}
          {primaryEffects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex items-start gap-6 mb-8"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-4 border-slate-800 shadow-lg shadow-purple-500/50">
                <span className="text-white font-bold text-sm">L1</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">⚡ Primary Effects</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-white/10 text-gray-200 px-3 py-1 rounded-full font-semibold">
                        T+0-15 min
                      </span>
                      <span className="text-gray-400">{primaryEffects.length} market{primaryEffects.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Market list */}
                  <div className="space-y-2">
                    {primaryEffects.map((effect, idx) => (
                      <div
                        key={effect.market_id}
                        className="flex items-center justify-between bg-slate-700/50 rounded p-2 text-xs"
                      >
                        <div className="flex-1">
                          <div className="text-gray-200 font-medium mb-1">{effect.market_name}</div>
                          {effect.market_url && (
                            <a
                              href={effect.market_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pm-blue hover:opacity-90 flex items-center gap-1 transition"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Polymarket</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            effect.direction === 'UP'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {effect.direction === 'UP' ? '↑' : '↓'} {effect.magnitude_percent}%
                          </span>
                          <span className="text-gray-500">{Math.round(effect.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Secondary Effects */}
          {secondaryEffects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative flex items-start gap-6 mb-8"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 border-4 border-slate-800 shadow-lg shadow-indigo-500/50">
                <span className="text-white font-bold text-sm">L2</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">🔄 Secondary Wave</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold">
                        T+15min-2hrs
                      </span>
                      <span className="text-gray-400">{secondaryEffects.length} market{secondaryEffects.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Market list */}
                  <div className="space-y-2">
                    {secondaryEffects.map((effect, idx) => (
                      <div
                        key={effect.market_id}
                        className="flex items-center justify-between bg-slate-700/50 rounded p-2 text-xs"
                      >
                        <div className="flex-1">
                          <div className="text-gray-200 font-medium mb-1">{effect.market_name}</div>
                          {effect.market_url && (
                            <a
                              href={effect.market_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pm-blue hover:opacity-90 flex items-center gap-1 transition"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Polymarket</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            effect.direction === 'UP'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {effect.direction === 'UP' ? '↑' : '↓'} {effect.magnitude_percent}%
                          </span>
                          <span className="text-gray-500">{Math.round(effect.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tertiary Effects */}
          {tertiaryEffects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative flex items-start gap-6"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-slate-800 shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-sm">L3</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">🌊 Tertiary Ripples</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-semibold">
                        T+2-24hrs
                      </span>
                      <span className="text-gray-400">{tertiaryEffects.length} market{tertiaryEffects.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Market list */}
                  <div className="space-y-2">
                    {tertiaryEffects.map((effect, idx) => (
                      <div
                        key={effect.market_id}
                        className="flex items-center justify-between bg-slate-700/50 rounded p-2 text-xs"
                      >
                        <div className="flex-1">
                          <div className="text-gray-200 font-medium mb-1">{effect.market_name}</div>
                          {effect.market_url && (
                            <a
                              href={effect.market_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pm-blue hover:opacity-90 flex items-center gap-1 transition"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Polymarket</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            effect.direction === 'UP'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {effect.direction === 'UP' ? '↑' : '↓'} {effect.magnitude_percent}%
                          </span>
                          <span className="text-gray-500">{Math.round(effect.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4 text-center border border-slate-600">
            <div className="text-2xl font-bold text-purple-400">{primaryEffects.length}</div>
            <div className="text-xs text-gray-400 mt-1">Primary Effects</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-center border border-slate-600">
            <div className="text-2xl font-bold text-indigo-400">{secondaryEffects.length}</div>
            <div className="text-xs text-gray-400 mt-1">Secondary Effects</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-center border border-slate-600">
            <div className="text-2xl font-bold text-blue-400">{tertiaryEffects.length}</div>
            <div className="text-xs text-gray-400 mt-1">Tertiary Effects</div>
          </div>
        </div>
      </div>
    </div>
  );
}
