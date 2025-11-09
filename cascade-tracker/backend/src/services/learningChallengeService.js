import { getDb } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import { polymarketApi } from './polymarketApiService.js';
import { claudeService } from './claudeService.js';

/**
 * Learning Challenge Service
 * Manages educational challenges for the Learn section
 */

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  beginner: {
    minLevel: 1,
    minVolume: 100000, // High volume markets for clearer trends
    minLiquidity: 50000,
    pointsMultiplier: 1.0,
    maxChallenges: 5
  },
  intermediate: {
    minLevel: 3,
    minVolume: 50000, // Medium volume
    minLiquidity: 25000,
    pointsMultiplier: 1.5,
    maxChallenges: 8,
    requiresAccuracy: 0.70, // 70% accuracy on 5+ beginner challenges
    requiresBeginnerCount: 5
  },
  advanced: {
    minLevel: 6,
    minVolume: 10000, // Lower volume, more complex
    minLiquidity: 5000,
    pointsMultiplier: 2.5,
    maxChallenges: 10,
    requiresAccuracy: 0.65, // 65% on 10+ intermediate
    requiresIntermediateCount: 10
  },
  expert: {
    minLevel: 9,
    minVolume: 1000, // Low volume, high uncertainty
    minLiquidity: 500,
    pointsMultiplier: 4.0,
    maxChallenges: 15,
    requiresAccuracy: 0.60, // 60% on 15+ advanced
    requiresAdvancedCount: 15
  }
};

