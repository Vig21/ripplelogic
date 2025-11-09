import express from 'express';
import { getDb } from '../utils/db.js';
import { scorePrediction, generateFeedback } from '../services/claudeService.js';
import crypto from 'crypto';

const router = express.Router();

// Create a new prediction
router.post('/', async (req, res) => {
  try {
    const {
      username,
      cascadeId,
      predictionText,
      marketId,
      marketName,
      predictedDirection,
      predictedMagnitude,
      confidence
    } = req.body;

    const db = getDb();

    // Get or create user
    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO users (id, username, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, username, Date.now(), Date.now());

      user = { id: userId, username };
    }

    // Get cascade data
    const cascade = db.prepare('SELECT * FROM cascades WHERE id = ?').get(cascadeId);
    if (!cascade) {
      return res.status(404).json({ error: 'Cascade not found' });
    }

    const eventData = JSON.parse(cascade.event_data || '{}');

    // Use Claude to analyze the prediction
    const aiAnalysis = await scorePrediction(
      cascade.name,
      eventData,
      {
        marketName,
        predictedDirection,
        predictedMagnitude,
        confidence,
        predictionText
      }
    );

    // Generate feedback
    const feedback = await generateFeedback(cascade.name, predictionText, aiAnalysis);

    // Create prediction
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.prepare(`
      INSERT INTO predictions (
        id, user_id, cascade_id, prediction_text, market_id, market_name,
        predicted_direction, predicted_magnitude, confidence,
        ai_analysis, feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      predictionId,
      user.id,
      cascadeId,
      predictionText,
      marketId,
      marketName,
      predictedDirection,
      predictedMagnitude,
      confidence,
      JSON.stringify(aiAnalysis),
      feedback,
      Date.now()
    );

    // Calculate initial points (optimistic scoring before resolution)
    const estimatedPoints = calculateEstimatedPoints(confidence, aiAnalysis);

    res.json({
      success: true,
      prediction: {
        id: predictionId,
        aiAnalysis,
        feedback,
        estimatedPoints
      }
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get predictions for a cascade
router.get('/cascade/:cascadeId', async (req, res) => {
  try {
    const { cascadeId } = req.params;
    const db = getDb();

    const predictions = db.prepare(`
      SELECT
        p.*,
        u.username,
        u.avatar,
        u.level
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.cascade_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(cascadeId);

    // Parse JSON fields
    const formattedPredictions = predictions.map(p => ({
      ...p,
      ai_analysis: p.ai_analysis ? JSON.parse(p.ai_analysis) : null
    }));

    res.json(formattedPredictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user predictions
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const predictions = db.prepare(`
      SELECT
        p.*,
        c.name as cascade_name,
        c.category as cascade_category
      FROM predictions p
      JOIN cascades c ON p.cascade_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(user.id);

    res.json(predictions);
  } catch (error) {
    console.error('Error fetching user predictions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve prediction (when cascade resolves)
router.post('/:predictionId/resolve', async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { actualDirection, actualMagnitude } = req.body;

    const db = getDb();

    const prediction = db.prepare('SELECT * FROM predictions WHERE id = ?').get(predictionId);
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    // Calculate points
    const scoring = calculatePredictionScore(
      prediction.predicted_direction,
      prediction.predicted_magnitude,
      actualDirection,
      actualMagnitude,
      prediction.confidence,
      prediction.created_at
    );

    // Update prediction
    db.prepare(`
      UPDATE predictions
      SET
        actual_direction = ?,
        actual_magnitude = ?,
        is_correct = ?,
        points_earned = ?,
        direction_points = ?,
        magnitude_points = ?,
        timing_points = ?,
        speed_bonus = ?,
        resolved_at = ?
      WHERE id = ?
    `).run(
      actualDirection,
      actualMagnitude,
      scoring.isCorrect ? 1 : 0,
      scoring.totalPoints,
      scoring.directionPoints,
      scoring.magnitudePoints,
      scoring.timingPoints,
      scoring.speedBonus,
      Date.now(),
      predictionId
    );

    // Update user stats
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(prediction.user_id);

    const newTotal = user.predictions_total + 1;
    const newCorrect = user.predictions_correct + (scoring.isCorrect ? 1 : 0);
    const newScore = user.score + scoring.totalPoints;
    const newStreak = scoring.isCorrect ? user.current_streak + 1 : 0;
    const newMaxStreak = Math.max(user.max_streak, newStreak);

    db.prepare(`
      UPDATE users
      SET
        score = ?,
        predictions_total = ?,
        predictions_correct = ?,
        current_streak = ?,
        max_streak = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newScore, newTotal, newCorrect, newStreak, newMaxStreak, Date.now(), user.id);

    res.json({
      success: true,
      scoring,
      userStats: {
        score: newScore,
        accuracy: (newCorrect / newTotal) * 100,
        streak: newStreak
      }
    });
  } catch (error) {
    console.error('Error resolving prediction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate prediction score
function calculatePredictionScore(
  predictedDirection,
  predictedMagnitude,
  actualDirection,
  actualMagnitude,
  confidence,
  createdAt
) {
  let directionPoints = 0;
  let magnitudePoints = 0;
  let timingPoints = 0;
  let speedBonus = 0;

  // Direction accuracy (50 points max)
  if (predictedDirection === actualDirection) {
    directionPoints = 50;
  }

  // Magnitude accuracy (30 points max)
  if (predictedMagnitude && actualMagnitude) {
    const magnitudeError = Math.abs(predictedMagnitude - actualMagnitude) / actualMagnitude;
    if (magnitudeError < 0.1) magnitudePoints = 30; // Within 10%
    else if (magnitudeError < 0.2) magnitudePoints = 20; // Within 20%
    else if (magnitudeError < 0.3) magnitudePoints = 10; // Within 30%
  }

  // Confidence accuracy (10 points max)
  timingPoints = Math.round(confidence * 10);

  // Speed bonus (10 points max) - early predictions get bonus
  const hoursSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60);
  if (hoursSinceCreation < 1) speedBonus = 10;
  else if (hoursSinceCreation < 6) speedBonus = 5;
  else if (hoursSinceCreation < 24) speedBonus = 2;

  const totalPoints = directionPoints + magnitudePoints + timingPoints + speedBonus;
  const isCorrect = directionPoints > 0; // Direction must be correct

  return {
    directionPoints,
    magnitudePoints,
    timingPoints,
    speedBonus,
    totalPoints,
    isCorrect
  };
}

// Helper function to estimate points before resolution
function calculateEstimatedPoints(confidence, aiAnalysis) {
  // Give optimistic estimate based on AI analysis
  const basePoints = 50; // Assume correct direction
  const magnitudePoints = 20; // Assume decent magnitude prediction
  const confidencePoints = Math.round(confidence * 10);
  const speedBonus = 10; // New prediction gets max speed bonus

  return basePoints + magnitudePoints + confidencePoints + speedBonus;
}

export default router;
