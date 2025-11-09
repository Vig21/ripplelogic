'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DifficultyBadge from '@/components/DifficultyBadge';
import EducationalContent from '@/components/EducationalContent';
import PredictionForm from '@/components/PredictionForm';
import { useLearnStore } from '@/store/learnStore';
import {
  getLearningChallenge,
  submitLearningPrediction,
  getUserPredictions,
  type LearningChallenge as Challenge
} from '@/services/learnApi';

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const { username, addPrediction } = useLearnStore();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    feedback: any;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!username) {
      router.push('/learn');
      return;
    }

    loadChallenge();
    checkExistingPrediction();
  }, [challengeId, username]);

  const loadChallenge = async () => {
    try {
      const data = await getLearningChallenge(challengeId);
      setChallenge(data.challenge);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPrediction = async () => {
    if (!username) return;

    try {
      const predictions = await getUserPredictions(username);
      const existing = predictions.find((p) => p.challenge_id === challengeId);
      if (existing) {
        setHasSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking predictions:', error);
    }
  };

  const handleSubmit = async (data: {
    predictedOutcome: 'yes' | 'no';
    confidenceLevel: number;
    reasoning?: string;
  }) => {
    if (!username) return;

    try {
      const response: any = await submitLearningPrediction({
        username,
        challengeId,
        predictedOutcome: data.predictedOutcome,
        confidenceLevel: data.confidenceLevel,
        reasoning: data.reasoning
      });

      addPrediction(response.prediction);
      setHasSubmitted(true);

      // Show immediate result since this is educational
      setResult({
        isCorrect: response.isCorrect,
        pointsEarned: response.pointsEarned,
        feedback: response.feedback,
        message: response.message
      });
    } catch (error: any) {
      console.error('Error submitting prediction:', error);
      alert(error.response?.data?.error || 'Failed to submit prediction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FE3FF]" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Challenge not found</p>
          <button
            onClick={() => router.push('/learn')}
            className="px-6 py-3 bg-[#2FE3FF]/20 border border-[#2FE3FF] text-[#2FE3FF] rounded-xl hover:bg-[#2FE3FF]/30 transition-colors"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  const yesPercentage = stats?.total_predictions > 0
    ? Math.round((stats.yes_count / stats.total_predictions) * 100)
    : 50;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Learning Challenge"
        subtitle="Learn, predict, and grow your market analysis skills"
      />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/learn')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Challenges
        </button>

        {/* Challenge Header */}
        <motion.div
          className="glass-card gradient-border p-6 rounded-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <DifficultyBadge difficulty={challenge.difficulty_level} size="lg" />
              <span className="ml-3 text-sm text-gray-400">{challenge.category}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                challenge.status === 'active'
                  ? 'bg-[#00FFC2]/20 text-[#00FFC2]'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {challenge.status.toUpperCase()}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">{challenge.market_question}</h1>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#2FE3FF]" />
              <div>
                <p className="text-xs text-gray-400">Volume</p>
                <p className="text-sm font-semibold text-white">
                  ${(challenge.market_data.volume / 1000).toFixed(1)}K
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Users className="w-5 h-5 text-[#00FFC2]" />
              <div>
                <p className="text-xs text-gray-400">Predictions</p>
                <p className="text-sm font-semibold text-white">{stats?.total_predictions || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
              <Clock className="w-5 h-5 text-[#2FE3FF]" />
              <div>
                <p className="text-xs text-gray-400">Current Odds</p>
                <p className="text-sm font-semibold text-white">
                  {Array.isArray(challenge.market_data.current_odds)
                    ? `${challenge.market_data.current_odds[0]}% YES`
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Community Sentiment */}
          {stats && stats.total_predictions > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Community Predictions</p>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#00FFC2] transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${100 - yesPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{yesPercentage}% YES</span>
                <span>{100 - yesPercentage}% NO</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Educational Content */}
        {challenge.educational_content && (
          <div className="mb-6">
            <EducationalContent content={challenge.educational_content} />
          </div>
        )}

        {/* Prediction Form or Result */}
        {challenge.status === 'resolved' && !hasSubmitted ? (
          <PredictionForm challengeId={challengeId} onSubmit={handleSubmit} />
        ) : hasSubmitted && result ? (
          <motion.div
            className={`glass-card gradient-border p-8 rounded-xl ${
              result.isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <div className={`w-20 h-20 ${
                result.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
              } rounded-full flex items-center justify-center mx-auto mb-4`}>
                {result.isCorrect ? (
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                result.isCorrect ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.isCorrect ? '🎉 Correct!' : '❌ Not Quite'}
              </h3>
              <p className="text-xl text-white mb-4">{result.message}</p>
              {result.isCorrect && (
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-pm-blue to-pm-teal rounded-lg">
                  <span className="text-2xl font-bold text-white">+{result.pointsEarned} XP</span>
                </div>
              )}
            </div>

            {/* Detailed Feedback */}
            {result.feedback && (
              <div className="space-y-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pm-blue mb-2">📊 Explanation</h4>
                  <p className="text-gray-300">{result.feedback.explanation}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pm-blue mb-2">🎯 Key Signal</h4>
                  <p className="text-gray-300">{result.feedback.key_signal}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pm-blue mb-2">📚 Lesson</h4>
                  <p className="text-gray-300">{result.feedback.lesson}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pm-blue mb-2">💪 Encouragement</h4>
                  <p className="text-gray-300">{result.feedback.encouragement}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pm-blue mb-2">🚀 Next Steps</h4>
                  <p className="text-gray-300">{result.feedback.next_steps}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/learn')}
                className="px-6 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-xl font-semibold hover:bg-slate-600/50 transition-all"
              >
                More Challenges
              </button>
              <button
                onClick={() => router.push('/learn/progress')}
                className="px-6 py-3 bg-gradient-to-r from-pm-blue to-pm-teal text-white rounded-xl font-semibold hover:shadow-glow transition-all"
              >
                View Progress
              </button>
            </div>
          </motion.div>
        ) : hasSubmitted ? (
          <motion.div
            className="glass-card gradient-border p-8 rounded-xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-bold text-white mb-2">Already Submitted</h3>
            <p className="text-gray-400 mb-6">You've already answered this challenge.</p>
            <button
              onClick={() => router.push('/learn/progress')}
              className="px-6 py-3 bg-gradient-to-r from-pm-blue to-pm-teal text-white rounded-xl font-semibold hover:shadow-glow transition-all"
            >
              View Progress
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="glass-card gradient-border p-8 rounded-xl text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-400">This challenge is no longer active.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