class LearningChallengeService {
  /**
   * Generate a new learning challenge from Polymarket markets
   */
  async generateChallenge(difficulty = 'beginner', category = null) {
    const db = getDb();
    const config = DIFFICULTY_CONFIG[difficulty];

    if (!config) {
      throw new Error(`Invalid difficulty level: ${difficulty}`);
    }

    try {
      // Find suitable market from Polymarket
      const markets = await this._findSuitableMarkets(difficulty, category, config);

      if (!markets || markets.length === 0) {
        throw new Error(`No suitable markets found for ${difficulty} ${category || 'any category'}`);
      }

      // Select a random market
      const market = markets[Math.floor(Math.random() * markets.length)];

      // Generate educational content using Claude
      const educationalContent = await claudeService.generateEducationalContent(market, difficulty);

      // Create challenge record
      const challengeId = uuidv4();
      const challenge = {
        id: challengeId,
        title: market.question,
        description: `Predict the outcome of this ${category || market.category || 'market'} prediction market`,
        category: category || market.category || 'General',
        difficulty_level: difficulty,
        min_user_level: config.minLevel,
        market_id: market.id || market.slug,
        market_slug: market.slug,
        market_question: market.question,
        market_data: JSON.stringify({
          volume: market.volume,
          liquidity: market.liquidity,
          current_odds: market.outcomePrices || market.outcomes,
          outcomes: market.outcomes,
          end_date: market.endDate,
          category: market.category,
          image: market.image
        }),
        educational_content: JSON.stringify(educationalContent),
        status: 'active'
      };

      const stmt = db.prepare(`
        INSERT INTO learning_challenges (
          id, title, description, category, difficulty_level, min_user_level,
          market_id, market_slug, market_question, market_data, educational_content, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        challenge.id,
        challenge.title,
        challenge.description,
        challenge.category,
        challenge.difficulty_level,
        challenge.min_user_level,
        challenge.market_id,
        challenge.market_slug,
        challenge.market_question,
        challenge.market_data,
        challenge.educational_content,
        challenge.status
      );

      // Add to resolution queue
      await this._addToResolutionQueue(market);

      return this.getChallengeById(challengeId);
    } catch (error) {
      console.error('Error generating challenge:', error);
      throw error;
    }
  }

  /**
   * Get all available challenges filtered by user level
   */
  async getAvailableChallenges(userLevel = 1, category = null, difficulty = null) {
    const db = getDb();

    let query = `
      SELECT * FROM learning_challenges
      WHERE status = 'resolved' AND min_user_level <= ? AND resolution_outcome IS NOT NULL
    `;

    const params = [userLevel];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const challenges = stmt.all(...params);

    return challenges.map(this._parseChallenge);
  }

  /**
   * Get challenge by ID
   */
  getChallengeById(challengeId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM learning_challenges WHERE id = ?');
    const challenge = stmt.get(challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    return this._parseChallenge(challenge);
  }

  /**
   * Check if a difficulty level is unlocked for a user
   */
  async isDifficultyUnlocked(userId, difficulty) {
    const db = getDb();
    const stmt = db.prepare('SELECT unlocked_difficulties FROM learning_progress WHERE user_id = ?');
    const progress = stmt.get(userId);

    if (!progress) {
      return difficulty === 'beginner'; // Beginner always unlocked
    }

    const unlocked = JSON.parse(progress.unlocked_difficulties || '["beginner"]');
    return unlocked.includes(difficulty);
  }

  /**
   * Find suitable markets from Polymarket based on criteria
   */
  async _findSuitableMarkets(difficulty, category, config) {
    try {
      // Get trending markets
      let markets = await polymarketApi.getTrendingMarkets();

      // Filter by volume and liquidity
      markets = markets.filter(m =>
        (m.volume || 0) >= config.minVolume &&
        (m.liquidity || 0) >= config.minLiquidity &&
        m.active !== false
      );

      // Filter by category if specified
      if (category) {
        markets = markets.filter(m =>
          m.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      // For beginner, prefer markets with clearer odds (not too close to 50/50)
      if (difficulty === 'beginner') {
        markets = markets.filter(m => {
          const odds = m.outcomePrices?.[0] || m.probability || 50;
          return Math.abs(odds - 50) > 15; // At least 15% away from 50/50
        });
      }

      // For advanced/expert, prefer markets with closer odds (more uncertain)
      if (difficulty === 'advanced' || difficulty === 'expert') {
        markets = markets.filter(m => {
          const odds = m.outcomePrices?.[0] || m.probability || 50;
          return Math.abs(odds - 50) < 20; // Within 20% of 50/50
        });
      }

      return markets.slice(0, 10); // Return top 10 candidates
    } catch (error) {
      console.error('Error finding suitable markets:', error);
      throw error;
    }
  }

  /**
   * Add market to resolution queue for monitoring
   */
  async _addToResolutionQueue(market) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO market_resolution_queue (market_id, market_slug, status)
      VALUES (?, ?, 'pending')
    `);

    stmt.run(market.id || market.slug, market.slug);
  }

  /**
   * Parse challenge from database row
   */
  _parseChallenge(row) {
    return {
      ...row,
      market_data: JSON.parse(row.market_data || '{}'),
      educational_content: JSON.parse(row.educational_content || '{}')
    };
  }

  /**
   * Resolve a challenge with outcome
   */
  async resolveChallenge(challengeId, outcome) {
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE learning_challenges
      SET status = 'resolved', resolution_outcome = ?, resolved_at = ?
      WHERE id = ?
    `);

    const now = Math.floor(Date.now() / 1000);
    stmt.run(outcome, now, challengeId);

    return this.getChallengeById(challengeId);
  }

  /**
   * Get challenges by status
   */
  getChallengesByStatus(status = 'active') {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM learning_challenges WHERE status = ? ORDER BY created_at DESC');
    const challenges = stmt.all(status);

    return challenges.map(this._parseChallenge);
  }

  /**
   * Get challenge categories
   */
  getCategories() {
    const db = getDb();
    const stmt = db.prepare('SELECT DISTINCT category FROM learning_challenges ORDER BY category');
    const results = stmt.all();

    return results.map(r => r.category);
  }

  /**
   * Get challenge statistics
   */
  getChallengeStats(challengeId) {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_predictions,
        SUM(CASE WHEN predicted_outcome = 'yes' THEN 1 ELSE 0 END) as yes_count,
        SUM(CASE WHEN predicted_outcome = 'no' THEN 1 ELSE 0 END) as no_count,
        AVG(confidence_level) as avg_confidence
      FROM learning_predictions
      WHERE challenge_id = ?
    `);

    return stmt.get(challengeId);
  }
}

export const learningChallengeService = new LearningChallengeService();
