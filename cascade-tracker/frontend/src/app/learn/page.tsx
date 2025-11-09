'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Target, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import LearningChallengeCard from '@/components/LearningChallengeCard';
import { useLearnStore } from '@/store/learnStore';
import { getLearningChallenges, getLearningProgress } from '@/services/learnApi';
import type { LearningChallenge } from '@/services/learnApi';

export default function LearnPage() {
  const router = useRouter();
  const {
    username,
    progress,
    challenges,
    selectedDifficulty,
    setUsername,
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

      // Load challenges first (always works)
      const challengesData = await getLearningChallenges({ username });
      setChallenges(challengesData);

      // Try to load progress, but it might not exist for new users
      try {
        const progressData = await getLearningProgress(username);
        setProgress(progressData);
      } catch (progressError: any) {
        // User doesn't have progress yet - that's okay
        if (progressError?.response?.status === 404) {
          console.log('New user - no progress yet');
          setProgress(null);
        } else {
          throw progressError;
        }
      }
    } catch (error) {
      console.error('Error loading learn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      setUsername(usernameInput.trim());
      setShowUsernamePrompt(false);
    }
  };

  if (showUsernamePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FE3FF]" />
      </div>
    );
  }

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((c: LearningChallenge) => c.difficulty_level === selectedDifficulty)
    : challenges;

  return (
    <div className="min-h-screen pb-20">
      <div className="page-container">
        <PageHeader
          title="Learn"
          subtitle="Master prediction markets through gamified challenges"
        />

        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="glass-card gradient-border p-4 rounded-xl"
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
              className="glass-card gradient-border p-4 rounded-xl"
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
              className="glass-card gradient-border p-4 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[#2FE3FF]" />
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
              className="glass-card gradient-border p-4 rounded-xl cursor-pointer interactive"
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
          {filteredChallenges.map((challenge: LearningChallenge) => (
            <LearningChallengeCard
              key={challenge.id}
              challenge={challenge}
              userLevel={progress?.current_level || 1}
              isLocked={!!(progress && !progress.unlocked_difficulties.includes(challenge.difficulty_level))}
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
