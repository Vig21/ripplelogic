import { getDb } from '../utils/db.js';

/**
 * Learning Progress Service
 * Manages user progress, levels, and unlocks in the Learn section
 */

// Level thresholds (experience points required)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3 - Unlock Intermediate
  500,    // Level 4
  800,    // Level 5
  1200,   // Level 6 - Unlock Advanced
  1700,   // Level 7
  2300,   // Level 8
  3000,   // Level 9 - Unlock Expert
  4000,   // Level 10
  5500,   // Level 11
  7500,   // Level 12
  10000,  // Level 13
  13000,  // Level 14
  17000,  // Level 15
  22000,  // Level 16
  28000,  // Level 17
  35000,  // Level 18
  43000,  // Level 19
  52000   // Level 20
];

// Badge definitions
const LEARNING_BADGES = {
  FIRST_PREDICTION: { name: 'First Step', teaches: 'Making your first market prediction' },
  PERFECT_SCORE_100: { name: 'Perfect Vision', teaches: 'Achieving a perfect prediction score' },
  STREAK_3: { name: 'Hat Trick', teaches: 'Building prediction momentum' },
  STREAK_5: { name: 'On Fire', teaches: 'Consistent market analysis' },
  STREAK_10: { name: 'Unstoppable', teaches: 'Mastering market patterns' },
  INTERMEDIATE_UNLOCK: { name: 'Rising Star', teaches: 'Advancing to intermediate challenges' },
  ADVANCED_UNLOCK: { name: 'Market Analyst', teaches: 'Tackling advanced predictions' },
  EXPERT_UNLOCK: { name: 'Market Oracle', teaches: 'Mastering expert-level analysis' },
  CATEGORY_MASTER_FINANCE: { name: 'Finance Guru', teaches: 'Excelling in financial markets' },
  CATEGORY_MASTER_POLITICS: { name: 'Political Analyst', teaches: 'Understanding political markets' },
  CATEGORY_MASTER_SPORTS: { name: 'Sports Expert', teaches: 'Predicting sports outcomes' },
  CATEGORY_MASTER_TECH: { name: 'Tech Visionary', teaches: 'Forecasting technology trends' },
  LEVEL_5: { name: 'Dedicated Learner', teaches: 'Reaching level 5' },
  LEVEL_10: { name: 'Advanced Student', teaches: 'Reaching level 10' },
  LEVEL_15: { name: 'Market Master', teaches: 'Reaching level 15' },
  LEVEL_20: { name: 'Legendary Predictor', teaches: 'Reaching level 20' }
};

class LearningProgressService {
  /**
   * Initialize progress for a new user
   */
  initializeProgress(userId) {
    const db = getDb();

    // First check if already exists
    const checkStmt = db.prepare('SELECT * FROM learning_progress WHERE user_id = ?');
    let progress = checkStmt.get(userId);

    if (!progress) {
      // Create new record
      const stmt = db.prepare(`
        INSERT INTO learning_progress (
          user_id, total_challenges, correct_predictions, current_level,
          experience_points, skill_scores, unlocked_difficulties,
          badges_earned, current_streak, best_streak
        ) VALUES (?, 0, 0, 1, 0, '{}', '["beginner"]', '[]', 0, 0)
      `);

      stmt.run(userId);

      // Fetch the just-created record
      progress = checkStmt.get(userId);

      if (!progress) {
        throw new Error(`Failed to create progress record for user ${userId}`);
      }
    }

    return this._parseProgress(progress);
  }

  /**
   * Get user's learning progress
   */
  getProgress(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM learning_progress WHERE user_id = ?');
    let progress = stmt.get(userId);

    if (!progress) {
      // Initialize if doesn't exist
      return this.initializeProgress(userId);
    }

    return this._parseProgress(progress);
  }

