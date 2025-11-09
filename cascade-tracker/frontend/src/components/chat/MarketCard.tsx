'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ExternalLink, Calendar, Droplets } from 'lucide-react';
import { MarketData } from '@/utils/messageParser';
import {
  chatColors,
  getConfidenceLevel,
  getVolumeLevel,
  formatProbability,
} from '@/styles/chatColors';

interface MarketCardProps {
  market: MarketData;
  compact?: boolean;
}

export function MarketCard({ market, compact = false }: MarketCardProps) {
  const confidenceLevel = getConfidenceLevel(market.price);
  const volumeLevel = market.volume ? getVolumeLevel(market.volume) : 'low';

  // Normalize direction to lowercase and provide fallback
  const normalizedDirection = (market.direction || 'NEUTRAL').toLowerCase();
  const validDirections = ['up', 'down', 'neutral'] as const;
  const direction = validDirections.includes(normalizedDirection as any)
    ? normalizedDirection
    : 'neutral';

  const handleOpenMarket = () => {
    if (market.url) {
      window.open(market.url, '_blank', 'noopener,noreferrer');
    }
  };

  const directionConfig = chatColors.direction[direction as keyof typeof chatColors.direction];
  const confidenceConfig = chatColors.confidence[confidenceLevel];
  const volumeConfig = chatColors.volume[volumeLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        group relative overflow-hidden rounded-lg border
        ${compact ? 'p-3' : 'p-4'}
        bg-white/5 border-white/10
        hover:bg-white/10 hover:border-white/20
        transition-all duration-300 cursor-pointer
      `}
      onClick={handleOpenMarket}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${confidenceConfig.gradient} opacity-5`} />
      </div>

      <div className="relative z-10 space-y-3">
        {/* Header: Title + Direction Badge */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4
              className={`
              ${compact ? 'text-sm' : 'text-base'}
              font-medium text-white/90 leading-snug
              group-hover:text-white transition-colors
            `}
            >
              {market.title}
            </h4>
          </div>

          {/* Direction Badge */}
          <div
            className={`
            flex items-center gap-1 px-2 py-1 rounded-md
            ${directionConfig.bg} ${directionConfig.border} border
            text-xs font-medium ${directionConfig.text}
          `}
          >
            {direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {direction === 'neutral' && <div className="w-3 h-0.5 bg-current" />}
            <span>{direction.toUpperCase()}</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Probability */}
          <div className="space-y-1">
            <div className="text-xs text-white/50 uppercase tracking-wide">Probability</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${confidenceConfig.text}`}>
                {formatProbability(market.price)}
              </span>
              {market.change24h !== undefined && (
                <span
                  className={`text-xs ${market.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {market.change24h >= 0 ? '+' : ''}
                  {market.change24h.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Probability Bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${market.price * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${confidenceConfig.gradient}`}
              />
            </div>
          </div>

          {/* Volume */}
          {market.volume && (
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wide">Volume</div>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${volumeConfig.text}`} />
                <span className={`text-lg font-semibold ${volumeConfig.text}`}>{market.volume}</span>
              </div>
              <div className={`text-xs ${volumeConfig.text} opacity-70 capitalize`}>{volumeLevel} volume</div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        {(market.liquidity || market.endDate) && (
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            {market.liquidity && (
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Droplets className="w-3.5 h-3.5" />
                <span>Liquidity: {market.liquidity}</span>
              </div>
            )}
            {market.endDate && (
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* View on Polymarket Button */}
        {market.url && (
          <div className="pt-2">
            <div
              className="
                flex items-center justify-center gap-2 px-3 py-2 rounded-md
                bg-gradient-to-r from-pm-blue to-pm-teal
                text-white text-sm font-medium
                opacity-0 group-hover:opacity-100
                transform translate-y-2 group-hover:translate-y-0
                transition-all duration-300
              "
            >
              <span>View on Polymarket</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Market list component for multiple markets
interface MarketListProps {
  markets: MarketData[];
  title?: string;
}

export function MarketList({ markets, title }: MarketListProps) {
  if (markets.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">{title}</h3>
      )}
      <div className="space-y-2">
        {markets.map((market, index) => (
          <MarketCard key={`${market.url}-${index}`} market={market} compact={markets.length > 3} />
        ))}
      </div>
    </div>
  );
}
