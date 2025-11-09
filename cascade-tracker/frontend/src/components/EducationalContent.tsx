'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, Lightbulb, History, Target } from 'lucide-react';

interface EducationalContentProps {
  content: {
    market_context: string;
    key_factors: string[];
    historical_precedents: string;
    analysis_framework: string;
    learning_objectives: string[];
  };
}

export default function EducationalContent({ content }: EducationalContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['context']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: 'context',
      title: 'Market Context',
      icon: BookOpen,
      content: content.market_context,
      color: '#2FE3FF'
    },
    {
      id: 'factors',
      title: 'Key Factors',
      icon: Target,
      content: content.key_factors,
      color: '#00FFC2',
      isList: true
    },
    {
      id: 'history',
      title: 'Historical Precedents',
      icon: History,
      content: content.historical_precedents,
      color: '#2FE3FF'
    },
    {
      id: 'framework',
      title: 'Analysis Framework',
      icon: Lightbulb,
      content: content.analysis_framework,
      color: '#FBBF24'
    },
  ];

  return (
    <div className="glass-card p-6 rounded-xl space-y-4">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-[#2FE3FF]" />
        Learn Before You Predict
      </h3>

      {sections.map((section) => {
        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);

        return (
          <motion.div
            key={section.id}
            className="border border-white/10 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" style={{ color: section.color }} />
                <span className="font-semibold text-white">{section.title}</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-4 bg-gray-900/30">
                    {section.isList ? (
                      <ul className="space-y-2">
                        {(section.content as string[]).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-300">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: section.color }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-300 leading-relaxed">{section.content as string}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Learning Objectives */}
      <div className="mt-6 p-4 bg-[#2FE3FF]/5 border border-[#2FE3FF]/20 rounded-xl">
        <h4 className="text-sm font-semibold text-[#2FE3FF] mb-2">
          What You'll Learn:
        </h4>
        <ul className="space-y-1">
          {content.learning_objectives.map((objective, idx) => (
            <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#2FE3FF]" />
              {objective}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
