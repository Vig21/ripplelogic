'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCascades } from '@/services/api';
import PageHeader from '@/components/PageHeader';

interface Cascade {
  id: string;
  name: string;
  description: string;
  status: string;
  severity: number;
  event_data?: {
    affected_market_count?: number;
  };
}

export default function CascadesPage() {
  const [cascades, setCascades] = useState<Cascade[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom cascade states
  const [customEventUrl, setCustomEventUrl] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState(false);

  const fetchCascades = async () => {
    try {
      setLoading(true);
      const data = await getCascades();
      setCascades(data);
    } catch (err) {
      setError('Failed to load cascades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCascades();
  }, []);

  const handleGenerateCascades = async () => {
    try {
      setGenerating(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/cascades/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 2
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cascades');
      }

      const result = await response.json();
      console.log('✅ Generated cascades:', result);

      // Refresh the cascade list
      await fetchCascades();

    } catch (err) {
      console.error('Error generating cascades:', err);
      setError('Failed to generate cascades. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCustomCascade = async () => {
    try {
      setCustomLoading(true);
      setCustomError(null);
      setCustomSuccess(false);

      // Validate URL format
      if (!customEventUrl.trim()) {
        setCustomError('Please enter a Polymarket event URL');
        return;
      }

      if (!customEventUrl.includes('polymarket.com/event/')) {
        setCustomError('Invalid URL format. Expected: https://polymarket.com/event/event-slug');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/cascades/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventUrl: customEventUrl.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate custom cascade');
      }

      console.log('✅ Generated custom cascade:', result);

      // Show success message
      setCustomSuccess(true);
      setCustomEventUrl(''); // Clear input

      // Refresh the cascade list
      await fetchCascades();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setCustomSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Error generating custom cascade:', err);
      setCustomError(err.message || 'Failed to generate custom cascade. Please try again.');
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="page-container">
        <PageHeader
          title="🎯 Cascade Tracker"
          subtitle="Watch market cascades explained by AI. Learn. Predict. Win."
          actions={
            <motion.button
              aria-label="Generate cascades"
              onClick={handleGenerateCascades}
              disabled={generating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 btn-primary whitespace-nowrap ${generating ? 'bg-gray-600 cursor-not-allowed' : ''}`}
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="ml-2">Generate Cascades</span>
                </>
              )}
            </motion.button>
          }
        />

        {/* Custom Cascade Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="glass-card gradient-border p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pm-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate Custom Cascade
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Paste a Polymarket event URL to generate a custom cascade analysis
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={customEventUrl}
                onChange={(e) => setCustomEventUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !customLoading) {
                    handleGenerateCustomCascade();
                  }
                }}
                placeholder="https://polymarket.com/event/super-bowl-champion-2026-731"
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-pm-blue focus:ring-2 focus:ring-pm-blue/20 outline-none text-white placeholder-gray-500 transition"
                disabled={customLoading}
              />
              <motion.button
                onClick={handleGenerateCustomCascade}
                disabled={customLoading}
                whileHover={{ scale: customLoading ? 1 : 1.05 }}
                whileTap={{ scale: customLoading ? 1 : 0.95 }}
                className={`px-6 py-3 rounded-lg font-semibold shadow-lg transition-all whitespace-nowrap
                  ${customLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pm-teal to-pm-blue hover:from-pm-teal/90 hover:to-pm-blue/90 shadow-glow'
                  }
                  text-white flex items-center gap-2`}
              >
                {customLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </motion.button>
            </div>

            {/* Error Message */}
            {customError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2"
              >
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{customError}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {customSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Custom cascade generated successfully!</span>
              </motion.div>
            )}

            {/* Help Text */}
            {!customError && !customSuccess && (
              <p className="mt-3 text-xs text-gray-500">
                💡 Tip: Find events on <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-pm-blue hover:underline">Polymarket</a> and paste the event URL above
              </p>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="glass-card gradient-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-40 rounded skeleton" />
                  <div className="h-5 w-20 rounded-full skeleton" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full rounded skeleton" />
                  <div className="h-4 w-3/4 rounded skeleton" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded skeleton" />
                  <div className="h-3 w-24 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Cascades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cascades.map((cascade, idx) => (
            <motion.div
              key={cascade.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="interactive"
            >
              <Link href={`/cascade/${cascade.id}`}>
                <div className="glass-card gradient-border p-6 cursor-pointer hover:shadow-glow transition">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                      {cascade.name}
                    </h2>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        cascade.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {cascade.status === 'LIVE' ? '🔴 LIVE' : '✅ RESOLVED'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {cascade.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>📊 {cascade.event_data?.affected_market_count || 0} markets</span>
                    <span>Severity: {cascade.severity}/10</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && !error && cascades.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No cascades available yet.</p>
            <p className="text-sm mt-2">Check back soon for new market events!</p>
          </div>
        )}
      </div>
    </div>
  );
}