  /**
   * Update progress after a prediction is resolved
   */
  async updateProgress(userId, predictionResult) {
    const db = getDb();
    const progress = this.getProgress(userId);

    const isCorrect = predictionResult.is_correct === 1;
    const pointsEarned = predictionResult.points_earned || 0;

    // Calculate new stats
    const newTotalChallenges = progress.total_challenges + 1;
    const newCorrectPredictions = progress.correct_predictions + (isCorrect ? 1 : 0);
    const newExperiencePoints = progress.experience_points + pointsEarned;
    const newCurrentStreak = isCorrect ? progress.current_streak + 1 : 0;
    const newBestStreak = Math.max(newCurrentStreak, progress.best_streak);

    // Calculate new level
    const newLevel = this._calculateLevel(newExperiencePoints);

    // Update skill scores by category
    const skillScores = this._updateSkillScores(
      progress.skill_scores,
      predictionResult.category,
      isCorrect
    );

    // Check for unlocks
    const unlockedDifficulties = this._checkDifficultyUnlocks(
      progress.unlocked_difficulties,
      newLevel,
      newTotalChallenges,
      newCorrectPredictions,
      skillScores
    );

    // Check for badge achievements
    const newBadges = await this._checkBadgeAchievements(
      userId,
      progress,
      {
        totalChallenges: newTotalChallenges,
        correctPredictions: newCorrectPredictions,
        currentLevel: newLevel,
        currentStreak: newCurrentStreak,
        pointsEarned,
        unlockedDifficulties,
        category: predictionResult.category
      }
    );

    // Update database
    const updateStmt = db.prepare(`
      UPDATE learning_progress
      SET total_challenges = ?,
          correct_predictions = ?,
          current_level = ?,
          experience_points = ?,
          skill_scores = ?,
          unlocked_difficulties = ?,
          badges_earned = ?,
          current_streak = ?,
          best_streak = ?,
          updated_at = ?
      WHERE user_id = ?
    `);

    const now = Math.floor(Date.now() / 1000);
    updateStmt.run(
      newTotalChallenges,
      newCorrectPredictions,
      newLevel,
      newExperiencePoints,
      JSON.stringify(skillScores),
      JSON.stringify(unlockedDifficulties),
      JSON.stringify([...progress.badges_earned, ...newBadges]),
      newCurrentStreak,
      newBestStreak,
      now,
      userId
    );

    const updatedProgress = this.getProgress(userId);

    // Return with new badges for UI notification
    return {
      ...updatedProgress,
      newBadges,
      leveledUp: newLevel > progress.current_level,
      previousLevel: progress.current_level
    };
  }

  /**
   * Calculate user level based on experience points
   */
  _calculateLevel(experiencePoints) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (experiencePoints >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get experience required for next level
   */
  getNextLevelXP(currentLevel) {
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return null; // Max level
    }
    return LEVEL_THRESHOLDS[currentLevel];
  }

  /**
   * Update skill scores by category
   */
  _updateSkillScores(currentScores, category, isCorrect) {
    const scores = { ...currentScores };

    if (!category) return scores;

    const categoryKey = category.toLowerCase();

    if (!scores[categoryKey]) {
      scores[categoryKey] = {
        total: 0,
        correct: 0,
        accuracy: 0
      };
    }

    scores[categoryKey].total += 1;
    scores[categoryKey].correct += isCorrect ? 1 : 0;
    scores[categoryKey].accuracy = scores[categoryKey].correct / scores[categoryKey].total;

    return scores;
  }

  /**
   * Check if new difficulty levels should be unlocked
   */
  _checkDifficultyUnlocks(currentUnlocks, level, totalChallenges, correctPredictions, skillScores) {
    const unlocked = [...currentUnlocks];
    const accuracy = totalChallenges > 0 ? correctPredictions / totalChallenges : 0;

    // Intermediate: Level 3 + 70% accuracy on 5+ challenges
    if (!unlocked.includes('intermediate') && level >= 3 && totalChallenges >= 5 && accuracy >= 0.70) {
      unlocked.push('intermediate');
    }

    // Advanced: Level 6 + 65% accuracy on 10+ challenges
    if (!unlocked.includes('advanced') && level >= 6 && totalChallenges >= 10 && accuracy >= 0.65) {
      unlocked.push('advanced');
    }

    // Expert: Level 9 + 60% accuracy on 15+ challenges
    if (!unlocked.includes('expert') && level >= 9 && totalChallenges >= 15 && accuracy >= 0.60) {
      unlocked.push('expert');
    }

    return unlocked;
  }

