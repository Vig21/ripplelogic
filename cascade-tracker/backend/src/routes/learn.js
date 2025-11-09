import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../utils/db.js';
import { learningChallengeService } from '../services/learningChallengeService.js';
import { learningProgressService } from '../services/learningProgressService.js';
import { marketResolutionService } from '../services/marketResolutionService.js';

const router = express.Router();

/**
 * GET /api/learn/challenges
 * Get available learning challenges
 * Query params: category, difficulty, userLevel, username
 */
router.get('/challenges', async (req, res, next) => {
  try {
    const { category, difficulty, userLevel, username } = req.query;

    let level = parseInt(userLevel) || 1;

    // If username provided, get their actual level
    if (username) {
      const progress = learningProgressService.getProgress(username);
      level = progress.current_level;
    }

    const challenges = await learningChallengeService.getAvailableChallenges(
      level,
      category,
      difficulty
    );

    res.json({
      success: true,
      challenges,
      count: challenges.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/challenges/:id
 * Get challenge details by ID
 */
router.get('/challenges/:id', async (req, res, next) => {
  try {
    const challenge = learningChallengeService.getChallengeById(req.params.id);

    // Get challenge stats
    const stats = learningChallengeService.getChallengeStats(req.params.id);

    res.json({
      success: true,
      challenge,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/learn/challenges/generate
 * Generate new learning challenges
 * Body: { count, difficulty, category }
 */
router.post('/challenges/generate', async (req, res, next) => {
  try {
    const { count = 1, difficulty = 'beginner', category } = req.body;

    const challenges = [];

    for (let i = 0; i < count; i++) {
      try {
        const challenge = await learningChallengeService.generateChallenge(
          difficulty,
          category
        );
        challenges.push(challenge);
      } catch (error) {
        console.error(`Error generating challenge ${i + 1}:`, error);
      }
    }

    res.json({
      success: true,
      challenges,
      generated: challenges.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/learn/predictions
 * Submit a learning prediction
 * Body: { username, challengeId, predictedOutcome, confidenceLevel, reasoning }
 */
router.post('/predictions', async (req, res, next) => {
  try {
    const {
      username,
      challengeId,
      predictedOutcome,
      confidenceLevel,
      reasoning
    } = req.body;

    // Validate inputs
    if (!username || !challengeId || !predictedOutcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!['yes', 'no'].includes(predictedOutcome.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Predicted outcome must be "yes" or "no"'
      });
    }

    if (!confidenceLevel || confidenceLevel < 1 || confidenceLevel > 5) {
      return res.status(400).json({
        success: false,
        error: 'Confidence level must be between 1 and 5'
      });
    }

    // Use username as user ID
    const userId = username;

    // Initialize progress if needed
    learningProgressService.initializeProgress(userId);

    // Check if user already predicted this challenge
    const db = getDb();
    const existingPrediction = db.prepare(
      'SELECT id FROM learning_predictions WHERE user_id = ? AND challenge_id = ?'
    ).get(userId, challengeId);

    if (existingPrediction) {
      return res.status(400).json({
        success: false,
        error: 'You have already made a prediction for this challenge'
      });
    }

    // Get the challenge to check resolution outcome
    const challenge = db.prepare(
      'SELECT * FROM learning_challenges WHERE id = ?'
    ).get(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    // Check if challenge has a resolution outcome
    if (!challenge.resolution_outcome) {
      return res.status(400).json({
        success: false,
        error: 'This challenge does not have a resolution outcome yet. Please choose a resolved challenge.'
      });
    }

    // Since this is educational and based on past events, immediately evaluate
    const isCorrect = challenge.resolution_outcome.toLowerCase() === predictedOutcome.toLowerCase() ? 1 : 0;

    // Calculate points based on correctness and confidence
    // Base: 10 points for correct, 0 for incorrect
    // Bonus: confidence multiplier (1-5) applied to base points
    const basePoints = isCorrect ? 10 : 0;
    const confidenceMultiplier = confidenceLevel / 3; // 0.33 to 1.67 multiplier
    const pointsEarned = Math.round(basePoints * confidenceMultiplier);

    // Generate detailed feedback
    const detailedFeedback = {
      explanation: isCorrect
        ? `Correct! The market resolved ${challenge.resolution_outcome.toUpperCase()}.`
        : `Incorrect. The market resolved ${challenge.resolution_outcome.toUpperCase()}, but you predicted ${predictedOutcome.toUpperCase()}.`,
      key_signal: isCorrect
        ? 'Your analysis aligned with the market outcome.'
        : 'Consider reviewing the key factors that led to the actual outcome.',
      lesson: `This ${challenge.category} market demonstrates important prediction patterns.`,
      encouragement: isCorrect
        ? 'Great work! Keep building your prediction skills.'
        : 'Learning from mistakes is key to improvement. Try another challenge!',
      next_steps: isCorrect
        ? 'Challenge yourself with a harder difficulty level.'
        : 'Review similar challenges to improve your understanding.',
      skill_development: `You're developing expertise in ${challenge.category} markets.`
    };

    // Create prediction with immediate evaluation
    const predictionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO learning_predictions (
        id, user_id, challenge_id, predicted_outcome,
        confidence_level, reasoning_text, is_correct,
        points_earned, detailed_feedback, created_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      predictionId,
      userId,
      challengeId,
      predictedOutcome.toLowerCase(),
      confidenceLevel,
      reasoning || null,
      isCorrect,
      pointsEarned,
      JSON.stringify(detailedFeedback),
      now,
      now // Immediately resolved
    );

    // Update progress
    await learningProgressService.updateProgress(userId, {
      is_correct: isCorrect,
      points_earned: pointsEarned,
      category: challenge.category
    });

    // Get the created prediction
    const prediction = db.prepare(
      'SELECT * FROM learning_predictions WHERE id = ?'
    ).get(predictionId);

    // Parse detailed_feedback JSON
    const parsedPrediction = {
      ...prediction,
      detailed_feedback: JSON.parse(prediction.detailed_feedback || '{}')
    };

    res.json({
      success: true,
      prediction: parsedPrediction,
      isCorrect,
      pointsEarned,
      feedback: detailedFeedback,
      message: isCorrect
        ? `🎉 Correct! You earned ${pointsEarned} XP!`
        : `Not quite. The correct answer was ${challenge.resolution_outcome.toUpperCase()}. Keep learning!`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/predictions/user/:username
 * Get user's prediction history
 */
router.get('/predictions/user/:username', async (req, res, next) => {
  try {
    const userId = req.params.username;

    if (!userId) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const db = getDb();
    const predictions = db.prepare(`
      SELECT
        lp.*,
        lc.title as challenge_title,
        lc.category,
        lc.difficulty_level,
        lc.status as challenge_status
      FROM learning_predictions lp
      JOIN learning_challenges lc ON lp.challenge_id = lc.id
      WHERE lp.user_id = ?
      ORDER BY lp.created_at DESC
    `).all(userId);

    // Parse JSON fields
    const parsedPredictions = predictions.map(p => ({
      ...p,
      detailed_feedback: p.detailed_feedback ? JSON.parse(p.detailed_feedback) : null
    }));

    res.json({
      success: true,
      predictions: parsedPredictions,
      count: parsedPredictions.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/progress/:username
 * Get user's learning progress
 */
router.get('/progress/:username', async (req, res, next) => {
  try {
    const userId = req.params.username;

    if (!userId) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const progress = learningProgressService.getProgress(userId);
    const rank = learningProgressService.getUserRank(userId);
    const nextLevelXP = learningProgressService.getNextLevelXP(progress.current_level);

    res.json({
      success: true,
      progress: {
        ...progress,
        rank,
        next_level_xp: nextLevelXP,
        xp_to_next_level: nextLevelXP ? nextLevelXP - progress.experience_points : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/leaderboard
 * Get learning leaderboard
 * Query params: limit
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = learningProgressService.getLeaderboard(limit);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/categories
 * Get available challenge categories
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = learningChallengeService.getCategories();

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/badges
 * Get all available badges
 */
router.get('/badges', async (req, res, next) => {
  try {
    const badges = learningProgressService.getAllBadges();

    res.json({
      success: true,
      badges
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learn/resolution-status
 * Get market resolution queue status
 */
router.get('/resolution-status', async (req, res, next) => {
  try {
    const status = marketResolutionService.getQueueStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/learn/resolution/manual
 * Manually trigger market resolution (admin)
 * Body: { marketSlug, outcome }
 */
router.post('/resolution/manual', async (req, res, next) => {
  try {
    const { marketSlug, outcome } = req.body;

    if (!marketSlug || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing marketSlug or outcome'
      });
    }

    const result = await marketResolutionService.resolveMarketManually(marketSlug, outcome);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions

/**
 * Get user ID by username, or null if not found
 */
async function getUserIdByUsername(username) {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  return user?.id || null;
}

/**
 * Get or create user by username
 */
async function getOrCreateUser(username) {
  const db = getDb();

  // Check if user exists
  let user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

  if (user) {
    return user.id;
  }

  // Create new user
  const userId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO users (id, username, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, username, now, now);

  return userId;
}

export default router;
