import { getDb } from '../utils/db.js';
import { polymarketApi } from './polymarketApiService.js';
import { learningChallengeService } from './learningChallengeService.js';
import { learningProgressService } from './learningProgressService.js';
import { claudeService } from './claudeService.js';

/**
 * Market Resolution Service
 * Monitors Polymarket markets and automatically resolves learning challenges
 */

const POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes
const CLEANUP_AFTER_DAYS = 7; // Clean up resolved markets after 7 days

class MarketResolutionService {
  constructor() {
    this.pollingTimer = null;
    this.isPolling = false;
  }

  /**
   * Start the automated polling job
   */
  startPolling() {
    if (this.pollingTimer) {
      console.log('⏰ Market resolution polling already running');
      return;
    }

    console.log('✅ Starting market resolution polling (every 15 minutes)');

    // Run immediately on start
    this.pollMarketResolutions().catch(err =>
      console.error('Error in initial polling:', err)
    );

    // Then run every 15 minutes
    this.pollingTimer = setInterval(() => {
      this.pollMarketResolutions().catch(err =>
        console.error('Error in scheduled polling:', err)
      );
    }, POLLING_INTERVAL);
  }

  /**
   * Stop the polling job
   */
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log('⏹️  Market resolution polling stopped');
    }
  }

  /**
   * Poll Polymarket API for market resolutions
   */
  async pollMarketResolutions() {
    if (this.isPolling) {
      console.log('⏭️  Skipping poll - already in progress');
      return;
    }

    this.isPolling = true;
    console.log('🔄 Polling for market resolutions...');

    try {
      const db = getDb();

      // Get all pending markets from queue
      const stmt = db.prepare(`
        SELECT * FROM market_resolution_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `);

      const pendingMarkets = stmt.all();
      console.log(`   Found ${pendingMarkets.length} pending markets to check`);

      let resolvedCount = 0;
      let errorCount = 0;

      for (const queueItem of pendingMarkets) {
        try {
          // Fetch current market status from Polymarket
          const market = await polymarketApi.getMarket(queueItem.market_slug);

          if (!market) {
            console.log(`   ⚠️  Market ${queueItem.market_slug} not found`);
            continue;
          }

          // Check if market is closed/resolved
          const isClosed = market.closed || market.active === false || market.status === 'CLOSED';

          if (isClosed) {
            console.log(`   ✅ Market resolved: ${queueItem.market_slug}`);

            // Determine outcome
            const outcome = this._determineOutcome(market);

            // Resolve associated challenges
            await this._resolveChallengesForMarket(queueItem.market_id, outcome, market);

            // Update queue status
            const updateQueueStmt = db.prepare(`
              UPDATE market_resolution_queue
              SET status = 'resolved',
                  resolution_data = ?,
                  resolved_at = ?,
                  last_checked_at = ?
              WHERE market_id = ?
            `);

            const now = Math.floor(Date.now() / 1000);
            updateQueueStmt.run(
              JSON.stringify({
                outcome,
                closed_at: market.endDate || now,
                final_odds: market.outcomePrices || market.outcomes
              }),
              now,
              now,
              queueItem.market_id
            );

            resolvedCount++;
          } else {
            // Market still active - update last checked time
            const updateCheckedStmt = db.prepare(`
              UPDATE market_resolution_queue
              SET last_checked_at = ?
              WHERE market_id = ?
            `);

            updateCheckedStmt.run(Math.floor(Date.now() / 1000), queueItem.market_id);
          }

          // Rate limiting - wait 100ms between API calls
          await this._sleep(100);

        } catch (error) {
          console.error(`   ❌ Error checking market ${queueItem.market_slug}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✨ Polling complete: ${resolvedCount} resolved, ${errorCount} errors`);

      // Cleanup old resolved markets
      await this._cleanupOldResolvedMarkets();

    } catch (error) {
      console.error('❌ Error in market resolution polling:', error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Determine the outcome from market data
   */
  _determineOutcome(market) {
    // Check for explicit resolution
    if (market.resolvedOutcome !== undefined) {
      return market.resolvedOutcome;
    }

    // For binary markets, use final odds
    if (market.outcomePrices && market.outcomePrices.length === 2) {
      const yesPrice = market.outcomePrices[0];
      // If Yes price > 50%, outcome is Yes, otherwise No
      return yesPrice > 50 ? 'yes' : 'no';
    }

    // Fallback to checking outcomes array
    if (market.outcomes && market.outcomes.length === 2) {
      return market.outcomes[0].toLowerCase();
    }

    // Default to 'no' if unclear
    return 'no';
  }

  /**
   * Resolve all challenges associated with a market
   */
  async _resolveChallengesForMarket(marketId, outcome, marketData) {
    const db = getDb();

    // Find all active challenges for this market
    const findChallengesStmt = db.prepare(`
      SELECT id FROM learning_challenges
      WHERE market_id = ? AND status = 'active'
    `);

    const challenges = findChallengesStmt.all(marketId);

    for (const challenge of challenges) {
      try {
        // Resolve the challenge
        await learningChallengeService.resolveChallenge(challenge.id, outcome);

        // Score all predictions for this challenge
        await this._scorePredictionsForChallenge(challenge.id, outcome, marketData);

      } catch (error) {
        console.error(`Error resolving challenge ${challenge.id}:`, error);
      }
    }
  }

  /**
   * Score all predictions for a resolved challenge
   */
  async _scorePredictionsForChallenge(challengeId, actualOutcome, marketData) {
    const db = getDb();

    // Get all unresolved predictions for this challenge
    const findPredictionsStmt = db.prepare(`
      SELECT lp.*, lc.difficulty_level, lc.category
      FROM learning_predictions lp
      JOIN learning_challenges lc ON lp.challenge_id = lc.id
      WHERE lp.challenge_id = ? AND lp.is_correct IS NULL
    `);

    const predictions = findPredictionsStmt.all(challengeId);

    for (const prediction of predictions) {
      try {
        // Calculate if prediction was correct
        const isCorrect = prediction.predicted_outcome.toLowerCase() === actualOutcome.toLowerCase();

        // Calculate points based on difficulty and confidence
        const basePoints = isCorrect ? 50 : 0;
        const confidenceBonus = isCorrect ? (prediction.confidence_level * 10) : 0;

        // Difficulty multiplier
        const difficultyMultipliers = {
          beginner: 1.0,
          intermediate: 1.5,
          advanced: 2.5,
          expert: 4.0
        };
        const multiplier = difficultyMultipliers[prediction.difficulty_level] || 1.0;

        // Calculate time bonus (predictions made earlier get bonus)
        const challengeCreatedAt = db.prepare('SELECT created_at FROM learning_challenges WHERE id = ?')
          .get(challengeId).created_at;
        const timeDiff = prediction.created_at - challengeCreatedAt;
        const hoursDiff = Math.floor(timeDiff / 3600);
        let timeBonus = 0;
        if (hoursDiff < 1) timeBonus = 10;
        else if (hoursDiff < 6) timeBonus = 5;
        else if (hoursDiff < 24) timeBonus = 2;

        const totalPoints = Math.round((basePoints + confidenceBonus + timeBonus) * multiplier);

        // Generate detailed feedback using Claude
        const userProgress = learningProgressService.getProgress(prediction.user_id);
        const feedback = await claudeService.generateDetailedFeedback(
          {
            prediction: prediction.predicted_outcome,
            confidence: prediction.confidence_level,
            reasoning: prediction.reasoning_text,
            actual_outcome: actualOutcome,
            is_correct: isCorrect,
            category: prediction.category,
            difficulty: prediction.difficulty_level,
            market_data: marketData
          },
          userProgress.current_level
        );

        // Update prediction with results
        const updatePredictionStmt = db.prepare(`
          UPDATE learning_predictions
          SET is_correct = ?,
              points_earned = ?,
              detailed_feedback = ?,
              resolved_at = ?
          WHERE id = ?
        `);

        const now = Math.floor(Date.now() / 1000);
        updatePredictionStmt.run(
          isCorrect ? 1 : 0,
          totalPoints,
          JSON.stringify(feedback),
          now,
          prediction.id
        );

        // Update user progress
        await learningProgressService.updateProgress(prediction.user_id, {
          is_correct: isCorrect ? 1 : 0,
          points_earned: totalPoints,
          category: prediction.category
        });

        console.log(`   ✅ Scored prediction ${prediction.id}: ${isCorrect ? 'Correct' : 'Incorrect'} (${totalPoints} pts)`);

      } catch (error) {
        console.error(`   ❌ Error scoring prediction ${prediction.id}:`, error);
      }
    }
  }

  /**
   * Clean up old resolved markets from queue
   */
  async _cleanupOldResolvedMarkets() {
    const db = getDb();

    const cutoffTime = Math.floor(Date.now() / 1000) - (CLEANUP_AFTER_DAYS * 24 * 60 * 60);

    const stmt = db.prepare(`
      DELETE FROM market_resolution_queue
      WHERE status = 'resolved' AND resolved_at < ?
    `);

    const result = stmt.run(cutoffTime);

    if (result.changes > 0) {
      console.log(`   🧹 Cleaned up ${result.changes} old resolved markets`);
    }
  }

  /**
   * Manually trigger resolution for a specific market
   */
  async resolveMarketManually(marketSlug, outcome) {
    const db = getDb();

    // Find queue item
    const queueItem = db.prepare('SELECT * FROM market_resolution_queue WHERE market_slug = ?')
      .get(marketSlug);

    if (!queueItem) {
      throw new Error('Market not found in resolution queue');
    }

    // Fetch market data
    const market = await polymarketApi.getMarket(marketSlug);

    // Resolve challenges
    await this._resolveChallengesForMarket(queueItem.market_id, outcome, market);

    // Update queue
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE market_resolution_queue
      SET status = 'resolved',
          resolution_data = ?,
          resolved_at = ?
      WHERE market_slug = ?
    `).run(
      JSON.stringify({ outcome, manually_resolved: true }),
      now,
      marketSlug
    );

    return { success: true, market_slug: marketSlug, outcome };
  }

  /**
   * Get resolution queue status
   */
  getQueueStatus() {
    const db = getDb();

    const stats = db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM market_resolution_queue
      GROUP BY status
    `).all();

    const pending = stats.find(s => s.status === 'pending')?.count || 0;
    const resolved = stats.find(s => s.status === 'resolved')?.count || 0;

    return {
      pending,
      resolved,
      total: pending + resolved,
      is_polling: this.isPolling,
      polling_active: !!this.pollingTimer
    };
  }

  /**
   * Helper: Sleep for ms milliseconds
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const marketResolutionService = new MarketResolutionService();
