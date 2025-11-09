'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PriceChange {
  id: string;
  marketName: string;
  oldPrice: number;
  newPrice: number;
  direction: 'UP' | 'DOWN';
  timestamp: Date;
}

interface PriceChangeToastProps {
  changes: PriceChange[];
  onDismiss: (id: string) => void;
}

export default function PriceChangeToast({ changes, onDismiss }: PriceChangeToastProps) {
  return (
    <div className="fixed bottom-24 right-6 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {changes.map((change) => (
          <ToastItem key={change.id} change={change} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ change, onDismiss }: { change: PriceChange; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(change.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [change.id, onDismiss]);

  if (!isVisible) return null;

  const priceChange = ((change.newPrice - change.oldPrice) / change.oldPrice) * 100;
  const isIncrease = change.direction === 'UP';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`bg-gradient-to-r ${
        isIncrease
          ? 'from-green-900/90 to-green-800/90 border-green-500/50'
          : 'from-red-900/90 to-red-800/90 border-red-500/50'
      } backdrop-blur-sm border rounded-lg p-4 shadow-xl`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">
              {isIncrease ? '📈' : '📉'}
            </span>
            <h4 className="font-semibold text-white text-sm">
              Price Movement
            </h4>
          </div>

          <p className="text-xs text-gray-300 mb-2 line-clamp-2">
            {change.marketName}
          </p>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">
              {change.oldPrice}% → {change.newPrice}%
            </span>
            <span className={`font-bold ${isIncrease ? 'text-green-400' : 'text-red-400'}`}>
              {isIncrease ? '+' : ''}{priceChange.toFixed(1)}%
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(change.id), 300);
          }}
          className="text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
