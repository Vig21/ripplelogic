import { claudeService } from "./claudeService.js";
import { polymarketApi } from "./polymarketApiService.js";
import { newsService } from "./newsService.js";
import crypto from "crypto";

/**
 * Generate sophisticated cascade events using Claude + Polymarket API
 */
export class CascadeGeneratorService {
  constructor() {
    // Track recently generated cascades for diversity enforcement
    this.recentCascades = [];
    this.maxRecentCascades = 10;
  }

  /**
   * Track a generated cascade for diversity analysis
   */
  trackCascade(cascade) {
    this.recentCascades.push({
      category: cascade.category,
      primaryDomain: cascade.cascade_metadata?.primary_domain || cascade.category,
      events: [
        ...(cascade.primary_effects || []).map(e => e.market_id),
        ...(cascade.secondary_effects || []).map(e => e.market_id),
        ...(cascade.tertiary_effects || []).map(e => e.market_id),
      ],
      timestamp: Date.now(),
    });

    // Keep only recent cascades
    if (this.recentCascades.length > this.maxRecentCascades) {
      this.recentCascades.shift();
    }
  }

  /**
   * Check if we should allow this domain based on recent history
   */
  shouldAllowDomain(domain) {
    if (this.recentCascades.length < 3) return true; // Not enough history

    // Count political/crypto in last 3 cascades
    const lastThree = this.recentCascades.slice(-3);
    const politicalCount = lastThree.filter(
      c => c.category === 'POLITICAL' || c.primaryDomain === 'POLITICAL'
    ).length;
    const cryptoCount = lastThree.filter(
      c => c.category === 'CRYPTO' || c.primaryDomain === 'CRYPTO'
    ).length;

    // Block if we already have 1+ political/crypto in last 3
    if ((domain === 'POLITICAL' && politicalCount >= 1) ||
        (domain === 'CRYPTO' && cryptoCount >= 1)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate freshness penalty based on recent event usage
   */
  calculateFreshnessPenalty(eventId) {
    const recentEventIds = this.recentCascades
      .flatMap(c => c.events);

    const usageCount = recentEventIds.filter(id => id === eventId).length;

    // Penalize heavily used events: -10 points per usage
    return usageCount * -10;
  }

  /**
   * Generate multiple sophisticated cascades based on current market trends
   */
  async generateCascades(count = 3) {
    try {
      console.log(`🎲 Generating ${count} sophisticated cascades...`);

      // Step 1: Discover trending events from Polymarket API
      const trendingEvents = await this.discoverTrendingEvents();

      // Step 2: Use Claude to analyze and generate sophisticated cascades
      const cascades = await this.generateSophisticatedCascades(
        trendingEvents,
        count
      );

      console.log(`✅ Generated ${cascades.length} cascades`);
      return cascades;
    } catch (error) {
      console.error("❌ Error generating cascades:", error);
      throw error;
    }
  }

  /**
   * Discover diverse events from Polymarket API
   * Fetches a much larger pool (150 events) for variety
   */
  async discoverTrendingEvents() {
    try {
      console.log("📊 Fetching diverse event pool from Polymarket...");

      // Fetch MUCH larger pool for diversity (150 events instead of 25)
      const highVolumeEvents = await polymarketApi.getActiveEvents(100, 2);

      // Also fetch some lower-volume events for variety
      const diverseEvents = await polymarketApi.searchEvents({
        limit: 50,
        offset: 100,
        closed: false,
        order: 'liquidity',  // Different sort order for variety
      });

      // Combine and deduplicate by slug
      const allEvents = [...highVolumeEvents];
      const existingSlugs = new Set(highVolumeEvents.map(e => e.slug));

      for (const event of diverseEvents) {
        if (!existingSlugs.has(event.slug) && event.markets_count >= 2) {
          allEvents.push({
            title: event.title,
            slug: event.slug,
            markets_count: event.markets_count || event.markets?.length || 0,
            status: event.closed ? 'Closed' : 'Active',
            volume: event.volume,
            liquidity: event.liquidity,
            markets: event.markets || []
          });
          existingSlugs.add(event.slug);
        }
      }

      console.log(`✅ Total diverse event pool: ${allEvents.length} events`);

      if (allEvents.length > 0) {
        console.log("📊 Sample events (showing variety):");
        console.log(`   High volume: "${allEvents[0].title}"`);
        if (allEvents.length > 50) console.log(`   Mid volume: "${allEvents[50].title}"`);
        if (allEvents.length > 100) console.log(`   Lower volume: "${allEvents[100].title}"`);
      }

      return allEvents;
    } catch (error) {
      console.error("Error discovering events:", error);
      console.error("Error details:", error.message);
      return [];
    }
  }

  /**
   * Validate Polymarket event URL and extract event data
   */
  async validateEventUrl(url) {
    console.log(`🔍 Validating event URL: ${url}`);

    // Remove query parameters (like ?tid=...)
    const cleanUrl = url.split("?")[0];

    // Extract slug from URL (e.g., from https://polymarket.com/event/super-bowl-champion-2026-731)
    const slugMatch = cleanUrl.match(/polymarket\.com\/event\/([a-z0-9-]+)/i);
    if (!slugMatch) {
      throw new Error(
        "Invalid Polymarket URL format. Expected format: https://polymarket.com/event/event-slug"
      );
    }

    const slug = slugMatch[1];
    console.log(`   Extracted slug: ${slug}`);

    // Note: Polymarket API doesn't support direct slug lookup
    // We need to search through events to find the matching slug

    // Strategy: Search through progressively larger batches
    // Start with trending events (fastest)
    console.log(`   Searching in trending events (top 25)...`);
    let events = await this.discoverTrendingEvents();
    let foundEvent = events.find((e) => e.slug === slug);

    if (foundEvent) {
      console.log(`   ✅ Event found in trending: "${foundEvent.title}"`);
      return foundEvent;
    }

    // Expand to top 100 events
    console.log(
      `   ⚠️  Not in trending, expanding search to top 100 events...`
    );
    const batch1 = await polymarketApi.getActiveEvents(100, 1);
    foundEvent = batch1.find((e) => e.slug === slug);

    if (foundEvent) {
      console.log(`   ✅ Event found in top 100: "${foundEvent.title}"`);
      return foundEvent;
    }

    // Expand to top 300 events (search in batches)
    console.log(`   ⚠️  Still not found, searching events 100-300...`);
    for (let offset = 100; offset < 300; offset += 100) {
      try {
        const batch = await polymarketApi.searchEvents({
          limit: 100,
          offset: offset,
          closed: false,
        });
        foundEvent = batch.find((e) => e.slug === slug);

        if (foundEvent) {
          console.log(
            `   ✅ Event found at position ${offset}-${offset + 100}: "${
              foundEvent.title
            }"`
          );
          // Transform to match our expected format
          return {
            title: foundEvent.title,
            slug: foundEvent.slug,
            volume: foundEvent.volume || 0,
            liquidity: foundEvent.liquidity || 0,
            markets_count:
              foundEvent.markets?.length || foundEvent.markets_count || 0,
            status: foundEvent.closed ? "Closed" : "Active",
            markets: foundEvent.markets || [],
          };
        }
      } catch (err) {
        console.log(
          `   ⚠️  Batch ${offset}-${offset + 100} search failed: ${err.message}`
        );
      }
    }

    // Check closed events as a last resort
    console.log(`   ⚠️  Checking if event is closed...`);
    try {
      const closedEvents = await polymarketApi.searchEvents({
        limit: 100,
        closed: true,
      });
      foundEvent = closedEvents.find((e) => e.slug === slug);

      if (foundEvent) {
        throw new Error(
          `This event is closed and cannot be used for cascade generation. Please choose an active event.`
        );
      }
    } catch (err) {
      if (err.message.includes("closed")) {
        throw err;
      }
    }

    // Event doesn't exist
    throw new Error(
      `Event not found on Polymarket. Please verify the URL is correct and the event exists. You can find events at https://polymarket.com`
    );
  }

  /**
   * Analyze event and extract keywords and domain
   */
  analyzeEvent(event) {
    const title = event.title.toLowerCase();

    // Domain keywords - rebalanced for diversity (POLITICAL/CRYPTO reduced, others expanded)
    const domains = {
      POLITICAL: [
        "president",
        "election",
        "senate",
        "congress",
        "cabinet",
        "governor",
        "vote",
        "nominee",
        "campaign",
        "political",
        "policy",
        "bill",
      ],
      ECONOMIC: [
        "fed",
        "rate",
        "inflation",
        "gdp",
        "jobs",
        "unemployment",
        "recession",
        "economy",
        "market",
        "stock",
        "trading",
        "finance",
        "dollar",
        "treasury",
        "bond",
        "yield",
        "fomc",
        "powell",
      ],
      CRYPTO: [
        "bitcoin",
        "btc",
        "ethereum",
        "eth",
        "crypto",
        "blockchain",
        "defi",
        "token",
      ],
      TECHNOLOGY: [
        "ai",
        "artificial intelligence",
        "machine learning",
        "ml",
        "apple",
        "google",
        "meta",
        "tesla",
        "tech",
        "software",
        "hardware",
        "app",
        "iphone",
        "android",
        "openai",
        "chatgpt",
        "gpt",
        "microsoft",
        "amazon",
        "nvidia",
        "chip",
        "semiconductor",
        "processor",
        "quantum",
        "robot",
        "automation",
        "cloud",
        "data",
        "algorithm",
        "startup",
        "ipo",
        "biotech",
        "crispr",
        "gene",
        "dna",
        "pharma",
      ],
      SPORTS: [
        "super bowl",
        "nfl",
        "nba",
        "mlb",
        "nhl",
        "champion",
        "championship",
        "playoffs",
        "world series",
        "world cup",
        "olympics",
        "football",
        "basketball",
        "baseball",
        "soccer",
        "hockey",
        "tennis",
        "golf",
        "racing",
        "ufc",
        "boxing",
        "finals",
        "mvp",
        "team",
        "player",
        "athlete",
        "game",
        "match",
        "tournament",
      ],
      ENTERTAINMENT: [
        "movie",
        "film",
        "oscar",
        "academy award",
        "box office",
        "netflix",
        "disney",
        "hbo",
        "streaming",
        "album",
        "music",
        "grammy",
        "billboard",
        "concert",
        "tour",
        "actor",
        "actress",
        "celebrity",
        "gta",
        "release",
        "grossing",
        "opening",
        "weekend",
        "show",
        "series",
        "season",
        "episode",
        "premiere",
        "viral",
        "trending",
      ],
      GEOPOLITICAL: [
        "war",
        "ukraine",
        "russia",
        "china",
        "nato",
        "military",
        "sanction",
        "peace",
        "treaty",
        "conflict",
        "invasion",
        "attack",
        "defense",
        "israel",
        "gaza",
        "iran",
        "korea",
        "taiwan",
        "nuclear",
      ],
      CLIMATE: [
        "climate",
        "temperature",
        "weather",
        "hurricane",
        "tornado",
        "earthquake",
        "wildfire",
        "flood",
        "drought",
        "emission",
        "carbon",
        "co2",
        "global",
        "warming",
        "degrees",
        "celsius",
        "fahrenheit",
        "renewable",
        "solar",
        "wind",
        "energy",
        "sustainability",
        "green",
        "epa",
      ],
      HEALTH: [
        "health",
        "healthcare",
        "medical",
        "hospital",
        "doctor",
        "nurse",
        "pandemic",
        "epidemic",
        "disease",
        "virus",
        "covid",
        "vaccine",
        "fda",
        "drug",
        "treatment",
        "cure",
        "medicine",
        "clinical",
        "trial",
        "patient",
        "cancer",
        "alzheimer",
      ],
    };

    // Detect primary domain
    let primaryDomain = "SOCIAL";
    let maxMatches = 0;

    for (const [domain, keywords] of Object.entries(domains)) {
      const matches = keywords.filter((kw) => title.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryDomain = domain;
      }
    }

    // Extract key entities and topics
    const keywords = title
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "will",
            "what",
            "when",
            "where",
            "which",
            "before",
            "after",
            "than",
            "than",
          ].includes(word)
      );

    return { primaryDomain, keywords, title };
  }

