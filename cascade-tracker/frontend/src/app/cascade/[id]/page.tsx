'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCascade } from '@/services/api';
import PredictionInput from '@/components/PredictionInput';
import MultiLevelAnalysis from '@/components/MultiLevelAnalysis';
import CascadeTimeline from '@/components/CascadeTimeline';
import LiveCascadeIndicator from '@/components/LiveCascadeIndicator';
import PriceChangeToast from '@/components/PriceChangeToast';

interface Cascade {
  id: string;
  name: string;
  description: string;
  status: string;
  severity: number;
  category: string;
  event_data?: {
    event_headline?: string;
    impact_thesis?: string;
    significance_score?: number;
    primary_effects?: Array<{
      market_id: string;
      market_name: string;
      direction: string;
      magnitude_percent: number;
      timing: string;
      confidence: number;
      reason: string;
      cascade_level?: number;
      triggered_by?: string;
    }>;
    secondary_effects?: Array<{
      market_id: string;
      market_name: string;
      direction: string;
      magnitude_percent: number;
      timing: string;
      confidence: number;
      reason: string;
      cascade_level?: number;
      triggered_by?: string;
    }>;
    tertiary_effects?: Array<{
      market_id: string;
      market_name: string;
      direction: string;
      magnitude_percent: number;
      timing: string;
      confidence: number;
      reason: string;
      cascade_level?: number;
      triggered_by?: string;
    }>;
    market_relationships?: Array<{
      source_market: string;
      target_market: string;
      relationship_type: string;
      mechanism: string;
      time_delay?: string;
      strength?: number;
      confidence?: number;
    }>;
    arbitrage_opportunities?: Array<{
      market_id: string;
      market_name: string;
      current_implied_price: number;
      fair_value_estimate: number;
      reasoning: string;
      confidence: number;
    }>;
    contrarian_takes?: string[];
    cascade_chains?: Array<{
      chain: string;
      rationale: string;
      timeline_estimate: string;
    }>;
    market_impact_forecast?: Array<{
      market_id: string;
      market_name: string;
      direction: string;
      magnitude_percent: number;
      confidence: number;
      reason: string;
    }>;
    key_risks?: string[];
    educational_takeaway?: string;
    news_context?: {
      primary_news_source?: string;
      supporting_trends?: string[];
      relevance?: string;
    };
  };
  predictions?: any[];
}

interface PriceChange {
  id: string;
  marketName: string;
  oldPrice: number;
  newPrice: number;
  direction: 'UP' | 'DOWN';
  timestamp: Date;
}

