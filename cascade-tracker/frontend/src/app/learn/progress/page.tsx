'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLearnStore } from '@/store/learnStore';
import { getLearningProgress, getUserPredictions, getAllBadges } from '@/services/learnApi';
import type { LearningProgress, LearningPrediction, Badge } from '@/services/learnApi';
import { Trophy, Target, TrendingUp, Award, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function ProgressPage() {
  const { username } = useLearnStore();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [predictions, setPredictions] = useState<LearningPrediction[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [username]);

  const loadProgressData = async () => {
    if (!username) return;

    setLoading(true);
    try {
      const [progressData, predictionsData, badgesData] = await Promise.all([
        getLearningProgress(username),
        getUserPredictions(username),
        getAllBadges()
      ]);

      setProgress(progressData);
      setPredictions(predictionsData);
      setAllBadges(badgesData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-400">Please enter a username to view progress</p>
          <Link href="/learn" className="mt-4 inline-block text-pm-blue hover:opacity-90">
            Go to Learn
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading progress...</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-400">No progress data found</p>
          <Link href="/learn" className="mt-4 inline-block text-pm-blue hover:opacity-90">
            Start Learning
          </Link>
        </div>
      </div>
    );
  }

  const accuracy = progress.total_challenges > 0
    ? ((progress.correct_predictions / progress.total_challenges) * 100).toFixed(1)
    : '0';

  const getLevelColor = (level: number) => {
    if (level >= 15) return 'from-purple-500 to-pink-500';
    if (level >= 10) return 'from-blue-500 to-cyan-500';
    if (level >= 5) return 'from-green-500 to-emerald-500';
    return 'from-gray-500 to-slate-500';
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return 'text-green-400';
    if (acc >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen">
      <div className="page-container">
        {/* Header */}
        <div className="mb-2">
          <Link href="/learn" className="text-pm-blue hover:opacity-90 mb-2 inline-block">
            ← Back to Challenges
          </Link>
        </div>
        <PageHeader
          title="Your Progress"
          subtitle={<>Track your learning journey, <span className="text-pm-blue font-semibold">{username}</span></>}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card gradient-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h3 className="text-sm text-gray-400">Level</h3>
            </div>
            <p className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getLevelColor(progress.current_level)}`}>
              {progress.current_level}
            </p>
            <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getLevelColor(progress.current_level)} transition-all duration-500`}
                style={{
                  width: progress.next_level_xp
                    ? `${Math.min(100, ((progress.experience_points / progress.next_level_xp) * 100))}%`
                    : '100%'
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress.experience_points} / {progress.next_level_xp || 'MAX'} XP
              {progress.xp_to_next_level && progress.xp_to_next_level > 0 && (
                <span className="ml-2 text-cyan-400">({progress.xp_to_next_level} to next level)</span>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card gradient-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-cyan-400" />
              <h3 className="text-sm text-gray-400">Accuracy</h3>
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(parseFloat(accuracy))}`}>
              {accuracy}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {progress.correct_predictions}/{progress.total_challenges} correct
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card gradient-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-sm text-gray-400">Current Streak</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {progress.current_streak}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Best: {progress.best_streak}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card gradient-border p-6 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-purple-400" />
              <h3 className="text-sm text-gray-400">Badges</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {progress.badges_earned.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {allBadges.length} available
            </p>
          </motion.div>
        </div>

        {/* Skill Scores */}
        {Object.keys(progress.skill_scores).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card gradient-border p-6 rounded-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-pm-blue" />
              Skill Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(progress.skill_scores).map(([category, scores]) => (
                <div key={category} className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white capitalize mb-2">
                    {category}
                  </h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Accuracy</span>
                    <span className={`text-sm font-bold ${getAccuracyColor(scores.accuracy)}`}>
                      {scores.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pm-blue to-pm-teal transition-all duration-500"
                      style={{ width: `${scores.accuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {scores.correct}/{scores.total} challenges
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {progress.badges_earned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card gradient-border p-6 rounded-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-400" />
              Earned Badges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.badges_earned.map((badge) => (
                <div key={badge.id} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🏆</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{badge.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{badge.teaches}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Earned {new Date(badge.earned_at * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card gradient-border p-6 rounded-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pm-blue" />
            Prediction History
          </h2>
          {predictions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No predictions yet. Start learning!</p>
          ) : (
            <div className="space-y-3">
              {predictions.slice(0, 10).map((prediction) => (
                <div key={prediction.id} className="bg-slate-800/50 rounded-lg p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{prediction.challenge_title || 'Challenge'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-400">
                        Predicted: <span className={prediction.predicted_outcome === 'yes' ? 'text-green-400' : 'text-red-400'}>
                          {prediction.predicted_outcome.toUpperCase()}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        Confidence: <span className="text-cyan-400">{prediction.confidence_level}/5</span>
                      </span>
                      {prediction.category && (
                        <span className="px-2 py-1 bg-pm-blue/20 text-pm-blue text-xs rounded">
                          {prediction.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(prediction.created_at * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {prediction.is_correct === 1 ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <span className="text-green-400 font-bold">+{prediction.points_earned} XP</span>
                      </>
                    ) : prediction.is_correct === 0 ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
