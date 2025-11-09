import express from 'express';
import { claudeService } from '../services/claudeService.js';
import { getDb } from '../utils/db.js';

const router = express.Router();

// POST /api/chat/ask - Ask Claude a question
router.post('/ask', async (req, res, next) => {
  try {
    const { question, cascadeId, conversationHistory } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Question is required'
      });
    }

    // Get cascade context if provided
    let cascadeContext = null;
    if (cascadeId) {
      const db = getDb();
      const cascadeStmt = db.prepare('SELECT * FROM cascades WHERE id = ?');
      const cascade = cascadeStmt.get(cascadeId);

      if (cascade) {
        cascadeContext = {
          name: cascade.name,
          description: cascade.description,
          event_data: JSON.parse(cascade.event_data || '{}')
        };
      }
    }

    // Get answer from Claude
    const answer = await claudeService.askQuestion(
      question.trim(),
      cascadeContext,
      conversationHistory || []
    );

    res.json({
      status: 'success',
      data: {
        question: question.trim(),
        answer,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