  /**
   * Check for badge achievements
   */
  async _checkBadgeAchievements(userId, oldProgress, newStats) {
    const newBadges = [];

    // First prediction
    if (newStats.totalChallenges === 1 && !this._hasBadge(oldProgress.badges_earned, 'FIRST_PREDICTION')) {
      newBadges.push({ id: 'FIRST_PREDICTION', ...LEARNING_BADGES.FIRST_PREDICTION, earned_at: Date.now() });
    }

    // Perfect score
    if (newStats.pointsEarned === 100 && !this._hasBadge(oldProgress.badges_earned, 'PERFECT_SCORE_100')) {
      newBadges.push({ id: 'PERFECT_SCORE_100', ...LEARNING_BADGES.PERFECT_SCORE_100, earned_at: Date.now() });
    }

    // Streaks
    if (newStats.currentStreak === 3 && !this._hasBadge(oldProgress.badges_earned, 'STREAK_3')) {
      newBadges.push({ id: 'STREAK_3', ...LEARNING_BADGES.STREAK_3, earned_at: Date.now() });
    }
    if (newStats.currentStreak === 5 && !this._hasBadge(oldProgress.badges_earned, 'STREAK_5')) {
      newBadges.push({ id: 'STREAK_5', ...LEARNING_BADGES.STREAK_5, earned_at: Date.now() });
    }
    if (newStats.currentStreak === 10 && !this._hasBadge(oldProgress.badges_earned, 'STREAK_10')) {
      newBadges.push({ id: 'STREAK_10', ...LEARNING_BADGES.STREAK_10, earned_at: Date.now() });
    }

    // Difficulty unlocks
    if (newStats.unlockedDifficulties.includes('intermediate') && !oldProgress.unlocked_difficulties.includes('intermediate')) {
      newBadges.push({ id: 'INTERMEDIATE_UNLOCK', ...LEARNING_BADGES.INTERMEDIATE_UNLOCK, earned_at: Date.now() });
    }
    if (newStats.unlockedDifficulties.includes('advanced') && !oldProgress.unlocked_difficulties.includes('advanced')) {
      newBadges.push({ id: 'ADVANCED_UNLOCK', ...LEARNING_BADGES.ADVANCED_UNLOCK, earned_at: Date.now() });
    }
    if (newStats.unlockedDifficulties.includes('expert') && !oldProgress.unlocked_difficulties.includes('expert')) {
      newBadges.push({ id: 'EXPERT_UNLOCK', ...LEARNING_BADGES.EXPERT_UNLOCK, earned_at: Date.now() });
    }

    // Level milestones
    if (newStats.currentLevel === 5 && oldProgress.current_level < 5) {
      newBadges.push({ id: 'LEVEL_5', ...LEARNING_BADGES.LEVEL_5, earned_at: Date.now() });
    }
    if (newStats.currentLevel === 10 && oldProgress.current_level < 10) {
      newBadges.push({ id: 'LEVEL_10', ...LEARNING_BADGES.LEVEL_10, earned_at: Date.now() });
    }
    if (newStats.currentLevel === 15 && oldProgress.current_level < 15) {
      newBadges.push({ id: 'LEVEL_15', ...LEARNING_BADGES.LEVEL_15, earned_at: Date.now() });
    }
    if (newStats.currentLevel === 20 && oldProgress.current_level < 20) {
      newBadges.push({ id: 'LEVEL_20', ...LEARNING_BADGES.LEVEL_20, earned_at: Date.now() });
    }

    return newBadges;
  }

  /**
   * Check if user has a specific badge
   */
  _hasBadge(badges, badgeId) {
    return badges.some(b => b.id === badgeId);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit = 10) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT *
      FROM learning_progress
      ORDER BY experience_points DESC, current_level DESC, correct_predictions DESC
      LIMIT ?
    `);

    const results = stmt.all(limit);
    return results.map((row, index) => ({
      ...this._parseProgress(row),
      rank: index + 1
    }));
  }

  /**
   * Get user rank
   */
  getUserRank(userId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM learning_progress
      WHERE experience_points > (
        SELECT experience_points FROM learning_progress WHERE user_id = ?
      )
    `);

    const result = stmt.get(userId);
    return result?.rank || null;
  }

  /**
   * Parse progress from database row
   */
  _parseProgress(row) {
    return {
      ...row,
      skill_scores: JSON.parse(row.skill_scores || '{}'),
      unlocked_difficulties: JSON.parse(row.unlocked_difficulties || '["beginner"]'),
      badges_earned: JSON.parse(row.badges_earned || '[]')
    };
  }

  /**
   * Get all available badges
   */
  getAllBadges() {
    return Object.entries(LEARNING_BADGES).map(([id, badge]) => ({
      id,
      ...badge
    }));
  }
}

export const learningProgressService = new LearningProgressService();
