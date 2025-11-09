import express from 'express';
import { getDb } from '../utils/db.js';
import { claudeService } from '../services/claudeService.js';
import { cascadeGenerator } from '../services/cascadeGenerator.js';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/cascades - List all cascades
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { limit = 10, status, category } = req.query;

    let query = 'SELECT * FROM cascades WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const stmt = db.prepare(query);
    const cascades = stmt.all(...params);

    res.json({
      status: 'success',
      data: cascades.map(c => ({
        ...c,
        event_data: JSON.parse(c.event_data || '{}')
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cascades/:id - Get cascade detail
router.get('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const cascadeStmt = db.prepare('SELECT * FROM cascades WHERE id = ?');
    const cascade = cascadeStmt.get(id);

    if (!cascade) {
      throw new AppError('Cascade not found', 404);
    }

    // Try to get predictions, but handle if there are none gracefully
    let predictions = [];
    try {
      const predictionsStmt = db.prepare(`
        SELECT u.username, p.prediction_text, p.predicted_direction, p.is_correct, p.points_earned
        FROM predictions p
        JOIN users u ON p.user_id = u.id
        WHERE p.cascade_id = ?
        ORDER BY p.created_at DESC
        LIMIT 10
      `);
      predictions = predictionsStmt.all(id);
    } catch (predError) {
      console.log('No predictions found for cascade:', id);
      predictions = [];
    }

    res.json({
      status: 'success',
      data: {
        ...cascade,
        event_data: JSON.parse(cascade.event_data || '{}'),
        predictions
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cascades/generate - Generate new cascades using Claude + Polymarket API
router.post('/generate', async (req, res, next) => {
  try {
    const { count = 2 } = req.body;

    console.log(`🎲 Generating ${count} cascades...`);

    // Generate cascades using Claude + Polymarket API
    const generatedCascades = await cascadeGenerator.generateCascades(count);

    // Save to database
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO cascades (id, name, description, category, event_data, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const savedCascades = [];
    for (const cascade of generatedCascades) {
      insertStmt.run(
        cascade.id,
        cascade.name,
        cascade.description,
        cascade.category,
        cascade.event_data,
        cascade.severity,
        cascade.status,
        cascade.created_at
      );

      savedCascades.push({
        ...cascade,
        event_data: JSON.parse(cascade.event_data)
      });
    }

    console.log(`✅ Saved ${savedCascades.length} cascades to database`);

    res.json({
      status: 'success',
      message: `Generated ${savedCascades.length} sophisticated cascades`,
      data: savedCascades
    });

  } catch (error) {
    console.error('Error generating cascades:', error);
    next(error);
  }
});

// POST /api/cascades/generate-custom - Generate custom cascade from Polymarket event URL
router.post('/generate-custom', async (req, res, next) => {
  try {
    const { eventUrl } = req.body;

    if (!eventUrl) {
      throw new AppError('eventUrl is required', 400);
    }

    console.log(`🎲 Generating custom cascade for URL: ${eventUrl}`);

    // Validate URL and generate cascade
    const generatedCascade = await cascadeGenerator.generateCustomCascade(eventUrl);

    // Save to database
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO cascades (id, name, description, category, event_data, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      generatedCascade.id,
      generatedCascade.name,
      generatedCascade.description,
      generatedCascade.category,
      generatedCascade.event_data,
      generatedCascade.severity,
      generatedCascade.status,
      generatedCascade.created_at
    );

    const savedCascade = {
      ...generatedCascade,
      event_data: JSON.parse(generatedCascade.event_data)
    };

    console.log(`✅ Saved custom cascade to database: "${savedCascade.name}"`);

    res.json({
      status: 'success',
      message: 'Generated custom cascade',
      data: savedCascade
    });

  } catch (error) {
    console.error('Error generating custom cascade:', error);

    // Provide more specific error messages
    if (error.message.includes('Invalid Polymarket URL')) {
      return next(new AppError(error.message, 400));
    }
    if (error.message.includes('Event not found')) {
      return next(new AppError(error.message, 404));
    }
    if (error.message.includes('validation')) {
      return next(new AppError('Failed to generate valid cascade. Please try again.', 500));
    }

    next(error);
  }
});

// POST /api/cascades/:id/resolve - Resolve cascade (admin)
router.post('/:id/resolve', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { outcome, magnitude } = req.body;

    // Update cascade status
    const updateStmt = db.prepare(`
      UPDATE cascades
      SET status = 'RESOLVED', resolved_at = ?
      WHERE id = ?
    `);
    updateStmt.run(Date.now(), id);

    // Get all predictions for this cascade
    const predsStmt = db.prepare(`
      SELECT p.*, u.* FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.cascade_id = ?
    `);
    const predictions = predsStmt.all(id);

    const results = [];
    for (const pred of predictions) {
      // Score each prediction (simplified)
      const isCorrect = pred.guess === outcome;
      const points = isCorrect ? 50 : 0;

      results.push({
        userId: pred.user_id,
        isCorrect,
        points
      });
    }

    res.json({
      status: 'success',
      message: 'Cascade resolved',
      resultsCount: results.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
