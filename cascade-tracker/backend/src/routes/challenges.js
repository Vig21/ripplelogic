import express from 'express';
import { getDb } from '../utils/db.js';

const router = express.Router();

// GET /api/challenges - Get active challenges
router.get('/', (req, res) => {
  const db = getDb();
  const { userId } = req.query;

  let query = 'SELECT * FROM challenges WHERE status = "ACTIVE"';
  const params = [];

  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  const stmt = db.prepare(query);
  const challenges = stmt.all(...params);

  res.json({
    status: 'success',
    data: challenges
  });
});

export default router;