  /**
   * Calculate relevance score between trigger event and another event
   */
  calculateRelevance(triggerAnalysis, event) {
    const eventAnalysis = this.analyzeEvent(event);
    let score = 0;

    // Same domain = high relevance (but not overwhelming)
    if (triggerAnalysis.primaryDomain === eventAnalysis.primaryDomain) {
      score += 40; // Reduced from 50
    }

    // Related domains - TIGHTENED to prevent weak connections
    // Only include domains with STRONG, QUANTIFIABLE causal mechanisms
    const relatedDomains = {
      ECONOMIC: ["CRYPTO", "GEOPOLITICAL"],  // Removed POLITICAL, TECHNOLOGY (too loose)
      CRYPTO: ["ECONOMIC", "TECHNOLOGY"],  // Only monetary/tech connections
      POLITICAL: ["ECONOMIC", "GEOPOLITICAL"],  // Removed HEALTH, CLIMATE, SPORTS, ENTERTAINMENT
      TECHNOLOGY: ["HEALTH", "CLIMATE"],  // Removed ECONOMIC, CRYPTO, ENTERTAINMENT (unless specific)
      SPORTS: ["HEALTH"],  // Removed ENTERTAINMENT (too weak)
      ENTERTAINMENT: ["TECHNOLOGY"],  // Removed SPORTS (weak mechanism)
      GEOPOLITICAL: ["POLITICAL", "ECONOMIC"],  // Removed CLIMATE (too speculative)
      CLIMATE: ["TECHNOLOGY"],  // Removed POLITICAL, GEOPOLITICAL, HEALTH (too loose)
      HEALTH: ["TECHNOLOGY", "SPORTS"],  // Removed POLITICAL, CLIMATE (weak links)
    };

    if (
      relatedDomains[triggerAnalysis.primaryDomain]?.includes(
        eventAnalysis.primaryDomain
      )
    ) {
      score += 20;
    }

    // Keyword overlap - most important factor
    const triggerKeywords = new Set(triggerAnalysis.keywords);
    const eventKeywords = new Set(eventAnalysis.keywords);
    const commonKeywords = [...triggerKeywords].filter((kw) =>
      eventKeywords.has(kw)
    );
    score += commonKeywords.length * 25;

    // Partial keyword matches (e.g., "bitcoin" and "btc")
    let partialMatches = 0;
    for (const triggerKw of triggerKeywords) {
      for (const eventKw of eventKeywords) {
        if (triggerKw.length > 3 && eventKw.length > 3) {
          if (triggerKw.includes(eventKw) || eventKw.includes(triggerKw)) {
            partialMatches++;
          }
        }
      }
    }
    score += Math.min(partialMatches * 12, 36);

    // Volume boost - DRASTICALLY REDUCED (70% reduction from original 5+5=10 points)
    // Now only adds 0.6+0.9=1.5 total points vs original 10 points
    if (event.volume > 1000000) score += 0.6; // 70% reduction from 2
    if (event.volume > 10000000) score += 0.9; // 70% reduction from 3

    // Diversity bonus: SIGNIFICANTLY boost underrepresented domains
    // Helps counter political/crypto dominance
    const diverseDomains = [
      "SPORTS",
      "ENTERTAINMENT",
      "CLIMATE",
      "TECHNOLOGY",
      "HEALTH",
    ];
    if (diverseDomains.includes(eventAnalysis.primaryDomain)) {
      score += 15; // Increased from 5 to actively promote diversity
    }

    // Penalty for overused domains to prevent repetition
    const overusedDomains = ["POLITICAL", "CRYPTO"];
    if (overusedDomains.includes(eventAnalysis.primaryDomain)) {
      score -= 5; // Subtract points to discourage political/crypto dominance
    }

    // Freshness penalty: heavily penalize recently used events
    const freshnessPenalty = this.calculateFreshnessPenalty(event.slug);
    score += freshnessPenalty;

    return score;
  }

