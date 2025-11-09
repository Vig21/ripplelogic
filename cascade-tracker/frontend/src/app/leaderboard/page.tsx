'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getLearningLeaderboard } from '@/services/learnApi';
import { useLearnStore } from '@/store/learnStore';
import PageHeader from '@/components/PageHeader';

interface LeaderboardEntry {
  user_id: string;
  current_level: number;
  experience_points: number;
  total_challenges: number;
  correct_predictions: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const { username } = useLearnStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLearningLeaderboard(20); // Top 20
        setLeaderboard(data);
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getLevelBadgeColor = (level: number) => {
    if (level >= 15) return 'bg-pm-teal/20 text-pm-teal';
    if (level >= 10) return 'bg-pm-blue/20 text-pm-blue';
    if (level >= 5) return 'bg-white/10 text-gray-300';
    return 'bg-slate-800/70 text-gray-400';
  };

  const calculateAccuracy = (correct: number, total: number) => {
    if (total === 0) return '0';
    return ((correct / total) * 100).toFixed(1);
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="page-container">
        <PageHeader
          title="🏆 Learn Leaderboard"
          subtitle="Top learners mastering prediction markets"
          actions={<Link href="/learn" className="px-4 py-2 btn-primary">← Back to Learn</Link>}
        />

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-64 skeleton rounded" />
            <div className="glass-card gradient-border overflow-hidden">
              <div className="bg-slate-900/50 px-6 py-4 grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 skeleton rounded" />
                ))}
              </div>
              <div className="divide-y divide-slate-700/50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 grid grid-cols-7 gap-4">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <div key={j} className={`h-4 ${j === 1 ? 'w-24' : 'w-14'} skeleton rounded`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card gradient-border overflow-hidden"
          >
            {/* Table Header */}
            <div className="bg-slate-900/50 px-6 py-4 grid grid-cols-6 gap-4 text-sm font-semibold text-gray-400 border-b border-white/10">
              <div className="col-span-1">Rank</div>
              <div className="col-span-2">Player</div>
              <div className="col-span-1 text-center">Level</div>
              <div className="col-span-1 text-center">XP</div>
              <div className="col-span-1 text-center">Accuracy</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-700/50">
              {leaderboard.map((entry, idx) => {
                const rank = entry.rank || idx + 1;
                const accuracy = calculateAccuracy(entry.correct_predictions, entry.total_challenges);
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`px-6 py-4 grid grid-cols-6 gap-4 items-center hover:bg-white/5 transition ${
                      username === entry.user_id ? 'bg-white/5 border-l-4 border-pm-blue' : ''
                    } ${rank <= 3 ? 'relative after:absolute after:inset-0 after:pointer-events-none after:rounded-lg after:shadow-glow' : ''}`}
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      <span className={`text-2xl ${rank <= 3 ? '' : 'text-gray-400 text-lg'}`}>
                        {getRankMedal(rank)}
                      </span>
                    </div>

                    {/* Player Name */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gradient-border flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-slate-700/60 flex items-center justify-center text-[11px]">
                            {entry.user_id.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <span className="font-semibold text-white">
                          {entry.user_id}
                          {username === entry.user_id && (
                            <span className="ml-2 text-xs text-pm-blue">(You)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Level */}
                    <div className="col-span-1 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getLevelBadgeColor(entry.current_level)}`}>
                        Lvl {entry.current_level}
                      </span>
                    </div>

                    {/* XP */}
                    <div className="col-span-1 text-center">
                      <span className="text-cyan-400 font-bold">{entry.experience_points}</span>
                    </div>

                    {/* Accuracy */}
                    <div className="col-span-1 text-center">
                      <span className={`font-semibold ${
                        parseFloat(accuracy) >= 70 ? 'text-green-400' :
                        parseFloat(accuracy) >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {accuracy}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && leaderboard.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No learners yet!</p>
            <p className="text-sm mt-2">Be the first to complete challenges and climb the leaderboard!</p>
            <Link
              href="/learn"
              className="mt-4 inline-block btn-primary py-2 px-6 rounded-lg"
            >
              Start Learning
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="glass-card gradient-border p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Total Players</h3>
              <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
            </div>

            <div className="glass-card gradient-border p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Total Challenges</h3>
              <p className="text-3xl font-bold text-white">
                {leaderboard.reduce((sum, entry) => sum + entry.total_challenges, 0)}
              </p>
            </div>

            <div className="glass-card gradient-border p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Avg Accuracy</h3>
              <p className="text-3xl font-bold text-white">
                {leaderboard.length > 0
                  ? (
                      leaderboard.reduce((sum, entry) => {
                        const acc = calculateAccuracy(entry.correct_predictions, entry.total_challenges);
                        return sum + parseFloat(acc);
                      }, 0) / leaderboard.length
                    ).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
