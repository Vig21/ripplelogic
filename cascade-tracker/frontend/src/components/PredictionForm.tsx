'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface PredictionFormProps {
  challengeId: string;
  onSubmit: (prediction: {
    predictedOutcome: 'yes' | 'no';
    confidenceLevel: number;
    reasoning?: string;
  }) => void;
  disabled?: boolean;
}

export default function PredictionForm({ challengeId, onSubmit, disabled }: PredictionFormProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [reasoning, setReasoning] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) return;

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    onSubmit({
      predictedOutcome: selectedOutcome,
      confidenceLevel: confidence,
      reasoning: reasoning.trim() || undefined,
    });
  };

  const confidenceLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Outcome Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Your Prediction
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedOutcome('yes');
              setShowConfirm(false);
            }}
            disabled={disabled}
            className={`
              p-6 rounded-xl border-2 transition-all
              ${selectedOutcome === 'yes'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${selectedOutcome === 'yes' ? 'text-green-500' : 'text-gray-400'}`} />
            <div className="text-lg font-semibold text-white">YES</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedOutcome('no');
              setShowConfirm(false);
            }}
            disabled={disabled}
            className={`
              p-6 rounded-xl border-2 transition-all
              ${selectedOutcome === 'no'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${selectedOutcome === 'no' ? 'text-red-500' : 'text-gray-400'}`} />
            <div className="text-lg font-semibold text-white">NO</div>
          </button>
        </div>
      </div>

      {/* Confidence Slider */}
      {selectedOutcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="block text-sm font-medium text-gray-300">
            Confidence Level: {confidenceLabels[confidence - 1]}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => {
              setConfidence(parseInt(e.target.value));
              setShowConfirm(false);
            }}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #2FE3FF 0%, #2FE3FF ${(confidence - 1) * 25}%, #374151 ${(confidence - 1) * 25}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            {confidenceLabels.map((label, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Optional Reasoning */}
      {selectedOutcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reasoning (Optional)
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => {
              setReasoning(e.target.value);
              setShowConfirm(false);
            }}
            disabled={disabled}
            placeholder="Explain your prediction..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2FE3FF] resize-none"
          />
        </motion.div>
      )}

      {/* Confirmation Warning */}
      {showConfirm && selectedOutcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-1">Lock in your prediction?</p>
            <p className="text-yellow-300/80">
              Once submitted, you cannot change your answer. Click submit again to confirm.
            </p>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!selectedOutcome || disabled}
        className={`
          w-full px-6 py-4 rounded-xl font-semibold text-lg transition-all
          ${selectedOutcome && !disabled
            ? 'bg-gradient-to-r from-[#2FE3FF] to-[#00FFC2] text-[#0B1220] hover:shadow-glow'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {showConfirm ? 'Confirm & Lock In' : 'Submit Prediction'}
      </button>
    </form>
  );
}
