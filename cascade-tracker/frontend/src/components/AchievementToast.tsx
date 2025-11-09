'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  badgeId: string;
  badgeName: string;
  teaches: string;
  icon: string;
  color: string;
  timestamp: Date;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export default function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  return (
    <div className="fixed top-24 right-6 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {achievements.map((achievement) => (
          <AchievementItem key={achievement.id} achievement={achievement} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AchievementItem({ achievement, onDismiss }: { achievement: Achievement; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(achievement.id), 300);
    }, 7000); // Show for 7 seconds

    return () => clearTimeout(timer);
  }, [achievement.id, onDismiss]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, x: 300, scale: 0.8, rotate: 5 }}
      transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
      className={`bg-gradient-to-r ${achievement.color} backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-5 shadow-2xl relative overflow-hidden`}
    >
      {/* Sparkle effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />

      <div className="flex items-start gap-4 relative">
        {/* Badge Icon */}
        <motion.div
          className="flex-shrink-0"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="text-5xl drop-shadow-lg">
            {achievement.icon}
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                Achievement Unlocked!
              </p>
              <h4 className="font-bold text-white text-lg leading-tight">
                {achievement.badgeName}
              </h4>
            </div>

            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(achievement.id), 300);
              }}
              className="text-white/60 hover:text-white transition flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-white/90 mb-3">
            {achievement.teaches}
          </p>

          {/* Progress bar animation */}
          <div className="h-1 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 7, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/20 rounded-bl-full" />
    </motion.div>
  );
}

// Badge configuration
export const BADGE_CONFIG = {
  first_prediction: {
    icon: '🎯',
    color: 'from-purple-900/95 to-purple-800/95',
    teaches: 'You\'ve made your first cascade prediction!'
  },
  streak_3: {
    icon: '🔥',
    color: 'from-orange-900/95 to-red-800/95',
    teaches: 'Three correct predictions in a row! Keep the streak going!'
  },
  streak_5: {
    icon: '⚡',
    color: 'from-yellow-900/95 to-orange-800/95',
    teaches: 'Five-prediction streak! You\'re on fire!'
  },
  perfect_score: {
    icon: '💯',
    color: 'from-green-900/95 to-emerald-800/95',
    teaches: 'Perfect score on a prediction! Direction, magnitude, and timing all correct!'
  },
  early_bird: {
    icon: '🐦',
    color: 'from-blue-900/95 to-cyan-800/95',
    teaches: 'Made a prediction within the first hour of a cascade!'
  },
  contrarian: {
    icon: '🎭',
    color: 'from-pink-900/95 to-rose-800/95',
    teaches: 'Correctly predicted against the crowd consensus!'
  },
  researcher: {
    icon: '🔬',
    color: 'from-indigo-900/95 to-purple-800/95',
    teaches: 'Asked Claude 10+ questions to research a cascade!'
  },
  portfolio_builder: {
    icon: '📈',
    color: 'from-teal-900/95 to-green-800/95',
    teaches: 'Made predictions across 5 different cascade categories!'
  },
  level_up: {
    icon: '⭐',
    color: 'from-yellow-900/95 to-amber-800/95',
    teaches: 'Leveled up! Your expertise is growing!'
  }
};
