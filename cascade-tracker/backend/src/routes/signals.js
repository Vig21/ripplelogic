import express from 'express';
import { getDb } from '../utils/db.js';

const router = express.Router();

// GET /api/signals - Get unlocked signals
router.get('/', (req, res) => {
  const { userId } = req.query;

  // Mock signal data for MVP
  const signals = [
    {
      id: 'signal_1',
      name: 'Volume Spike',
      description: 'Sudden increase in trading volume',
      unlocked: true,
      category: 'VOLUME'
    },
    {
      id: 'signal_2',
      name: 'Market Correlation',
      description: 'Related markets moving together',
      unlocked: false,
      category: 'CORRELATION'
    }
  ];

  res.json({
    status: 'success',
    data: signals
  });
});

export default router;
