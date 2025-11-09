'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCascades } from '@/services/api';
import PageHeader from '@/components/PageHeader';

interface Cascade {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: number;
  status: string;
  created_at: number;
  resolved_at?: number;
  event_data?: {
    significance_score?: number;
  };
}

export default function ArchivePage() {
  const [cascades, setCascades] = useState<Cascade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'live'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCascades = async () => {
      try {
        const data = await getCascades();
        setCascades(data);
      } catch (err) {
        console.error('Failed to load cascades:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCascades();
  }, []);

  const categories = ['all', ...new Set(cascades.map(c => c.category))];

  const filteredCascades = cascades.filter(cascade => {
    const statusMatch = filter === 'all' || cascade.status.toLowerCase() === filter;
    const categoryMatch = categoryFilter === 'all' || cascade.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const sortedCascades = [...filteredCascades].sort((a, b) => {
    // Resolved cascades by resolution date, live by creation date
    if (a.resolved_at && b.resolved_at) {
      return b.resolved_at - a.resolved_at;
    }
    return b.created_at - a.created_at;
  });

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-64 skeleton rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-4 w-24 skeleton rounded mb-3" />
                <div className="h-7 w-16 skeleton rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card gradient-border p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-24 skeleton rounded" />
                  <div className="h-5 w-20 skeleton rounded-full" />
                </div>
                <div className="h-4 w-3/4 skeleton rounded mb-2" />
                <div className="h-4 w-1/2 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="page-container">
        <PageHeader
          title="Cascade Archive"
          subtitle="Browse historical cascades and analyze past market impacts"
          actions={
            <Link href="/" className="px-4 py-2 btn-primary" aria-label="Back to live cascades">
              ← Back to Live Cascades
            </Link>
          }
        />

        {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-pm-blue to-pm-teal text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                All ({cascades.length})
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'live'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Live ({cascades.filter(c => c.status === 'LIVE').length})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Resolved ({cascades.filter(c => c.status === 'RESOLVED').length})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-pm-blue outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total Cascades"
            value={cascades.length}
            icon="📊"
            color="from-purple-900/50 to-purple-800/50"
          />
          <StatsCard
            label="Live Events"
            value={cascades.filter(c => c.status === 'LIVE').length}
            icon="🔴"
            color="from-red-900/50 to-red-800/50"
          />
          <StatsCard
            label="Resolved"
            value={cascades.filter(c => c.status === 'RESOLVED').length}
            icon="✅"
            color="from-green-900/50 to-green-800/50"
          />
          <StatsCard
            label="Categories"
            value={categories.length - 1}
            icon="🏷️"
            color="from-blue-900/50 to-blue-800/50"
          />
        </div>

        {/* Cascade List */}
        {sortedCascades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No cascades found matching your filters</p>
            <button
              onClick={() => {
                setFilter('all');
                setCategoryFilter('all');
              }}
              className="text-pm-blue hover:opacity-90"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedCascades.map((cascade, idx) => (
              <CascadeCard key={cascade.id} cascade={cascade} delay={idx * 0.05} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </motion.div>
  );
}

function CascadeCard({ cascade, delay }: { cascade: Cascade; delay: number }) {
  const formattedDate = new Date(cascade.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const resolvedDate = cascade.resolved_at
    ? new Date(cascade.resolved_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={`/cascade/${cascade.id}`}>
        <div className="glass-card gradient-border p-6 transition group cursor-pointer hover:shadow-glow">
          <div className="flex items-start justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    cascade.status === 'LIVE'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}
                >
                  {cascade.status}
                </span>

                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {cascade.category}
                </span>

                <span className="text-xs text-gray-500">•</span>

                <span className="text-xs text-gray-400">
                  {formattedDate}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-pm-blue transition">
                {cascade.name}
              </h3>

              <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                {cascade.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>Severity: {cascade.severity}/10</span>
                </div>

                {cascade.event_data?.significance_score && (
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>
                      Significance: {Math.round(cascade.event_data.significance_score * 100)}%
                    </span>
                  </div>
                )}

                {resolvedDate && (
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span>Resolved: {resolvedDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-gray-400 group-hover:text-pm-blue transition">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
