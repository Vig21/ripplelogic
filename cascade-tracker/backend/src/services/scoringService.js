import { getDb } from '../utils/db.js';
import { claudeService } from './claudeService.js';
import { leaderboardService } from './leaderboardService.js';

export class ScoringService {
  calculateAccuracy(prediction, actual) {
    if (prediction.direction !== actual.direction) return 0.0;

    const magDiff = Math.abs(prediction.magnitude - actual.magnitude);
    if (magDiff < 2) return 1.0;
    if (magDiff < 5) return 0.75;
    return 0.5;
  }

  getStreakMultiplier(streak) {
    if (streak < 3) return 1.0;
    if (streak < 5) return 1.5;
    if (streak < 7) return 2.0;
    if (streak < 10) return 3.0;
    return 4.0;
  }

  async scorePrediction(prediction, cascadeResolution, user) {
    const db = getDb();

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(
      prediction,
      cascadeResolution
    );
    const isCorrect = accuracy > 0.75;

    // Get Claude feedback
    const feedback = await claudeService.generateFeedback(
      prediction,
      cascadeResolution.outcome,
      cascadeResolution.cascade,
      user
    );

    // Calculate points
    const basePoints = 50;
    const difficultyMultiplier = cascadeResolution.difficulty || 1.0;
    const streakMultiplier = this.getStreakMultiplier(
      isCorrect ? user.current_streak + 1 : 0
    );
    const speedBonus = (Date.now() - prediction.created_at) < 120000 ? 10 : 0;

    const totalPoints = Math.round(
      (basePoints + (isCorrect ? difficultyMultiplier * 15 : 0) + speedBonus) *
      streakMultiplier
    );

    // Update prediction
    const stmt = db.prepare(`
      UPDATE predictions
      SET is_correct = ?,
          points_earned = ?,
          feedback = ?,
          resolved_at = ?
      WHERE id = ?
    `);

    stmt.run(
      isCorrect ? 1 : 0,
      totalPoints,
      JSON.stringify(feedback),
      Date.now(),
      prediction.id
    );

    // Update user
    leaderboardService.recordPrediction(
      user.id,
      isCorrect,
      isCorrect ? user.current_streak + 1 : 0
    );

    return {
      points: totalPoints,
      isCorrect,
      accuracy: Math.round(accuracy * 100),
      feedback,
      streak: isCorrect ? user.current_streak + 1 : 0
    };
  }
}

export const scoringService = new ScoringService();
