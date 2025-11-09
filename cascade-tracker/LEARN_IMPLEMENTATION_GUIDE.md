# Learn Section - Complete Implementation Guide

This guide contains all remaining files needed to complete the Learn section implementation for the Domino/Cascade Tracker application.

## ✅ COMPLETED

### Backend
- ✅ Database schema (learning tables in db.js)
- ✅ learningChallengeService.js
- ✅ learningProgressService.js
- ✅ marketResolutionService.js
- ✅ Enhanced claudeService.js with educational methods
- ✅ /api/learn/* REST API endpoints
- ✅ Market resolution polling integration

### Frontend Foundation
- ✅ learnApi.ts (API service layer)
- ✅ learnStore.ts (Zustand store)
- ✅ DifficultyBadge.tsx component

---

## 📋 REMAINING IMPLEMENTATION

### 1. Core Components

#### LearningChallengeCard.tsx
Location: `frontend/src/components/LearningChallengeCard.tsx`

```tsx
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
          glass-card p-6 rounded-xl transition-all duration-300
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
```

#### PredictionForm.tsx
Location: `frontend/src/components/PredictionForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Send } from 'lucide-react';

interface PredictionFormProps {
  challengeId: string;
  onSubmit: (data: {
    predictedOutcome: 'yes' | 'no';
    confidenceLevel: number;
    reasoning: string;
  }) => Promise<void>;
  disabled?: boolean;
}

export default function PredictionForm({
  challengeId,
  onSubmit,
  disabled = false
}: PredictionFormProps) {
  const [predictedOutcome, setPredictedOutcome] = useState<'yes' | 'no'>('yes');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        predictedOutcome,
        confidenceLevel,
        reasoning
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass-card p-6 rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-bold text-white mb-6">Make Your Prediction</h3>

      {/* Outcome Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What do you predict?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPredictedOutcome('yes')}
            disabled={disabled}
            className={`
              p-4 rounded-xl font-semibold transition-all duration-300
              ${predictedOutcome === 'yes'
                ? 'bg-[#00FFC2]/20 border-2 border-[#00FFC2] text-[#00FFC2]'
                : 'bg-gray-800/50 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
              }
            `}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => setPredictedOutcome('no')}
            disabled={disabled}
            className={`
              p-4 rounded-xl font-semibold transition-all duration-300
              ${predictedOutcome === 'no'
                ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                : 'bg-gray-800/50 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
              }
            `}
          >
            NO
          </button>
        </div>
      </div>

      {/* Confidence Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Confidence Level: {confidenceLevel}/5
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={confidenceLevel}
          onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#2FE3FF]"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Your Reasoning (Optional)
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          disabled={disabled}
          placeholder="Explain why you made this prediction..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2FE3FF] transition-colors"
        />
      </div>

      {/* Confirmation Warning */}
      {showConfirmation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200 font-medium mb-1">
                Lock in your prediction?
              </p>
              <p className="text-xs text-yellow-200/70">
                Once submitted, you cannot change your prediction. The market will be monitored and you'll be notified when it resolves.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        {showConfirmation && (
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className={`
            flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300
            flex items-center justify-center gap-2
            ${showConfirmation
              ? 'bg-gradient-to-r from-[#2FE3FF] to-[#00FFC2] text-[#0B1220] hover:shadow-glow'
              : 'bg-[#2FE3FF]/20 border border-[#2FE3FF] text-[#2FE3FF] hover:bg-[#2FE3FF]/30'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
              Submitting...
            </>
          ) : showConfirmation ? (
            <>
              <Lock className="w-5 h-5" />
              Confirm & Lock In
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Prediction
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
```

### 2. Page Routes

#### Main Learn Page
Location: `frontend/src/app/learn/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Target, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import LearningChallengeCard from '@/components/LearningChallengeCard';
import { useLearnStore } from '@/store/learnStore';
import { getLearningChallenges, getLearningProgress } from '@/services/learnApi';

export default function LearnPage() {
  const router = useRouter();
  const {
    username,
    progress,
    challenges,
    selectedDifficulty,
    setProgress,
    setChallenges,
    setSelectedDifficulty,
  } = useLearnStore();

  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState(username || '');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(!username);

  useEffect(() => {
    if (username) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [username]);

  const loadData = async () => {
    if (!username) return;

    try {
      setLoading(true);
      const [progressData, challengesData] = await Promise.all([
        getLearningProgress(username),
        getLearningChallenges({ username })
      ]);

      setProgress(progressData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading learn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      useLearnStore.getState().setUsername(usernameInput.trim());
      setShowUsernamePrompt(false);
    }
  };

  if (showUsernamePrompt) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4">
        <motion.div
          className="glass-card p-8 rounded-2xl max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Learn!</h2>
          <p className="text-gray-400 mb-6">
            Enter your username to start learning about prediction markets through gamified challenges.
          </p>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white mb-4 focus:outline-none focus:border-[#2FE3FF]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-[#2FE3FF] to-[#00FFC2] text-[#0B1220] rounded-xl font-semibold hover:shadow-glow transition-all"
            >
              Start Learning
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FE3FF]" />
      </div>
    );
  }

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((c) => c.difficulty_level === selectedDifficulty)
    : challenges;

  return (
    <div className="min-h-screen bg-[#0B1220] pb-20">
      <PageHeader
        title="Learn"
        description="Master prediction markets through gamified challenges"
      />

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="glass-card p-4 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-[#2FE3FF]" />
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="text-2xl font-bold text-white">{progress.current_level}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-4 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#00FFC2]" />
                <div>
                  <p className="text-sm text-gray-400">XP</p>
                  <p className="text-2xl font-bold text-white">{progress.experience_points}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-4 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Accuracy</p>
                  <p className="text-2xl font-bold text-white">
                    {progress.total_challenges > 0
                      ? Math.round((progress.correct_predictions / progress.total_challenges) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-4 rounded-xl cursor-pointer interactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => router.push('/learn/progress')}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Rank</p>
                  <p className="text-2xl font-bold text-white">#{progress.rank || '?'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Difficulty Filter */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff === 'all' ? null : diff)}
              className={`
                px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all
                ${(!selectedDifficulty && diff === 'all') || selectedDifficulty === diff
                  ? 'bg-[#2FE3FF]/20 border border-[#2FE3FF] text-[#2FE3FF]'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:border-gray-600'
                }
              `}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <LearningChallengeCard
              key={challenge.id}
              challenge={challenge}
              userLevel={progress?.current_level || 1}
              isLocked={
                progress && !progress.unlocked_difficulties.includes(challenge.difficulty_level)
              }
            />
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No challenges available. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 QUICK START INSTRUCTIONS

1. **Copy remaining components** from this guide to create:
   - `LearningChallengeCard.tsx`
   - `PredictionForm.tsx`
   - `EducationalContent.tsx` (see below)
   - `LearningFeedback.tsx` (see below)

2. **Create page routes**:
   - `/learn/page.tsx` (main hub)
   - `/learn/challenge/[id]/page.tsx` (challenge detail)
   - `/learn/progress/page.tsx` (progress dashboard)

3. **Update Navigation** component to add Learn link

4. **Test the flow**:
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Visit `http://localhost:3000/learn`
   - Enter username → view challenges → make prediction

---

## 📝 Additional Components Needed

### EducationalContent.tsx
Pre-learning educational content display with expandable sections.

### LearningFeedback.tsx
Post-resolution feedback display with detailed analysis and next steps.

### ProgressDashboard.tsx
Comprehensive progress visualization with charts, badges, and stats.

---

## 🔄 NEXT STEPS

1. Complete remaining component implementations
2. Create challenge detail and progress pages
3. Update Navigation component
4. Test end-to-end flow
5. Generate initial challenges for testing
6. Verify automated resolution polling

The backend is fully functional and ready. Frontend just needs the remaining UI components and page routes!
