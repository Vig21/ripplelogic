import express from 'express';
import { leaderboardService } from '../services/leaderboardService.js';

const router = express.Router();

// GET /api/leaderboard - Get leaderboard
router.get('/', (req, res) => {
  const { limit = 10 } = req.query;

  const leaderboard = leaderboardService.getLeaderboard(parseInt(limit));

  res.json({
    status: 'success',
    data: leaderboard
  });
});

// GET /api/leaderboard/user/:userId - Get user position
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  const position = leaderboardService.getUserPosition(userId);

  if (!position) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }

  res.json({
    status: 'success',
    data: position
  });
});

export default router;
