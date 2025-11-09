import { motion } from 'framer-motion';

interface DifficultyBadgeProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  size?: 'sm' | 'md' | 'lg';
}

const DIFFICULTY_COLORS = {
  beginner: {
    bg: 'bg-[#00FFC2]/10',
    border: 'border-[#00FFC2]/30',
    text: 'text-[#00FFC2]',
    glow: 'shadow-[0_0_15px_rgba(0,255,194,0.3)]',
  },
  intermediate: {
    bg: 'bg-[#2FE3FF]/10',
    border: 'border-[#2FE3FF]/30',
    text: 'text-[#2FE3FF]',
    glow: 'shadow-[0_0_15px_rgba(47,227,255,0.3)]',
  },
  advanced: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  },
  expert: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export default function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const colors = DIFFICULTY_COLORS[difficulty];

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        border ${colors.bg} ${colors.border} ${colors.text} ${SIZE_CLASSES[size]}
        ${colors.glow}
      `}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.bg} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.text.replace('text-', 'bg-')}`}></span>
      </span>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </motion.span>
  );
}
