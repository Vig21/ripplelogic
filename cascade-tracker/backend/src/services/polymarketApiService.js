import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

/**
 * Polymarket Gamma API Service
 * Public API for market discovery and event data
 * No authentication required
 */
export class PolymarketApiService {
  constructor() {
    this.client = axios.create({
      baseURL: GAMMA_API_BASE,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generic request method with retry logic
   */
  async request(method, endpoint, params = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.request({
          method,
          url: endpoint,
          params: method === 'GET' ? params : undefined,
          data: method !== 'GET' ? params : undefined
        });

        return response.data;

      } catch (error) {
        console.error(`Polymarket API request failed (attempt ${attempt}/${retries}):`, error.message);

        if (attempt === retries) {
          throw new Error(`Polymarket API error after ${retries} attempts: ${error.message}`);
        }

        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Search events with filters
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Results per page (default: 30, max: 100)
   * @param {number} params.offset - Pagination offset
   * @param {boolean} params.closed - Filter closed events
   * @param {string} params.order - Sort field (volume, liquidity, end_date)
   * @param {boolean} params.ascending - Sort direction
   */
  async searchEvents(params = {}) {
    const defaults = {
      limit: 30,
      closed: false,
      order: 'volume',
      ascending: false
    };

    return this.request('GET', '/events', { ...defaults, ...params });
  }

  /**
   * Get event by slug
   * @param {string} slug - Event slug
   */
  async getEvent(slug) {
    return this.request('GET', `/events/${slug}`);
  }

  /**
   * Search markets with filters
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Results per page (default: 100, max: 100)
   * @param {number} params.offset - Pagination offset
   * @param {boolean} params.closed - Filter closed markets
   * @param {boolean} params.active - Filter active markets
   * @param {number} params.volume_num_min - Minimum volume
   * @param {number} params.volume_num_max - Maximum volume
   * @param {string} params.order - Sort field (volume, liquidity)
   * @param {boolean} params.ascending - Sort direction
   */
  async searchMarkets(params = {}) {
    const defaults = {
      limit: 100,
      closed: false,
      active: true,
      order: 'volume',
      ascending: false
    };

    return this.request('GET', '/markets', { ...defaults, ...params });
  }

  /**
   * Get market by slug
   * @param {string} slug - Market slug
   */
  async getMarket(slug) {
    return this.request('GET', `/markets/${slug}`);
  }

  /**
   * Get trending markets (high volume, active)
   * @param {number} limit - Number of markets to return (default: 25)
   */
  async getTrendingMarkets(limit = 25) {
    console.log(`📊 Fetching ${limit} trending markets from Polymarket API...`);

    const markets = await this.searchMarkets({
      limit,
      closed: false,
      active: true,
      volume_num_min: 100,  // Minimum $100 volume
      order: 'volume',
      ascending: false
    });

    console.log(`✅ Fetched ${markets.length} trending markets`);

    // Log sample to verify data quality
    if (markets.length > 0) {
      console.log('📊 Sample market from API:');
      console.log(`   Question: "${markets[0].question}"`);
      console.log(`   Slug: "${markets[0].slug}"`);
      console.log(`   Active: ${markets[0].active}, Closed: ${markets[0].closed}`);
    }

    // Transform to consistent format
    const transformed = markets
      .filter(m => m.active && !m.closed)  // Extra safety filter
      .map(m => ({
        question: m.question,
        slug: m.slug,
        volume: m.volumeNum || 0,
        liquidity: m.liquidityNum || 0,
        status: m.closed ? 'Closed' : 'Active',
        url: `https://polymarket.com/event/${m.slug}`,
        probability: m.outcomePrices?.[0] ? parseFloat(m.outcomePrices[0]) * 100 : null,
        outcomes: m.outcomes || [],
        category: m.category,
        endDate: m.endDate,
        image: m.image,
        eventSlug: m.event?.slug
      }));

    console.log(`✅ Transformed ${transformed.length} active markets`);
    return transformed;
  }

  /**
   * Get active events with minimum market count
   * @param {number} limit - Number of events to return (default: 20)
   * @param {number} minMarkets - Minimum number of markets per event (default: 2)
   */
  async getActiveEvents(limit = 20, minMarkets = 2) {
    console.log(`📅 Fetching ${limit} active events from Polymarket API...`);

    const events = await this.searchEvents({
      limit: limit * 2,  // Fetch extra to filter by market count
      closed: false
    });

    // Filter events with sufficient markets and transform
    const filteredEvents = events
      .filter(e => !e.closed && (e.markets_count >= minMarkets || e.markets?.length >= minMarkets))
      .slice(0, limit)
      .map(e => ({
        title: e.title,
        slug: e.slug,
        markets_count: e.markets_count || e.markets?.length || 0,
        status: e.closed ? 'Closed' : 'Active',
        volume: e.volume,
        liquidity: e.liquidity,
        markets: e.markets?.map(m => ({
          question: m.question,
          slug: m.slug,
          probability: m.outcomePrices?.[0] ? parseFloat(m.outcomePrices[0]) * 100 : null,
          volume: m.volumeNum || 0,
          url: `https://polymarket.com/event/${m.slug}`,
          active: m.active && !m.closed
        })) || []
      }));

    console.log(`✅ Fetched ${filteredEvents.length} active events with ${minMarkets}+ markets`);

    return filteredEvents;
  }

  /**
   * Get markets from multiple events
   * @param {Array<string>} eventSlugs - Array of event slugs
   */
  async getMarketsFromEvents(eventSlugs) {
    console.log(`📊 Fetching markets from ${eventSlugs.length} events...`);

    const allMarkets = [];

    for (const slug of eventSlugs) {
      try {
        const event = await this.getEvent(slug);

        if (event.markets && event.markets.length > 0) {
          const markets = event.markets
            .filter(m => m.active && !m.closed)
            .map(m => ({
              question: m.question,
              slug: m.slug,
              volume: m.volumeNum || 0,
              status: m.closed ? 'Closed' : 'Active',
              url: `https://polymarket.com/event/${m.slug}`,
              probability: m.outcomePrices?.[0] ? parseFloat(m.outcomePrices[0]) * 100 : null,
              outcomes: m.outcomes || [],
              eventTitle: event.title,
              eventSlug: event.slug
            }));

          allMarkets.push(...markets);
          console.log(`   ✓ ${markets.length} active markets from: ${event.title}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not fetch event ${slug}:`, error.message);
      }
    }

    console.log(`✅ Total: ${allMarkets.length} markets from events`);
    return allMarkets;
  }
}

export const polymarketApi = new PolymarketApiService();