  /**
   * Generate custom cascade with specific event as primary trigger
   */
  async generateCustomCascade(eventUrl) {
    try {
      console.log(`🎲 Generating custom cascade for event: ${eventUrl}`);

      // Step 1: Validate and get event data
      const triggerEvent = await this.validateEventUrl(eventUrl);

      // Step 2: Analyze trigger event
      const triggerAnalysis = this.analyzeEvent(triggerEvent);
      console.log(`   Detected domain: ${triggerAnalysis.primaryDomain}`);
      console.log(
        `   Key topics: ${triggerAnalysis.keywords.slice(0, 5).join(", ")}`
      );

      // Step 3: Fetch other trending events
      const allEvents = await this.discoverTrendingEvents();

      // Step 4: Filter out the trigger event and calculate relevance scores
      const otherEvents = allEvents
        .filter((e) => e.slug !== triggerEvent.slug)
        .map((event) => ({
          ...event,
          relevanceScore: this.calculateRelevance(triggerAnalysis, event),
          domain: this.analyzeEvent(event).primaryDomain,
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log(`   Top 10 relevant events by score:`);
      otherEvents.slice(0, 10).forEach((e, i) => {
        console.log(
          `     ${i + 1}. [${e.relevanceScore}] [${e.domain}] ${e.title}`
        );
      });

      // Step 5: Select diverse set of relevant events for cascade
      // Ensure domain diversity to avoid crypto/Fed dominance
      const relevantEvents = [triggerEvent];

      // Strategy: Get events from same domain first, then related domains, then diverse domains
      const sameDomain = otherEvents
        .filter((e) => e.domain === triggerAnalysis.primaryDomain)
        .slice(0, 6);
      const relatedDomains = otherEvents
        .filter(
          (e) =>
            e.domain !== triggerAnalysis.primaryDomain && e.relevanceScore >= 25
        )
        .slice(0, 8);
      const diverseEvents = otherEvents
        .filter(
          (e) =>
            !sameDomain.includes(e) &&
            !relatedDomains.includes(e) &&
            e.relevanceScore >= 10
        )
        .slice(0, 4);

      console.log(`   Selected events breakdown:`);
      console.log(
        `     Same domain (${triggerAnalysis.primaryDomain}): ${sameDomain.length}`
      );
      console.log(`     Related domains: ${relatedDomains.length}`);
      console.log(`     Diverse/exploratory: ${diverseEvents.length}`);

      relevantEvents.push(...sameDomain, ...relatedDomains, ...diverseEvents);

      // Step 6: Generate cascade with custom prompt emphasizing relevance and causation
      console.log("🧠 Using Claude to generate smart cascade...");

      const eventsForClaude = relevantEvents.map((event) => ({
        event_title: event.title,
        event_slug: event.slug,
        event_url: `https://polymarket.com/event/${event.slug}`,
        volume: event.volume,
        liquidity: event.liquidity,
        markets_count: event.markets_count,
        relevance_score: event.relevanceScore || 100, // Trigger event has max relevance
      }));

      const prompt = `You are a prediction market analyst. Generate 1 cascade scenario using the PRIMARY TRIGGER EVENT and other REAL Polymarket events provided below.

PRIMARY TRIGGER EVENT (MUST use this as the main triggering event):
{
  "event_title": "${triggerEvent.title}",
  "event_slug": "${triggerEvent.slug}",
  "event_url": "https://polymarket.com/event/${triggerEvent.slug}",
  "domain": "${triggerAnalysis.primaryDomain}",
  "volume": ${triggerEvent.volume},
  "liquidity": ${triggerEvent.liquidity},
  "markets_count": ${triggerEvent.markets_count}
}

OTHER REAL ACTIVE POLYMARKET EVENTS (SORTED BY RELEVANCE - use these for cascade effects):
${JSON.stringify(eventsForClaude, null, 2)}

UNDERSTANDING THE DATA:
- Events are PRE-SORTED by relevance_score (100 = most relevant, lower = less relevant)
- Higher relevance_score means STRONGER logical connection to the trigger event
- You MUST use high-scoring events (>50) for primary/secondary effects
- Only use lower-scoring events (<50) for tertiary effects if there's a genuine causal chain

DOMAIN: ${triggerAnalysis.primaryDomain}
KEY TOPICS: ${triggerAnalysis.keywords.slice(0, 8).join(", ")}

CRITICAL CASCADE RULES:

1. **RELEVANCE-BASED SELECTION**:
   - Primary effects: ONLY use events with relevance_score >50 (top events from same domain)
   - Secondary effects: Use events with relevance_score >30 (related domains)
   - Tertiary effects: Can use events with relevance_score >15 (diverse/exploratory)
   - EXPLORE THE FULL EVENT LIST - don't just use the first few high-volume events
   - AVOID using the same events across multiple cascades (look for variety)

2. **STRONG CAUSAL RELATIONSHIPS**:
   - Each effect must have DIRECT, LOGICAL causation from the trigger
   - Explain the mechanism: "X causes Y because [specific reason]"
   - Avoid weak connections like "sentiment" or "market psychology" unless specific
   - Example GOOD: "GTA VI release → Gaming hardware sales increase" (direct consumer behavior)
   - Example BAD: "GTA VI release → Bitcoin price" (no clear mechanism)

3. **DOMAIN COHERENCE**:
   - Stay within the same domain or closely related domains
   - ENTERTAINMENT → TECH is logical (e.g., game release → gaming stock)
   - ENTERTAINMENT → CRYPTO is weak unless specific mechanism exists
   - ENTERTAINMENT → POLITICAL is very weak, avoid unless extremely clear reason

4. **REALISTIC TIMEFRAMES**:
   - Primary (0-15min): Only events with immediate, direct impact
   - Secondary (15min-2hrs): Events affected by primary through clear mechanisms
   - Tertiary (2-24hrs): Delayed effects with multi-step causation

5. **QUALITY OVER QUANTITY**:
   - Better to have 1-2 highly relevant effects than 5 weak ones
   - If you cannot find strongly related events, use FEWER effects
   - Empty cascade is better than forced/weak connections

Focus on:

1. **Direct causation**: Clear, specific mechanisms (supply/demand, consumer behavior, policy changes)
2. **Domain expertise**: Use domain-specific knowledge (${
        triggerAnalysis.primaryDomain
      })
3. **Realistic timelines**: Immediate market reactions, not theoretical long-term speculation
4. **Stakeholder impact**: Who is directly affected and how do they respond?

For the cascade, provide:
- **name**: Compelling, specific title related to the trigger event
- **description**: 1-2 sentences explaining the cascade
- **category**: One of [POLITICAL, ECONOMIC, TECH, CRYPTO, SOCIAL, GEOPOLITICAL, CLIMATE]
- **severity**: 1-10
- **event_headline**: One sentence describing what happens with "${
        triggerEvent.title
      }"
- **impact_thesis**: 1-2 sentence explanation of how this trigger creates a cascade
- **cascade_chains**: Array of 1-2 cascade chains (very concise)
- **primary_effects**: 2 markets with IMMEDIATE impact from the trigger (0-15 min)
- **secondary_effects**: 2 markets affected BY primary (15min-2hrs)
- **tertiary_effects**: 1 market with DELAYED impact (2-24hrs)
- **market_relationships**: Array showing market dependencies
- **key_risks**: 2-3 risks
- **educational_takeaway**: One key lesson

CRITICAL: Keep ALL text fields SHORT:
- Descriptions, reasons, mechanisms: MAX 1 sentence (10-15 words)
- Headlines, takeaways: MAX 1 sentence
- Rationales: MAX 1 sentence

IMPORTANT: Classify effects by TIMING and CAUSALITY:
- Primary = Direct, immediate effects from the trigger event
- Secondary = Markets affected BY primary market movements
- Tertiary = Downstream markets affected BY secondary movements

CRITICAL RULES - ABSOLUTE REQUIREMENTS:

1. EVENT-LEVEL REFERENCES ONLY:
   - Every effect MUST reference an EVENT from the list above
   - Use event_slug as market_id (NOT individual market slugs)
   - Use event_title as market_name (the broad question)
   - Use event_url as market_url (points to the event page)
   - event_headline should describe what happens with "${triggerEvent.title}"

2. EXACT EVENT MATCHING - NO EXCEPTIONS:
   - Every market_id MUST be EXACTLY an "event_slug" from the events list above
   - Use the EXACT "event_title" as "market_name" - copy it VERBATIM, CHARACTER-FOR-CHARACTER
   - Include the EXACT "event_url" for each effect
   - DO NOT create custom slugs or URLs

3. FORBIDDEN MODIFICATIONS:
   - ❌ DO NOT modify, paraphrase, abbreviate, or rephrase event titles
   - ❌ DO NOT add specifics that aren't in the original event title
   - ❌ DO NOT change wording to make it "sound better"
   - ❌ DO NOT reference individual markets within events
   - ✅ ONLY copy the exact "event_title" field from the JSON above

4. VERIFICATION CHECKLIST (you must verify BEFORE including an event):
   - [ ] Is the market_id an event_slug from the list?
   - [ ] Is the market_name copied EXACTLY from the "event_title" field?
   - [ ] Does the URL match the "event_url" field exactly?
   - [ ] If ANY answer is NO, DO NOT use this event

5. CROSS-EVENT CASCADES:
   - The PRIMARY TRIGGER EVENT should be the initiating event
   - Ensure causal relationships from the trigger are genuine and logical
   - The trigger event MUST logically affect the primary effects
   - Primary effects MUST logically affect secondary effects

6. QUALITY OVER QUANTITY:
   - Better to have 1-2 effects with EXACT event titles than 5 effects with modified titles
   - If you cannot find suitable events, use fewer effects

Return ONLY valid JSON object (no markdown, no extra text):
{
  "name": "Sophisticated Cascade Title",
  "description": "2-3 sentences explaining the cascade mechanism and why it matters",
  "category": "POLITICAL",
  "severity": 7,
  "event_headline": "One sentence summary of what happens with the trigger event",
  "impact_thesis": "2-3 sentences explaining how this cascade unfolds through non-obvious mechanisms",
  "cascade_chains": [
    {
      "chain": "Trigger Event → Market B → Market C",
      "rationale": "Detailed explanation of this cascade chain",
      "timeline_estimate": "Hours/Days/Weeks"
    }
  ],
  "primary_effects": [
    {
      "market_id": "event-slug-from-events-list",
      "market_name": "Exact event_title from events list",
      "market_url": "exact-event_url-from-events-list",
      "direction": "UP",
      "magnitude_percent": 15,
      "timing": "0-15 min",
      "confidence": 0.80,
      "reason": "Brief reason",
      "cascade_level": 1
    }
  ],
  "secondary_effects": [
    {
      "market_id": "different-event-slug-from-events-list",
      "market_name": "Exact event_title from events list",
      "market_url": "exact-event_url-from-events-list",
      "direction": "DOWN",
      "magnitude_percent": 10,
      "timing": "15min-2hrs",
      "confidence": 0.65,
      "reason": "Brief reason",
      "cascade_level": 2,
      "triggered_by": "event-slug-from-events-list"
    }
  ],
  "tertiary_effects": [
    {
      "market_id": "another-event-slug-from-events-list",
      "market_name": "Exact event_title from events list",
      "market_url": "exact-event_url-from-events-list",
      "direction": "UP",
      "magnitude_percent": 5,
      "timing": "2-24hrs",
      "confidence": 0.55,
      "reason": "Brief reason",
      "cascade_level": 3,
      "triggered_by": "different-event-slug-from-events-list"
    }
  ],
  "market_relationships": [
    {
      "source_market": "event-slug-from-events-list",
      "target_market": "different-event-slug-from-events-list",
      "relationship_type": "causes",
      "mechanism": "Brief mechanism",
      "time_delay": "15-30min",
      "strength": 0.7,
      "confidence": 0.70
    }
  ],
  "key_risks": [
    "Risk 1 that could disrupt the cascade",
    "Risk 2 that could change the outcome"
  ],
  "educational_takeaway": "Key lesson about prediction markets or cascade effects",
  "cascade_metadata": {
    "total_markets_affected": 9,
    "max_cascade_depth": 3,
    "estimated_total_duration": "6-24 hours",
    "primary_domain": "CRYPTO",
    "cross_domain_effects": ["ECONOMIC"]
  }
}`;

      let response;
      try {
        response = await claudeService.generateStructuredResponse(prompt, {
          maxTokens: 16384,
          model: "claude-sonnet-4-5-20250929",
        });

        // Clean up the response in case Claude adds markdown formatting
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "");
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
        }

        const cascadeData = JSON.parse(cleanedResponse);

        // Validate the cascade
        console.log("🔍 Validating generated cascade...");
        const validation = this.validateCascade(cascadeData, relevantEvents);

        if (!validation.valid) {
          console.error(`❌ Cascade validation FAILED:`);
          validation.errors.forEach((err) => console.error(`   ${err}`));
          throw new Error(
            "Generated cascade failed validation. Please try again."
          );
        }

        console.log(`✅ Cascade "${cascadeData.name}" passed validation`);

        // Transform into database format
        const cascade = {
          id: crypto.randomUUID(),
          name: cascadeData.name,
          description: cascadeData.description,
          category: cascadeData.category,
          severity: cascadeData.severity,
          status: "LIVE",
          event_data: JSON.stringify({
            event_headline: cascadeData.event_headline,
            impact_thesis: cascadeData.impact_thesis,
            cascade_chains: cascadeData.cascade_chains,
            primary_effects: cascadeData.primary_effects || [],
            secondary_effects: cascadeData.secondary_effects || [],
            tertiary_effects: cascadeData.tertiary_effects || [],
            market_relationships: cascadeData.market_relationships || [],
            market_impact_forecast: [
              ...(cascadeData.primary_effects || []),
              ...(cascadeData.secondary_effects || []),
              ...(cascadeData.tertiary_effects || []),
            ],
            cascade_metadata: cascadeData.cascade_metadata || {
              total_markets_affected:
                (cascadeData.primary_effects?.length || 0) +
                (cascadeData.secondary_effects?.length || 0) +
                (cascadeData.tertiary_effects?.length || 0),
              max_cascade_depth: 3,
              estimated_total_duration: "hours-days",
            },
            key_risks: cascadeData.key_risks,
            educational_takeaway: cascadeData.educational_takeaway,
            generated_at: new Date().toISOString(),
            generator: "claude-custom-event",
            custom_trigger_event: {
              title: triggerEvent.title,
              slug: triggerEvent.slug,
              url: `https://polymarket.com/event/${triggerEvent.slug}`,
            },
          }),
          created_at: Date.now(),
          resolved_at: null,
        };

        return cascade;
      } catch (error) {
        console.error("Error generating custom cascade with Claude:", error);
        if (response) {
          console.error("Raw response:", response.substring(0, 500));
        }
        throw error;
      }
    } catch (error) {
      console.error("❌ Error generating custom cascade:", error);
      throw error;
    }
  }

  /**
   * Validate confidence thresholds for cascade effects
   */
  validateConfidenceThresholds(cascade) {
    const errors = [];
    const thresholds = {
      primary: 0.75,
      secondary: 0.65,
      tertiary: 0.60  // Raised from 0.55 to prevent weak speculative connections
    };

    // Check primary effects
    if (cascade.primary_effects) {
      cascade.primary_effects.forEach((effect, i) => {
        if (effect.confidence < thresholds.primary) {
          errors.push(
            `Primary effect ${i + 1}: Confidence ${effect.confidence} below minimum ${thresholds.primary}`
          );
        }
      });
    }

    // Check secondary effects
    if (cascade.secondary_effects) {
      cascade.secondary_effects.forEach((effect, i) => {
        if (effect.confidence < thresholds.secondary) {
          errors.push(
            `Secondary effect ${i + 1}: Confidence ${effect.confidence} below minimum ${thresholds.secondary}`
          );
        }
      });
    }

    // Check tertiary effects
    if (cascade.tertiary_effects) {
      cascade.tertiary_effects.forEach((effect, i) => {
        if (effect.confidence < thresholds.tertiary) {
          errors.push(
            `Tertiary effect ${i + 1}: Confidence ${effect.confidence} below minimum ${thresholds.tertiary}`
          );
        }
      });
    }

    return errors;
  }

  /**
   * Validate that mechanisms are strong and quantifiable
   */
  validateMechanisms(cascade) {
    const errors = [];

    // Forbidden weak mechanisms - specific vague patterns only
    const forbiddenMechanisms = [
      // Sentiment-based (vague emotional mechanisms) - KEEP THESE
      'sentiment',
      'sentiment shock',
      'regional sentiment',
      'fan sentiment',
      'general psychology',
      'market psychology',
      'zeitgeist',
      'complacency',

      // Spillover/transfer (non-specific causation) - REFINED
      'spillover',  // Vague
      'liquidity spillover',  // Vague
      'general engagement',  // Vague version - "military engagement" is OK
      'user engagement alone',  // Vague
      'attention reallocation',  // Vague

      // Uncertainty/speculation (unmeasurable mechanisms) - KEEP THESE
      'uncertainty premium',
      'compensation-seeking',
      'bettor behavior alone',

      // Social/viral (non-causal correlations) - KEEP THESE
      'goes viral',
      'viral spread',
      'trending alone',
      'media cycles alone',

      // Blockchain speculation (tenuous crypto connections) - KEEP THESE
      'payment rails',
      'in-game economies',
      'gpu compute',
      'decentralized compute',
      'blockchain adoption',
    ];

    // Check all effects for forbidden mechanisms
    const allEffects = [
      ...(cascade.primary_effects || []),
      ...(cascade.secondary_effects || []),
      ...(cascade.tertiary_effects || [])
    ];

    allEffects.forEach((effect, i) => {
      const reason = (effect.reason || '').toLowerCase();

      forbiddenMechanisms.forEach(forbidden => {
        if (reason.includes(forbidden)) {
          errors.push(
            `Effect "${effect.market_name}": Uses forbidden weak mechanism "${forbidden}". Require specific mechanisms like supply/demand, policy change, or consumer behavior.`
          );
        }
      });
    });

    // Check market relationships for weak mechanisms and missing data
    if (cascade.market_relationships) {
      cascade.market_relationships.forEach((rel, i) => {
        // Check for missing or undefined mechanism (CRITICAL BUG FIX)
        if (!rel.mechanism || rel.mechanism === 'undefined' || rel.mechanism.trim() === '') {
          errors.push(
            `Relationship ${i + 1}: Missing required "mechanism" field. Every relationship must explain HOW source affects target.`
          );
          return; // Skip further checks if mechanism is missing
        }

        const mechanism = rel.mechanism.toLowerCase();

        forbiddenMechanisms.forEach(forbidden => {
          if (mechanism.includes(forbidden)) {
            errors.push(
              `Relationship ${i + 1}: Uses forbidden weak mechanism "${forbidden}" in: "${rel.mechanism}"`
            );
          }
        });

        // Check relationship strength
        if (rel.strength && rel.strength < 0.6) {
          errors.push(
            `Relationship ${i + 1}: Strength ${rel.strength} below minimum 0.6`
          );
        }
      });
    }

    return errors;
  }

  /**
   * Validate forbidden domain crossovers
   * Blocks specific domain combinations with no plausible mechanisms
   */
  validateDomainCrossovers(cascade, events) {
    const errors = [];

    // Forbidden domain crossovers - COMPREHENSIVE blocks for implausible connections
    // RULE: Cascades should stay within ONE primary domain
    const forbiddenCrossovers = {
      'SPORTS': ['POLITICAL', 'CRYPTO', 'ECONOMIC', 'ENTERTAINMENT', 'GEOPOLITICAL'],  // Sports stays in sports
      'POLITICAL': ['SPORTS', 'ENTERTAINMENT', 'HEALTH', 'CLIMATE'],  // Politics stays political/economic
      'ENTERTAINMENT': ['CRYPTO', 'POLITICAL', 'GEOPOLITICAL', 'CLIMATE'],  // Entertainment stays entertainment
      'CLIMATE': ['POLITICAL', 'SPORTS', 'ENTERTAINMENT'],  // Climate→Energy/Economic only
      'HEALTH': ['POLITICAL', 'CRYPTO', 'ENTERTAINMENT'],  // Health→Sports only allowed
      'GEOPOLITICAL': ['SPORTS', 'ENTERTAINMENT', 'HEALTH'],  // Geopolitical stays geopolitical/economic
      'ECONOMIC': ['SPORTS', 'ENTERTAINMENT', 'HEALTH'],  // Economic stays economic
      'TECHNOLOGY': ['SPORTS', 'POLITICAL'],  // Tech→Business/Climate only
    };

    const cascadeDomain = cascade.category || cascade.cascade_metadata?.primary_domain;

    // Check all effects for forbidden crossovers
    const allEffects = [
      ...(cascade.primary_effects || []),
      ...(cascade.secondary_effects || []),
      ...(cascade.tertiary_effects || [])
    ];

    allEffects.forEach((effect) => {
      // Get domain of this effect's event
      const eventData = events.find(e => e.slug === effect.market_id);
      if (eventData) {
        const effectDomain = this.analyzeEvent(eventData).primaryDomain;

        // Check if cascade domain → effect domain is forbidden
        if (forbiddenCrossovers[cascadeDomain]?.includes(effectDomain)) {
          errors.push(
            `FORBIDDEN CROSSOVER: ${cascadeDomain} → ${effectDomain} in effect "${effect.market_name}". This connection type is explicitly blocked due to lack of plausible causal mechanism.`
          );
        }

        // Also check reverse crossover (effect could trigger effects in forbidden domains)
        if (forbiddenCrossovers[effectDomain]?.includes(cascadeDomain)) {
          errors.push(
            `FORBIDDEN REVERSE CROSSOVER: ${effectDomain} → ${cascadeDomain} detected in cascade. This connection type is explicitly blocked.`
          );
        }
      }
    });

    return errors;
  }

  /**
   * Validate that a cascade uses real events correctly
   */
  validateCascade(cascade, events) {
    const errors = [];

    // CRITICAL: Validate confidence thresholds - HARD BLOCK if violations
    const confidenceErrors = this.validateConfidenceThresholds(cascade);
    if (confidenceErrors.length > 0) {
      console.warn('❌ Cascade REJECTED due to confidence threshold violations:');
      confidenceErrors.forEach(err => console.warn(`   ${err}`));
      return { valid: false, errors: confidenceErrors };
    }

    // CRITICAL: Validate mechanisms - HARD BLOCK if forbidden mechanisms used
    const mechanismErrors = this.validateMechanisms(cascade);
    if (mechanismErrors.length > 0) {
      console.warn('❌ Cascade REJECTED due to forbidden mechanisms:');
      mechanismErrors.forEach(err => console.warn(`   ${err}`));
      return { valid: false, errors: mechanismErrors };
    }

    // CRITICAL: Validate domain crossovers - HARD BLOCK if forbidden crossovers detected
    const crossoverErrors = this.validateDomainCrossovers(cascade, events);
    if (crossoverErrors.length > 0) {
      console.warn('❌ Cascade REJECTED due to forbidden domain crossovers:');
      crossoverErrors.forEach(err => console.warn(`   ${err}`));
      return { valid: false, errors: crossoverErrors };
    }

    // Build lookup maps from events
    const eventTitles = new Set();
    const eventSlugs = new Set();
    const eventsBySlug = new Map();

    events.forEach((event) => {
      eventTitles.add(event.title);
      eventSlugs.add(event.slug);
      eventsBySlug.set(event.slug, {
        title: event.title,
        url: `https://polymarket.com/event/${event.slug}`,
      });
    });

    // Helper to validate an effect
    const validateEffect = (effect, level) => {
      if (!effect.market_id || !effect.market_name || !effect.market_url) {
        errors.push(
          `${level}: Missing required fields (market_id, market_name, or market_url)`
        );
        return false;
      }

      // Check if market_id (event slug) exists in our events
      if (!eventSlugs.has(effect.market_id)) {
        errors.push(
          `${level}: Unknown market_id "${effect.market_id}" not in provided events list`
        );
        errors.push(
          `         Available event slugs sample: ${Array.from(eventSlugs)
            .slice(0, 3)
            .join(", ")}`
        );
        return false;
      }

      // Get the actual event data
      const actualEvent = eventsBySlug.get(effect.market_id);

      // Verify market_name matches the actual event title EXACTLY (character-for-character)
      if (effect.market_name !== actualEvent.title) {
        errors.push(`${level}: market_name "${effect.market_name}"`);
        errors.push(
          `         DOES NOT MATCH actual event title "${actualEvent.title}"`
        );
        errors.push(
          `         Event titles must be EXACTLY identical - no modifications, paraphrasing, or additions.`
        );
        return false;
      }

      // Verify URL matches the event URL
      if (effect.market_url !== actualEvent.url) {
        errors.push(
          `${level}: market_url "${effect.market_url}" doesn't match expected "${actualEvent.url}"`
        );
        return false;
      }

      return true;
    };

    // Validate all effects
    let allValid = true;

    if (cascade.primary_effects) {
      cascade.primary_effects.forEach((effect, i) => {
        if (!validateEffect(effect, `Primary effect ${i + 1}`))
          allValid = false;
      });
    }

    if (cascade.secondary_effects) {
      cascade.secondary_effects.forEach((effect, i) => {
        if (!validateEffect(effect, `Secondary effect ${i + 1}`))
          allValid = false;
      });
    }

    if (cascade.tertiary_effects) {
      cascade.tertiary_effects.forEach((effect, i) => {
        if (!validateEffect(effect, `Tertiary effect ${i + 1}`))
          allValid = false;
      });
    }

    // Diversity validation: check domain frequency
    const category = cascade.category || cascade.cascade_metadata?.primary_domain;
    if (!this.shouldAllowDomain(category)) {
      errors.push(
        `Diversity Check: Too many ${category} cascades recently (max 1 per 3 cascades)`
      );
      errors.push(
        `   Recent cascade categories: ${this.recentCascades
          .slice(-3)
          .map(c => c.category)
          .join(', ')}`
      );
      allValid = false;
    }

    return { valid: allValid, errors };
  }

  /**
   * Use Claude to generate sophisticated cascade scenarios
   */
  async generateSophisticatedCascades(events, count) {
    console.log("🧠 Using Claude to generate sophisticated cascades...");

    if (events.length === 0) {
      throw new Error(
        "No active Polymarket events available. Cannot generate cascades without real event data."
      );
    }

    // Log the actual events being sent to Claude
    console.log("📊 Sample of events being sent to Claude:");
    events.slice(0, 3).forEach((e) => {
      console.log(`   - Title: "${e.title}"`);
      console.log(`     Slug: "${e.slug}"`);
      console.log(`     Markets: ${e.markets?.length || 0}`);
    });

    // Transform events to use ONLY event-level data
    // Send MUCH larger selection to Claude (75 events instead of 20) for better variety
    // This gives Claude a diverse pool across many topics and domains
    const eventsForClaude = events.slice(0, 75).map((event) => ({
      event_title: event.title,
      event_slug: event.slug,
      event_url: `https://polymarket.com/event/${event.slug}`,
      volume: event.volume,
      liquidity: event.liquidity,
      markets_count: event.markets_count,
    }));

    console.log(`📊 Sending ${eventsForClaude.length} diverse events to Claude (up from 20)`);
    console.log(`   Event variety: High-volume (${eventsForClaude.slice(0, 25).length}), Mid-volume (${eventsForClaude.slice(25, 50).length}), Lower-volume (${eventsForClaude.slice(50).length})`);

    // Build context about recent cascades for diversity
    const recentDomains = this.recentCascades.slice(-5).map(c => c.category);
    const diversityContext = recentDomains.length > 0
      ? `\n\nRECENT CASCADE HISTORY (for diversity - AVOID these domains if possible):\n${recentDomains.join(', ')}\nPrioritize DIFFERENT domains: TECHNOLOGY, HEALTH, SPORTS, ENTERTAINMENT, CLIMATE\n`
      : '';

    // Get current news context for more relevant cascades
    const newsInsights = await newsService.getNewsDrivenInsights();
    const newsContext = `\n\nCURRENT NEWS CONTEXT (use this to make cascades timely and relevant):
Current Trends: ${newsInsights.currentTrends.slice(0, 3).join('; ')}
Cross-Domain Opportunities: ${newsInsights.crossDomainOpportunities.slice(0, 3).join('; ')}
${newsInsights.timingContext}
`;

    const prompt = `Generate ${count} DIVERSE and INSIGHTFUL cascade scenarios using REAL Polymarket events below.

📊 YOU NOW HAVE ACCESS TO ${eventsForClaude.length} DIVERSE EVENTS (up from 20!)
This includes high-volume, mid-volume, and niche events across ALL domains.
EXPLORE THE FULL LIST - don't just pick the first few high-volume events.

EVENTS:
${JSON.stringify(eventsForClaude, null, 2)}${diversityContext}${newsContext}

⚠️ AUTOMATIC VALIDATION - READ CAREFULLY ⚠️
ALL cascades are validated automatically. Cascades will be IMMEDIATELY REJECTED if they violate ANY rule below.
DO NOT waste effort generating cascades that will fail validation.
FOCUS ON creating cascades that will PASS all validation checks.

🚫 FORBIDDEN TOPICS (AUTOMATIC REJECTION):
❌ **AI/ML/LLM cascades** - BANNED. Too repetitive.
❌ **Generic tech company valuations** - BANNED. Overused.
❌ **Crypto price predictions** - BANNED. Too common.
❌ **Presidential elections** - BANNED. Overused.

These topics are IMMEDIATELY REJECTED. Do NOT waste tokens on them.

DIVERSITY REQUIREMENTS (CRITICAL - STRICTLY ENFORCED):
1. **MANDATORY VARIETY** - Each of the ${count} cascades MUST use DIFFERENT domains:
   - If generating 2 cascades: Use 2 completely different domains (e.g., HEALTH + SPORTS)
   - If generating 3 cascades: Use 3 completely different domains (e.g., CLIMATE + ENTERTAINMENT + HEALTH)
   - NEVER repeat the same domain in a single generation batch

2. **PRIORITY DOMAINS** - Focus on underused domains (80% of cascades should use these):
   - ✅ CLIMATE: Weather, renewable energy, carbon markets, environmental policy
   - ✅ HEALTH: Medical breakthroughs, pharmaceutical developments, pandemic response
   - ✅ SPORTS: Championships, athlete performance, league outcomes, sporting events
   - ✅ ENTERTAINMENT: Box office, streaming, gaming, music, cultural events
   - ✅ GEOPOLITICAL: International relations, trade, conflicts (NOT elections)

3. **SEVERELY RESTRICTED DOMAINS** - Only use if explicitly different from typical topics (20% max):
   - ⚠️ TECHNOLOGY: Only if NOT about AI/ML/tech valuations (e.g., quantum computing, biotech, space)
   - ⚠️ ECONOMIC: Only if NOT about Fed rates or standard market movements (e.g., trade policy, employment)

4. **Explore the FULL ${eventsForClaude.length}-event list** - Scroll through ALL events, especially events 25-75
5. **Use niche events** - Many insightful cascades come from lower-volume events, not just mega-markets

🚫 CRITICAL RULE: STAY WITHIN ONE DOMAIN (AUTOMATIC REJECTION if violated):

**PRIMARY RULE**: Cascades must stay within their primary domain. Cross-domain effects are EXTREMELY LIMITED.

ALLOWED DOMAIN-SPECIFIC CASCADES:
✅ **SPORTS**: Sports event → Other sports championships (same sport or related sports)
   Example: "Super Bowl outcome → NFL playoffs betting → College football championship odds"

✅ **GEOPOLITICAL**: Conflict → Related conflicts → Regional economic impacts
   Example: "Middle East ceasefire collapse → Regional security → Oil supply chains"

✅ **CLIMATE**: Environmental policy → Energy markets → Renewable technology adoption
   Example: "EU carbon tax → Solar energy demand → Battery manufacturer valuations"

✅ **HEALTH**: Medical breakthrough → Related health markets → Healthcare policy
   Example: "Vaccine approval → Pandemic response → Public health funding"

✅ **ENTERTAINMENT**: Box office → Streaming competition → Related entertainment markets
   Example: "Movie release → Theater attendance → Streaming subscriber growth"

FORBIDDEN CROSS-DOMAIN JUMPS (will cause IMMEDIATE REJECTION):
❌ SPORTS → POLITICAL / ECONOMIC / ENTERTAINMENT / GEOPOLITICAL
❌ GEOPOLITICAL → SPORTS / ENTERTAINMENT / HEALTH
❌ ENTERTAINMENT → POLITICAL / GEOPOLITICAL / CRYPTO
❌ CLIMATE → SPORTS / ENTERTAINMENT / POLITICAL

**Why these are forbidden**: Betting market "liquidity shifts" and "viewer engagement" are NOT valid causal mechanisms.
They are correlations, not causations. Do NOT use them to justify cross-domain connections.

MINIMUM CONFIDENCE REQUIREMENTS (AUTOMATIC REJECTION if violated):
• Primary effects: ≥0.75 confidence
• Secondary effects: ≥0.65 confidence
• Tertiary effects: ≥0.60 confidence (raised to prevent speculation)
• Relationship strength: ≥0.6
• Relationship mechanism: REQUIRED field (cannot be empty or undefined)

⚠️ VALIDATION ENFORCEMENT:
The system will AUTOMATICALLY check every effect's confidence level.
ANY effect below these thresholds will cause IMMEDIATE cascade rejection.
DO NOT include low-confidence effects hoping they will pass - they WON'T.

REQUIRED MECHANISM QUALITY (AUTOMATIC REJECTION if violated):
✅ **Quantifiable**: Supply/demand shifts, policy changes, consumer behavior, liquidity flows, military actions
✅ **Direct**: Clear transmission path with <2 intermediate steps
✅ **Evidence-based**: Historical precedent or economic theory supports the link
✅ **Specific**: Name the exact market structure, stakeholder action, or causal pathway

FORBIDDEN VAGUE MECHANISMS (will cause rejection):
❌ "sentiment" / "market psychology" / "zeitgeist" (emotional contagion)
❌ "spillover" / "general engagement" (no specific transmission)
❌ "uncertainty premium" / "bettor behavior" (unmeasurable speculation)
❌ "goes viral" / "trending" (social media correlation without causation)

ALLOWED SPECIFIC MECHANISMS:
✅ "military engagement" = armed conflict (specific geopolitical action)
✅ "betting platform traffic from specific event" = measurable user activity
✅ "supply chain disruption from conflict" = quantifiable economic impact
✅ "policy change triggering regulatory response" = clear institutional action

3-STEP CAUSATION TEST (all must be answerable with specifics):
1. If the trigger happens, what SPECIFIC action do stakeholders take?
2. Why does that action DIRECTLY affect the target market?
3. What is the MEASURABLE magnitude and timeline?

If you cannot answer all 3 questions with concrete specifics, DO NOT include the effect.

STRONG CAUSAL EXAMPLES:
✅ GOOD: "Fed rate cut → Bitcoin rally (0.85)"
   Mechanism: "Lower rates reduce dollar yield, increasing crypto demand as alternative store of value"
   ✓ Quantifiable (yield differential), Direct (monetary policy→asset prices), Evidence-based (2020-2021 precedent)

✅ GOOD: "Climate policy → Solar company valuations → Energy grid modernization (0.78)"
   Mechanism: "Carbon tax increases solar subsidy economics, driving installation demand and grid upgrades"
   ✓ Quantifiable (subsidy $/kW), Direct (policy→economics), Evidence-based (EU renewable transition)

❌ BAD: "Presidential nomination → Super Bowl outcome (0.40)"
   Mechanism: "Regional sentiment affects betting patterns"
   ✗ Vague (sentiment), No quantifiable link, Extremely weak confidence

❌ BAD: "Sports championship → Political election (0.65)"
   Mechanism: "Major upset increases uncertainty premium in all prediction markets"
   ✗ Forbidden mechanism (uncertainty premium), No direct causation

INSIGHTFULNESS REQUIREMENTS:
1. **Non-obvious mechanisms** - Explain WHY X causes Y with specific quantifiable logic
2. **Real-world impact** - Focus on tangible effects on people, markets, industries
3. **Cross-domain thinking** - ONLY allowed crossovers: Tech↔Climate, Tech↔Health, Health↔Sports
4. **Current relevance** - Base cascades on the NEWS CONTEXT provided above
5. **News grounding** - REQUIRED: Include news_context field explaining which news/trends support your cascade

VALID SINGLE-DOMAIN CASCADE PATTERNS:
- **SPORTS**: Championship → Playoff odds → Draft prospects → League expansion
- **GEOPOLITICAL**: Conflict escalation → Regional stability → Trade disruption → Diplomatic summits
- **CLIMATE**: Policy change → Energy costs → Renewable adoption → Technology valuations
- **HEALTH**: Drug approval → Treatment protocols → Hospital capacity → Insurance markets
- **ENTERTAINMENT**: Box office → Streaming wars → Production budgets → Theater industry

VERY LIMITED ALLOWED CROSSOVERS (use sparingly, <10% of cascades):
- HEALTH → SPORTS (only for performance medicine, injury treatment)
- CLIMATE → ECONOMIC (only for energy costs, carbon markets)
- TECHNOLOGY → ECONOMIC (only for company valuations, sector growth)

ALL OTHER CROSSOVERS ARE FORBIDDEN

TECHNICAL REQUIREMENTS:
- Use EXACT event_title as market_name (copy verbatim)
- Use EXACT event_slug as market_id
- Use EXACT event_url
- Keep all text concise (1 sentence max)

CASCADE STRUCTURE (REALISTIC TIMESCALES):
- Primary effects (1-7 days): Immediate market response to trigger event
- Secondary effects (1-4 weeks): Industry adaptation and ripple effects
- Tertiary effects (1-6 months): Long-term structural changes and downstream impacts

⏱️ TIMING REALISM REQUIREMENT:
Real-world cascades don't happen in minutes or hours. They unfold over days, weeks, and months.
- FDA approval → Championship odds shift: Takes WEEKS for teams to implement new tech
- AI breakthrough → Market cap changes: Takes DAYS for enterprise contracts to materialize
- Climate policy → Energy markets: Takes MONTHS for infrastructure buildout

Use realistic timescales that reflect actual business/regulatory/adoption cycles.

EXAMPLE - CORRECT vs INCORRECT:
✅ CORRECT:
   Event in list: {
     "event_title": "Super Bowl Champion 2026",
     "event_slug": "super-bowl-champion-2026-731",
     "event_url": "https://polymarket.com/event/super-bowl-champion-2026-731",
     "volume": 512510985.194088,
     "markets_count": 33
   }

   Your JSON: {
     "event_headline": "Major NFL championship outcome affects sports betting markets",
     "primary_effects": [{
       "market_id": "super-bowl-champion-2026-731",
       "market_name": "Super Bowl Champion 2026",
       "market_url": "https://polymarket.com/event/super-bowl-champion-2026-731",
       "direction": "UP",
       ...
     }]
   }

❌ INCORRECT - Using individual market within event:
   Your JSON: {
     "market_id": "will-the-arizona-cardinals-win-super-bowl-2026",
     "market_name": "Will the Arizona Cardinals win Super Bowl 2026?",
     ...
   }
   PROBLEM: This references a specific outcome within an event, not the event itself. FORBIDDEN.

❌ INCORRECT - Modified event title:
   Your JSON: {
     "market_id": "super-bowl-champion-2026-731",
     "market_name": "Who will win Super Bowl 2026?",
     ...
   }
   PROBLEM: Modified the event title. Must use EXACT title "Super Bowl Champion 2026".

Return JSON array (no markdown):
[{
  "name": "Creative Cascade Title",
  "description": "1-2 sentences explaining the cascade",
  "category": "TECHNOLOGY|HEALTH|SPORTS|ENTERTAINMENT|CLIMATE|ECONOMIC|GEOPOLITICAL",
  "severity": 7,
  "event_headline": "One sentence triggering event",
  "impact_thesis": "1-2 sentences explaining cascade logic",
  "cascade_chains": [{"chain": "Event A → Event B → Event C", "rationale": "Brief explanation", "timeline_estimate": "2-4 weeks"}],
  "primary_effects": [{
    "market_id": "exact-event-slug",
    "market_name": "Exact event_title (copy verbatim)",
    "market_url": "exact-event-url",
    "direction": "UP|DOWN",
    "magnitude_percent": 15,
    "timing": "2-5 days",
    "confidence": 0.80,
    "reason": "One sentence mechanism with specific quantifiable impact",
    "cascade_level": 1
  }],
  "secondary_effects": [{
    "market_id": "different-event-slug",
    "market_name": "Exact event_title (copy verbatim)",
    "market_url": "different-event-url",
    "direction": "DOWN",
    "magnitude_percent": 10,
    "timing": "1-3 weeks",
    "confidence": 0.68,
    "reason": "One sentence cause with clear transmission mechanism",
    "cascade_level": 2,
    "triggered_by": "first-event-slug"
  }],
  "tertiary_effects": [{
    "market_id": "third-event-slug",
    "market_name": "Exact event_title (copy verbatim)",
    "market_url": "third-event-url",
    "direction": "UP",
    "magnitude_percent": 5,
    "timing": "2-4 months",
    "confidence": 0.62,
    "reason": "One sentence downstream effect with measurable impact pathway",
    "cascade_level": 3,
    "triggered_by": "second-event-slug"
  }],
  "market_relationships": [{
    "source_market": "event-slug",
    "target_market": "other-event-slug",
    "relationship_type": "causes",
    "mechanism": "REQUIRED: One specific sentence explaining HOW source affects target with quantifiable transmission",
    "time_delay": "3-7 days",
    "strength": 0.7,
    "confidence": 0.70
  }],
  "key_risks": ["Risk 1", "Risk 2"],
  "educational_takeaway": "One key insight about markets",
  "news_context": {
    "primary_news_source": "Brief description of main news/trend this cascade is based on",
    "supporting_trends": ["Trend 1", "Trend 2"],
    "relevance": "How current events make this cascade timely and plausible"
  },
  "cascade_metadata": {
    "total_markets_affected": 5,
    "max_cascade_depth": 3,
    "estimated_total_duration": "2-6 months",
    "primary_domain": "TECHNOLOGY",
    "cross_domain_effects": ["CLIMATE", "ECONOMIC"]
  }
}]`;

    let response;
    try {
      response = await claudeService.generateStructuredResponse(prompt, {
        maxTokens: 16384, // Max for Haiku 4.5
        model: "claude-sonnet-4-5-20250929",
      });

      // Clean up the response in case Claude adds markdown formatting
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }

      const cascadesData = JSON.parse(cleanedResponse);

      // Validate each cascade before saving
      console.log("🔍 Validating generated cascades...");
      const validatedCascades = [];

      for (let i = 0; i < cascadesData.length; i++) {
        const cascade = cascadesData[i];
        console.log(`\n🔍 Validating cascade ${i + 1}: "${cascade.name}"`);

        const validation = this.validateCascade(cascade, events);

        if (validation.valid) {
          console.log(`✅ Cascade "${cascade.name}" passed validation`);
          validatedCascades.push(cascade);
        } else {
          console.warn(`❌ Cascade "${cascade.name}" FAILED validation:`);
          validation.errors.forEach((err) => console.warn(`   ${err}`));

          // Log the problematic effects for debugging
          if (cascade.primary_effects) {
            console.warn(`   Primary effects attempted:`);
            cascade.primary_effects.forEach((e, idx) => {
              console.warn(
                `     ${idx + 1}. Slug: "${e.market_id}", Question: "${
                  e.market_name
                }"`
              );
            });
          }

          console.warn(`   ⚠️  This cascade will NOT be saved or displayed.`);
        }
      }

      if (validatedCascades.length === 0) {
        throw new Error(
          "No valid cascades generated. All cascades failed validation. Please try again."
        );
      }

      console.log(
        `✅ ${validatedCascades.length}/${cascadesData.length} cascades passed validation`
      );

      // Transform into database format
      const cascades = validatedCascades.map((cascade) => ({
        id: crypto.randomUUID(),
        name: cascade.name,
        description: cascade.description,
        category: cascade.category,
        severity: cascade.severity,
        status: "LIVE",
        event_data: JSON.stringify({
          event_headline: cascade.event_headline,
          impact_thesis: cascade.impact_thesis,
          cascade_chains: cascade.cascade_chains,

          // Multi-level effects
          primary_effects: cascade.primary_effects || [],
          secondary_effects: cascade.secondary_effects || [],
          tertiary_effects: cascade.tertiary_effects || [],

          // Market relationships
          market_relationships: cascade.market_relationships || [],

          // Legacy field for backward compatibility
          market_impact_forecast: [
            ...(cascade.primary_effects || []),
            ...(cascade.secondary_effects || []),
            ...(cascade.tertiary_effects || []),
          ],

          // Metadata
          cascade_metadata: cascade.cascade_metadata || {
            total_markets_affected:
              (cascade.primary_effects?.length || 0) +
              (cascade.secondary_effects?.length || 0) +
              (cascade.tertiary_effects?.length || 0),
            max_cascade_depth: 3,
            estimated_total_duration: "hours-days",
          },

          key_risks: cascade.key_risks,
          educational_takeaway: cascade.educational_takeaway,
          generated_at: new Date().toISOString(),
          generator: "claude-mcp-v2",
        }),
        created_at: Date.now(),
        resolved_at: null,
      }));

      // Track cascades for diversity monitoring
      validatedCascades.forEach(cascade => {
        this.trackCascade(cascade);
      });

      return cascades;
    } catch (error) {
      console.error("Error generating cascades with Claude:", error);
      if (response) {
        console.error("Raw response:", response.substring(0, 500));
      }
      throw error;
    }
  }
}

export const cascadeGenerator = new CascadeGeneratorService();
