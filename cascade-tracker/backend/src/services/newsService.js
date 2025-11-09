/**
 * News Service - Fetch current news for cascade generation
 *
 * This service provides current news context to make cascades more relevant and timely.
 * Uses NewsAPI for real-time headlines across multiple domains.
 */

export class NewsService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheDuration = 60 * 60 * 1000; // 1 hour cache
    this.apiKey = process.env.NEWS_API_KEY;
    this.useRealAPI = !!this.apiKey;
  }

  /**
   * Get current news headlines across domains
   * Returns news context that can inform cascade generation
   */
  async getCurrentNews() {
    // Check cache first
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('📰 Using cached news');
      return this.cache;
    }

    console.log('📰 Fetching fresh news...');

    let newsContext;

    if (this.useRealAPI) {
      try {
        newsContext = await this.fetchFromNewsAPI();
        console.log('✅ Real-time news fetched successfully');
      } catch (error) {
        console.warn('⚠️ NewsAPI failed, using fallback:', error.message);
        newsContext = this.getFallbackNews();
      }
    } else {
      console.log('📰 No API key, using fallback news context');
      newsContext = this.getFallbackNews();
    }

    // Cache the result
    this.cache = newsContext;
    this.cacheExpiry = Date.now() + this.cacheDuration;

    return newsContext;
  }

  /**
   * Fetch real-time news from NewsAPI
   */
  async fetchFromNewsAPI() {
    const categories = ['technology', 'health', 'sports', 'entertainment', 'business', 'science'];
    const newsContext = {};

    // Fetch top headlines for each category
    const promises = categories.map(async (category) => {
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=10&apiKey=${this.apiKey}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`NewsAPI HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.articles) {
          // Extract headlines and categorize
          const headlines = data.articles
            .filter(a => a.title && !a.title.includes('[Removed]'))
            .map(a => a.title)
            .slice(0, 5);

          return { category, headlines };
        } else {
          console.warn(`NewsAPI returned no articles for ${category}`);
          return { category, headlines: [] };
        }
      } catch (error) {
        console.warn(`Failed to fetch ${category} news:`, error.message);
        return { category, headlines: [] };
      }
    });

    const results = await Promise.all(promises);

    // Build newsContext object
    results.forEach(({ category, headlines }) => {
      // Map NewsAPI categories to our domain names
      const domainMap = {
        'technology': 'technology',
        'health': 'health',
        'sports': 'sports',
        'entertainment': 'entertainment',
        'business': 'economic',
        'science': 'climate'
      };

      const domain = domainMap[category] || category;
      newsContext[domain] = headlines.length > 0 ? headlines : this.getFallbackNews()[domain] || [];
    });

    // Add geopolitical from general news
    try {
      const generalUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${this.apiKey}`;
      const response = await fetch(generalUrl);
      const data = await response.json();

      if (data.status === 'ok' && data.articles) {
        const geopoliticalHeadlines = data.articles
          .filter(a => a.title && (
            a.title.toLowerCase().includes('war') ||
            a.title.toLowerCase().includes('china') ||
            a.title.toLowerCase().includes('russia') ||
            a.title.toLowerCase().includes('nato') ||
            a.title.toLowerCase().includes('israel') ||
            a.title.toLowerCase().includes('iran')
          ))
          .map(a => a.title)
          .slice(0, 5);

        newsContext['geopolitical'] = geopoliticalHeadlines.length > 0
          ? geopoliticalHeadlines
          : this.getFallbackNews().geopolitical;
      }
    } catch (error) {
      console.warn('Failed to fetch geopolitical news:', error.message);
      newsContext['geopolitical'] = this.getFallbackNews().geopolitical;
    }

    return newsContext;
  }

  /**
   * Fallback news context when API is unavailable
   */
  getFallbackNews() {
    return {
      technology: [
        'AI advancement and regulation discussions continue',
        'Tech sector earnings and market performance',
        'Semiconductor industry and chip manufacturing',
        'Quantum computing breakthroughs',
        'Biotech and medical technology innovations'
      ],
      climate: [
        'Renewable energy adoption and policy',
        'Climate conference outcomes and commitments',
        'Extreme weather events and patterns',
        'Carbon market developments',
        'Green technology investments'
      ],
      health: [
        'Healthcare policy and insurance developments',
        'Medical research breakthroughs',
        'Public health initiatives',
        'Pharmaceutical industry updates',
        'Mental health and wellness trends'
      ],
      sports: [
        'Major championship outcomes and playoffs',
        'Athlete performance and records',
        'Sports betting market expansion',
        'Olympic and international competitions',
        'League expansions and team movements'
      ],
      entertainment: [
        'Box office performance and streaming trends',
        'Gaming industry releases and updates',
        'Music industry and concert tours',
        'Awards season and cultural events',
        'Social media and content creator economy'
      ],
      economic: [
        'Interest rate decisions and monetary policy',
        'Economic indicators and market performance',
        'International trade developments',
        'Corporate earnings and business cycles',
        'Employment and inflation trends'
      ],
      geopolitical: [
        'International relations and diplomacy',
        'Regional conflicts and peace negotiations',
        'Trade agreements and sanctions',
        'NATO and alliance developments',
        'Global security concerns'
      ]
    };
  }

  /**
   * Get news-driven cascade suggestions
   * Returns domain-specific insights to help AI generate better cascades
   */
  async getNewsDrivenInsights() {
    const newsContext = await this.getCurrentNews();

    // Extract top trends from real news
    const currentTrends = [];

    // Get top 1-2 headlines per domain
    Object.entries(newsContext).forEach(([domain, headlines]) => {
      if (headlines.length > 0) {
        currentTrends.push(headlines[0]); // Top headline per domain
      }
    });

    // Limit to top 5 trends
    const topTrends = currentTrends.slice(0, 5);

    return {
      currentTrends: topTrends.length > 0 ? topTrends : [
        'Technology and AI regulation impact on markets',
        'Climate policy affecting energy sectors',
        'Healthcare innovation driving biotech investments',
        'Sports events influencing entertainment and betting',
        'Economic policy shaping cryptocurrency and traditional finance'
      ],
      crossDomainOpportunities: [
        'AI → Climate: Machine learning for climate modeling and green tech optimization',
        'Health → Sports: Performance medicine and athlete wellness technologies',
        'Entertainment → Tech: Streaming platforms and content delivery innovation',
        'Economic → Climate: Green finance and carbon credit markets',
        'Technology → Health: Medical AI and telemedicine expansion'
      ],
      timingContext: `Generated: ${new Date().toISOString().split('T')[0]}${this.useRealAPI ? ' (Real-time news)' : ' (Fallback context)'}`
    };
  }

  /**
   * Get domain-specific news context for cascade generation
   */
  async getDomainContext(domain) {
    const newsContext = await this.getCurrentNews();
    const domainKey = domain.toLowerCase();

    if (newsContext[domainKey]) {
      return {
        domain,
        headlines: newsContext[domainKey],
        suggestions: `Consider how current ${domain} developments create market cascades`
      };
    }

    return {
      domain,
      headlines: [],
      suggestions: `Explore ${domain} connections to current events`
    };
  }
}

export const newsService = new NewsService();
