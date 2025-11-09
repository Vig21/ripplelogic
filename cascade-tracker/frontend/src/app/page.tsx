'use client';

import React from 'react'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCascades } from '@/services/api';

interface CascadePreview {
  id: string;
  name: string;
  description: string;
  status: string;
  event_data?: {
    affected_market_count?: number;
  };
}

export default function HomeLanding() {
  const [latest, setLatest] = useState<CascadePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCascades(4);
        setLatest(data);
      } catch (e) {
        // ignore preview errors on landing
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative">
        <div className="page-container">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300/90 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1 mb-4">
                <span>LIVE AI ANALYSIS</span>
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pm-blue to-pm-teal">
                  Learn prediction markets
                </span>{' '}
                through real-time cascades.
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
                Learn the logic that moves the market.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/cascades"
                  className="px-6 py-3 btn-primary"
                >
                  Explore Cascades
                </Link>
                <Link
                  href="/learn"
                  className="px-6 py-3 btn-ghost"
                >
                  Start Learning
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-6 py-3 btn-ghost"
                >
                  View Leaderboard
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={
              <svg className="w-6 h-6 text-pm-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M3 9h18M3 15h18M3 21h18" />
              </svg>
            }
            title="Real-time cascades"
            desc="See how information ripples through markets with AI narrative and context."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6 text-pm-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7" />
              </svg>
            }
            title="Interactive learning"
            desc="Bite-sized challenges to master catalysts, catalyst chains, and risk."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 0 0118 0z" />
              </svg>
            }
            title="Compete and improve"
            desc="Track your progress and climb the leaderboard as you learn."
          />
        </div>
      </section>

      {/* Live Now Preview */}
      <section className="page-container px-4 sm:px-6 md:px-8 lg:px-10 mt-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">Live now</h2>
          <Link href="/cascades" className="text-sm text-pm-blue hover:underline">See all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="glass-card gradient-border p-6">
                <div className="h-6 w-40 rounded skeleton mb-3" />
                <div className="h-4 w-5/6 rounded skeleton mb-2" />
                <div className="h-4 w-1/2 rounded skeleton" />
              </div>
            ))
          ) : latest.map((c) => (
            <Link key={c.id} href={`/cascade/${c.id}`} className="interactive group">
              <div className="glass-card gradient-border p-5 md:p-6 hover:shadow-glow transition min-h-[140px]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white">{c.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-800/60 border border-white/10 text-gray-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      c.status === 'LIVE' ? 'bg-red-400 animate-pulse' : 'bg-green-400'
                    }`} />
                    {c.status === 'LIVE' ? 'Live' : 'Resolved'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{c.description}</p>
                <div className="mt-3 text-xs text-gray-500">
                  📊 {c.event_data?.affected_market_count || 0} markets affected
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="page-container px-4 sm:px-6 md:px-8 lg:px-10 mt-16">
        <h2 className="text-2xl font-bold mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard step="1" title="Watch" desc="Follow AI narrated cascades as information spreads through markets." />
          <StepCard step="2" title="Practice" desc="Take learning challenges to build instincts and decision speed." />
          <StepCard step="3" title="Track" desc="See your progress on the leaderboard and refine your edge." />
        </div>
      </section>

      {/* CTA */}
      <section className="page-container px-4 sm:px-6 md:px-8 lg:px-10 mt-16 mb-8">
        <div className="glass-card gradient-border p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold">Ready to learn markets the fun way?</h3>
            <p className="text-gray-300 mt-1">Jump into cascades or start a guided challenge.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/cascades" className="px-6 py-3 btn-primary">Explore Cascades</Link>
            <Link href="/learn" className="px-6 py-3 btn-ghost">Start Learning</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass-card gradient-border p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-300 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="glass-card gradient-border p-6">
      <div className="flex items-start gap-4">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pm-blue to-pm-teal flex items-center justify-center text-slate-900 font-extrabold">
          {step}
        </div>
        <div>
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="text-sm text-gray-300 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}
