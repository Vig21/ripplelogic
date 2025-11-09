// Semantic color system for chat message visualizations

export const chatColors = {
  // Direction indicators
  direction: {
    up: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/40',
      icon: '#22c55e',
    },
    down: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/40',
      icon: '#ef4444',
    },
    neutral: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/40',
      icon: '#9ca3af',
    },
  },

  // Confidence/probability levels
  confidence: {
    veryHigh: {
      // 80-100%
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      gradient: 'from-emerald-500 to-green-400',
    },
    high: {
      // 60-79%
      bg: 'bg-green-500/20',
      text: 'text-green-300',
      gradient: 'from-green-500 to-lime-400',
    },
    medium: {
      // 40-59%
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-300',
      gradient: 'from-yellow-500 to-amber-400',
    },
    low: {
      // 20-39%
      bg: 'bg-orange-500/20',
      text: 'text-orange-300',
      gradient: 'from-orange-500 to-amber-500',
    },
    veryLow: {
      // 0-19%
      bg: 'bg-red-500/20',
      text: 'text-red-300',
      gradient: 'from-red-500 to-orange-500',
    },
  },

  // Category badges
  categories: {
    politics: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      border: 'border-blue-500/40',
    },
    sports: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
    },
    crypto: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-300',
      border: 'border-orange-500/40',
    },
    business: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
    },
    science: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-300',
      border: 'border-cyan-500/40',
    },
    entertainment: {
      bg: 'bg-pink-500/20',
      text: 'text-pink-300',
      border: 'border-pink-500/40',
    },
    default: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-300',
      border: 'border-gray-500/40',
    },
  },

  // Volume indicators
  volume: {
    high: {
      // > $1M
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      icon: '#a855f7',
    },
    medium: {
      // $100K - $1M
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      icon: '#3b82f6',
    },
    low: {
      // < $100K
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      icon: '#9ca3af',
    },
  },

  // Status indicators
  status: {
    active: {
      bg: 'bg-green-500/20',
      text: 'text-green-300',
      dot: 'bg-green-500',
    },
    closed: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      dot: 'bg-gray-500',
    },
    resolved: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      dot: 'bg-blue-500',
    },
  },
} as const;

/**
 * Get confidence level based on probability (0-1)
 */
export function getConfidenceLevel(probability: number): keyof typeof chatColors.confidence {
  if (probability >= 0.8) return 'veryHigh';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.4) return 'medium';
  if (probability >= 0.2) return 'low';
  return 'veryLow';
}

/**
 * Get volume level based on volume string (e.g., "$2.5M")
 */
export function getVolumeLevel(volumeStr?: string): keyof typeof chatColors.volume {
  if (!volumeStr) return 'low';

  const match = volumeStr.match(/\$?([\d.]+)([KMB])?/);
  if (!match) return 'low';

  const value = parseFloat(match[1]);
  const unit = match[2];

  let volumeNumber = value;
  if (unit === 'K') volumeNumber = value * 1000;
  if (unit === 'M') volumeNumber = value * 1000000;
  if (unit === 'B') volumeNumber = value * 1000000000;

  if (volumeNumber >= 1000000) return 'high';
  if (volumeNumber >= 100000) return 'medium';
  return 'low';
}

/**
 * Get category color based on category name
 */
export function getCategoryColor(category?: string): typeof chatColors.categories[keyof typeof chatColors.categories] {
  if (!category) return chatColors.categories.default;

  const normalized = category.toLowerCase();
  if (normalized.includes('politic')) return chatColors.categories.politics;
  if (normalized.includes('sport')) return chatColors.categories.sports;
  if (normalized.includes('crypto') || normalized.includes('bitcoin') || normalized.includes('eth'))
    return chatColors.categories.crypto;
  if (normalized.includes('business') || normalized.includes('econom'))
    return chatColors.categories.business;
  if (normalized.includes('science') || normalized.includes('tech'))
    return chatColors.categories.science;
  if (normalized.includes('entertainment') || normalized.includes('celeb'))
    return chatColors.categories.entertainment;

  return chatColors.categories.default;
}

/**
 * Format probability as percentage
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
