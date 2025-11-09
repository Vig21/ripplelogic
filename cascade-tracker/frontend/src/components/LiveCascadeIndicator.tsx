'use client';

import { motion } from 'framer-motion';

interface LiveCascadeIndicatorProps {
  isLive: boolean;
  lastUpdate?: Date;
}

export default function LiveCascadeIndicator({ isLive, lastUpdate }: LiveCascadeIndicatorProps) {
  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Pulsing dot indicator */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute w-4 h-4 bg-red-500 rounded-full opacity-75"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.75, 0.3, 0.75]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="w-2 h-2 bg-red-500 rounded-full z-10" />
      </div>

      {/* Live text */}
      <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
        Live
      </span>

      {/* Last update time */}
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Updated {formatTimeAgo(lastUpdate)}
        </span>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
