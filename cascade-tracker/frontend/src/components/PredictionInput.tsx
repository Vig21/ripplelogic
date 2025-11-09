'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitPrediction } from '@/services/api';
import { useCascadeStore } from '@/store/cascadeStore';

interface PredictionInputProps {
  cascadeId: string;
  cascadeName: string;
  markets?: Array<{
    market_id: string;
    market_name: string;
    direction?: string;
  }>;
}

export default function PredictionInput({ cascadeId, cascadeName, markets = [] }: PredictionInputProps) {
  const { user, setUser, updateScore } = useCascadeStore();
  const [prediction, setPrediction] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [confidence, setConfidence] = useState(0.5);
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(user ? 2 : 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!prediction.trim() || !username.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const userId = user?.id || `user_${Date.now()}`;

      const response = await submitPrediction({
        cascadeId,
        userId,
        username: username.trim(),
        prediction: prediction.trim(),
        market: selectedMarket || markets[0]?.market_id || 'general',
        confidence,
      });

      // Update user if new
      if (!user) {
        setUser({
          id: userId,
          username: username.trim(),
          score: 0,
          streak: 0,
          predictions_total: 0,
          predictions_correct: 0,
        });
      }

      setResult(response);
      setPrediction('');

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit prediction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card gradient-border p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        🎯 Make Your Prediction
      </h2>

      {/* Progress */}
      <div className="mb-4">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pm-blue to-pm-teal transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-gray-400">
          <span className={step >= 1 ? 'text-purple-300' : ''}>Setup</span>
          <span className={step >= 2 ? 'text-purple-300' : ''}>Prediction</span>
          <span className={step >= 3 ? 'text-purple-300' : ''}>Confidence</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            {!user && (
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-pm-blue text-white"
                  required
                />
              </div>
            )}

            {markets.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Market</label>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-pm-blue text-white"
                >
                  <option value="">General Prediction</option>
                  {markets.map((market) => (
                    <option key={market.market_id} value={market.market_id}>
                      {market.market_name} {market.direction && `(${market.direction})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-medium mb-2">Your Prediction</label>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder={`What do you predict will happen after "${cascadeName}"?`}
              rows={4}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-pm-blue text-white resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Be specific about your prediction and reasoning
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence: <span className="text-purple-400">{Math.round(confidence * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${confidence * 100}%, #475569 ${confidence * 100}%, #475569 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition disabled:opacity-50"
            disabled={step === 1 || loading}
          >
            ← Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !user && !username.trim()) return;
                if (step === 2 && !prediction.trim()) return;
                setStep((s) => Math.min(3, s + 1));
              }}
              className="px-5 py-2 bg-gradient-to-r from-pm-blue to-pm-teal text-white font-semibold rounded-lg hover:from-pm-blue/90 hover:to-pm-teal/90 transition"
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-pm-blue to-pm-teal text-white font-semibold rounded-lg hover:from-pm-blue/90 hover:to-pm-teal/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Submit Prediction'}
            </button>
          )}
        </div>
      </form>

      {/* Success Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <h3 className="font-semibold text-green-400 mb-2">✅ Prediction Submitted!</h3>

          {result.scoring && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">AI Likelihood:</span>
                <span className="text-white font-semibold">
                  {result.scoring.prediction_likelihood_percent}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Confidence Level:</span>
                <span className="text-purple-400 font-semibold uppercase">
                  {result.scoring.confidence}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Potential Points:</span>
                <span className="text-cyan-400 font-semibold">
                  {result.scoring.points_if_correct}
                </span>
              </div>

              {result.scoring.rationale && (
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-gray-300 text-xs italic">
                    "{result.scoring.rationale}"
                  </p>
                </div>
              )}

              {result.scoring.confirmation_signals && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">Watch for:</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {result.scoring.confirmation_signals.slice(0, 2).map((signal: string, idx: number) => (
                      <li key={idx}>✓ {signal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result.leaderboard && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <p className="text-xs text-gray-400">
                Your Rank: <span className="text-white font-semibold">#{result.leaderboard.rank}</span>
                {' • '}
                Score: <span className="text-cyan-400 font-semibold">{result.leaderboard.score}</span>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
