/**
 * Polymarket Service
 *
 * Fetches live market data from Polymarket API for use in chatbot responses.
 * Includes caching to reduce API calls and improve response times.
 */

const axios = require('axios');

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

class PolymarketService {
  constructor() {
    this.baseURL = 'https://gamma-api.polymarket.com';
    this.clobURL = 'https://clob.polymarket.com';
  }

  /**
   * Get or set cache
   */
  _getCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  _setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Search markets by query
   */
  async searchMarkets(query, limit = 5) {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/markets`, {
        params: {
          limit,
          active: true,
          _search: query,
        },
        timeout: 5000,
      });

      const markets = response.data.map(this._formatMarket);
      this._setCache(cacheKey, markets);
      return markets;
    } catch (error) {
      console.error('Error searching markets:', error.message);
      return [];
    }
  }

  /**
   * Get trending markets
   */
  async getTrendingMarkets(limit = 5) {
    const cacheKey = `trending:${limit}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/markets`, {
        params: {
          limit,
          active: true,
          _lt_end_date_min: Math.floor(Date.now() / 1000),
        },
        timeout: 5000,
      });

      const markets = response.data
        .sort((a, b) => parseFloat(b.volume || 0) - parseFloat(a.volume || 0))
        .slice(0, limit)
        .map(this._formatMarket);

      this._setCache(cacheKey, markets);
      return markets;
    } catch (error) {
      console.error('Error getting trending markets:', error.message);
      return [];
    }
  }

  /**
   * Get market by ID
   */
  async getMarketById(marketId) {
    const cacheKey = `market:${marketId}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/markets/${marketId}`, {
        timeout: 5000,
      });

      const market = this._formatMarket(response.data);
      this._setCache(cacheKey, market);
      return market;
    } catch (error) {
      console.error(`Error getting market ${marketId}:`, error.message);
      return null;
    }
  }

  /**
   * Get markets by category
   */
  async getMarketsByCategory(category, limit = 10) {
    const cacheKey = `category:${category}:${limit}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/markets`, {
        params: {
          limit,
          active: true,
          tag: category,
        },
        timeout: 5000,
      });

      const markets = response.data.map(this._formatMarket);
      this._setCache(cacheKey, markets);
      return markets;
    } catch (error) {
      console.error(`Error getting markets for category ${category}:`, error.message);
      return [];
    }
  }

  /**
   * Format market data for chatbot display
   */
  _formatMarket(market) {
    // Extract probability/price
    const outcomePrices = market.outcomePrices || ['0.5', '0.5'];
    const price = parseFloat(outcomePrices[0]);

    // Calculate direction based on recent price movement
    let direction = 'NEUTRAL';
    if (market.clobTokenIds && market.clobTokenIds.length > 0) {
      // This would require historical data, defaulting to NEUTRAL for now
      // In production, you'd compare current price to 24h ago
      direction = 'NEUTRAL';
    }

    // Format volume
    const volume = market.volume ? this._formatVolume(parseFloat(market.volume)) : null;
    const liquidity = market.liquidity ? this._formatVolume(parseFloat(market.liquidity)) : null;

    return {
      title: market.question || market.name || 'Unnamed Market',
      price,
      volume,
      liquidity,
      direction,
      url: `https://polymarket.com/event/${market.slug || market.id}`,
      endDate: market.endDate ? new Date(market.endDate * 1000).toISOString() : null,
      change24h: market.change24h || 0, // Would need historical data
    };
  }

  /**
   * Format large numbers as K/M/B
   */
  _formatVolume(amount) {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    cache.clear();
  }
}

module.exports = new PolymarketService();