export default function CascadeDetail() {
  const params = useParams();
  const [cascade, setCascade] = useState<Cascade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'timeline' | 'forecast'>('analysis');

  const fetchCascade = useCallback(async () => {
    try {
      const data = await getCascade(params.id as string);

      // Check for price changes if we have previous cascade data
      if (cascade?.event_data?.market_impact_forecast && data.event_data?.market_impact_forecast) {
        const changes: PriceChange[] = [];

        data.event_data.market_impact_forecast.forEach((newMarket: {
          market_id: string;
          market_name: string;
          direction: string;
          magnitude_percent: number;
          confidence: number;
        }) => {
          const oldMarket = cascade.event_data?.market_impact_forecast?.find(
            (m) => m.market_id === newMarket.market_id
          );

          if (oldMarket && oldMarket.magnitude_percent !== newMarket.magnitude_percent) {
            // Simulate price change (in real app, this would come from actual market data)
            const changePercent = Math.abs(newMarket.magnitude_percent - oldMarket.magnitude_percent);

            if (changePercent >= 5) { // Only show significant changes
              changes.push({
                id: `${newMarket.market_id}-${Date.now()}`,
                marketName: newMarket.market_name,
                oldPrice: oldMarket.magnitude_percent,
                newPrice: newMarket.magnitude_percent,
                direction: newMarket.direction as 'UP' | 'DOWN',
                timestamp: new Date()
              });
            }
          }
        });

        if (changes.length > 0) {
          setPriceChanges((prev) => [...prev, ...changes]);
        }
      }

      setCascade(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load cascade');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id, cascade]);

  // Initial load
  useEffect(() => {
    if (params.id) {
      fetchCascade();
    }
  }, [params.id]);

  // Polling for live cascades (every 30 seconds)
  useEffect(() => {
    if (!cascade || cascade.status !== 'LIVE') return;

    const interval = setInterval(() => {
      fetchCascade();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [cascade?.status, fetchCascade]);

  const handleDismissToast = useCallback((id: string) => {
    setPriceChanges((prev) => prev.filter((change) => change.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="page-container space-y-6">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card gradient-border p-6">
                <div className="h-6 w-40 skeleton rounded mb-3" />
                <div className="h-4 w-full skeleton rounded mb-2" />
                <div className="h-4 w-3/4 skeleton rounded" />
              </div>
              <div className="glass-card gradient-border p-6 h-[520px]" />
              <div className="glass-card gradient-border p-6 h-[420px]" />
            </div>
            <div className="space-y-6">
              <div className="glass-card gradient-border p-6 h-[160px]" />
              <div className="glass-card gradient-border p-6 h-[260px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cascade) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Cascade not found'}</p>
          <Link href="/" className="text-pm-blue hover:opacity-90">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-pm-blue hover:opacity-90 mb-4 inline-block">
            ← Back to Cascades
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-white neon-text">{cascade.name}</h1>
                  <LiveCascadeIndicator
                    isLive={cascade.status === 'LIVE'}
                    lastUpdate={lastUpdate}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{cascade.category}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    Severity {cascade.severity}/10
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    {cascade.event_data?.market_impact_forecast?.length || 0} markets
                  </span>
                </div>
              </div>
              <span
                className={`text-xs px-4 py-2 rounded-full font-semibold ${
                  cascade.status === 'LIVE'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                }`}
              >
                {cascade.status === 'LIVE' ? '🔴 LIVE' : '✅ RESOLVED'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg text-gray-300 flex-1">{cascade.description}</p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window?.location) {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition"
                aria-label="Copy link"
                title="Copy link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-2 2a4 4 0 01-5.656-5.656l1-1M10.172 13.828a4 4 0 010-5.656l2-2a4 4 0 115.656 5.656l-1 1" />
                </svg>
                <span className="text-sm">Share</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cascade Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="glass-card gradient-border p-2">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'analysis', label: 'Analysis' },
                  { key: 'timeline', label: 'Timeline' },
                  { key: 'forecast', label: 'Forecast' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      activeTab === (t.key as any)
                        ? 'bg-gradient-to-r from-pm-blue to-pm-teal text-slate-900 font-semibold'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Event Headline */}
            {activeTab === 'analysis' && cascade.event_data?.event_headline && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  📰 Event Summary
                </h2>
                <p className="text-gray-300">{cascade.event_data.event_headline}</p>
              </motion.div>
            )}

            {/* News Context - Shows what current events/news this cascade is based on */}
            {activeTab === 'analysis' && cascade.event_data?.news_context && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  📡 Current News Context
                </h2>
                <div className="space-y-3">
                  {cascade.event_data.news_context.primary_news_source && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Primary Source:</p>
                      <p className="text-gray-200">{cascade.event_data.news_context.primary_news_source}</p>
                    </div>
                  )}
                  {cascade.event_data.news_context.supporting_trends && cascade.event_data.news_context.supporting_trends.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Supporting Trends:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {cascade.event_data.news_context.supporting_trends.map((trend, i) => (
                          <li key={i} className="text-gray-300 text-sm">{trend}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cascade.event_data.news_context.relevance && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Why This Matters Now:</p>
                      <p className="text-gray-200 italic">{cascade.event_data.news_context.relevance}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Network Visualization removed */}

            {/* Multi-Level Analysis */}
            {activeTab === 'analysis' && (cascade.event_data?.primary_effects || cascade.event_data?.secondary_effects || cascade.event_data?.tertiary_effects) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <MultiLevelAnalysis
                  primaryEffects={cascade.event_data.primary_effects}
                  secondaryEffects={cascade.event_data.secondary_effects}
                  tertiaryEffects={cascade.event_data.tertiary_effects}
                  arbitrageOpportunities={cascade.event_data.arbitrage_opportunities}
                  contrarianTakes={cascade.event_data.contrarian_takes}
                />
              </motion.div>
            )}

            {/* Cascade Timeline */}
            {activeTab === 'timeline' && (cascade.event_data?.primary_effects || cascade.event_data?.secondary_effects || cascade.event_data?.tertiary_effects) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.225 }}
              >
                <CascadeTimeline
                  triggerEvent={cascade.event_data?.event_headline || cascade.name}
                  primaryEffects={cascade.event_data.primary_effects}
                  secondaryEffects={cascade.event_data.secondary_effects}
                  tertiaryEffects={cascade.event_data.tertiary_effects}
                />
              </motion.div>
            )}

            {/* Impact Thesis */}
            {activeTab === 'analysis' && cascade.event_data?.impact_thesis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  🧠 Impact Analysis
                </h2>
                <p className="text-gray-300 leading-relaxed">{cascade.event_data.impact_thesis}</p>
              </motion.div>
            )}

            {/* Cascade Chains */}
            {activeTab === 'analysis' && cascade.event_data?.cascade_chains && cascade.event_data.cascade_chains.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🔗 Cascade Chains
                </h2>
                <div className="space-y-4">
                  {cascade.event_data.cascade_chains.map((chain, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-cyan-400 font-mono text-sm">{chain.chain}</p>
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                          {chain.timeline_estimate}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{chain.rationale}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Market Impact Forecast */}
            {activeTab === 'forecast' && cascade.event_data?.market_impact_forecast && cascade.event_data.market_impact_forecast.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📊 Market Impact Forecast
                </h2>
                <div className="space-y-3">
                  {cascade.event_data.market_impact_forecast.map((market, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white">{market.market_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            market.direction === 'UP' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {market.direction === 'UP' ? '↑' : '↓'} {market.magnitude_percent}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{market.reason}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Confidence:</span>
                        <div className="flex-1 bg-slate-600 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pm-blue to-pm-teal"
                            style={{ width: `${market.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(market.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Key Risks */}
            {activeTab === 'analysis' && cascade.event_data?.key_risks && cascade.event_data.key_risks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  ⚠️ Key Risks
                </h2>
                <ul className="space-y-2">
                  {cascade.event_data.key_risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Educational Takeaway */}
            {activeTab === 'analysis' && cascade.event_data?.educational_takeaway && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  💡 Learning Point
                </h2>
                <p className="text-gray-300">{cascade.event_data.educational_takeaway}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Prediction & Activity */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
            {/* Cascade Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card gradient-border p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Severity</span>
                  <span className="text-white font-semibold animate-number-up">{cascade.severity}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Predictions</span>
                  <span className="text-white font-semibold animate-number-up">{cascade.predictions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Markets</span>
                  <span className="text-white font-semibold">
                    {cascade.event_data?.market_impact_forecast?.length || 0}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Prediction Input */}
            {cascade.status === 'LIVE' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <PredictionInput
                  cascadeId={cascade.id}
                  cascadeName={cascade.name}
                  markets={cascade.event_data?.market_impact_forecast}
                />
              </motion.div>
            )}

            {/* Recent Predictions */}
            {cascade.predictions && cascade.predictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-card gradient-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Recent Predictions</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cascade.predictions.map((pred: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{pred.username}</span>
                          {pred.confidence_level && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{pred.confidence_level}/5</span>
                          )}
                        </div>
                        {pred.is_correct !== null && (
                          <span className={pred.is_correct ? 'text-green-400' : 'text-red-400'}>
                            {pred.is_correct ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {pred.prediction_text || pred.guess}
                      </p>
                      {pred.created_at && (
                        <p className="text-[10px] text-gray-500 mt-1">{new Date(pred.created_at * 1000).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Price Change Toasts */}
        <PriceChangeToast changes={priceChanges} onDismiss={handleDismissToast} />
      </div>
    </div>
  );
}
