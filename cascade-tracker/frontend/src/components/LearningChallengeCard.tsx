import { motion } from 'framer-motion';
import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';
import type { LearningChallenge } from '@/services/learnApi';
import { Lock } from 'lucide-react';

interface LearningChallengeCardProps {
  challenge: LearningChallenge;
  userLevel: number;
  isLocked?: boolean;
}

export default function LearningChallengeCard({
  challenge,
  userLevel,
  isLocked = false
}: LearningChallengeCardProps) {
  const isAccessible = userLevel >= challenge.min_user_level && !isLocked;

  return (
    <Link href={isAccessible ? `/learn/challenge/${challenge.id}` : '#'}>
      <motion.div
        className={`
          glass-card gradient-border p-6 rounded-xl transition-all duration-300
          ${isAccessible ? 'interactive' : 'opacity-50 cursor-not-allowed'}
        `}
        whileHover={isAccessible ? { y: -5 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <DifficultyBadge difficulty={challenge.difficulty_level} />
            <span className="ml-3 text-xs text-gray-400">
              {challenge.category}
            </span>
          </div>
          {isLocked && (
            <Lock className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {challenge.market_question}
        </h3>

        {/* Market Data */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div>
            <span className="text-gray-500">Volume:</span>{' '}
            <span className="text-[#2FE3FF]">
              ${(challenge.market_data.volume / 1000).toFixed(1)}K
            </span>
          </div>
          {challenge.market_data.current_odds && (
            <div>
              <span className="text-gray-500">Odds:</span>{' '}
              <span className="text-[#00FFC2]">
                {Array.isArray(challenge.market_data.current_odds)
                  ? `${challenge.market_data.current_odds[0]}%`
                  : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        {challenge.status !== 'active' && (
          <div className="mt-3 text-xs text-gray-500">
            Status: {challenge.status.toUpperCase()}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
