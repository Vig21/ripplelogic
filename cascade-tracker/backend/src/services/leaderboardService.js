import { getDb } from '../utils/db.js';

export class LeaderboardService {
  addPlayer(userId, username, avatar = null) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users
      (id, username, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(userId, username, avatar, Date.now(), Date.now());
  }

  updateScore(userId, points) {
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE users
      SET score = score + ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(points, Date.now(), userId);
  }

  recordPrediction(userId, isCorrect, streak) {
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE users
      SET predictions_total = predictions_total + 1,
          predictions_correct = predictions_correct + ${isCorrect ? 1 : 0},
          current_streak = ?,
          max_streak = MAX(max_streak, ?),
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(streak, streak, Date.now(), userId);
  }

  getLeaderboard(limit = 10) {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT
        id,
        username,
        score,
        predictions_total,
        predictions_correct,
        current_streak,
        max_streak,
        level
      FROM users
      ORDER BY score DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      score: row.score,
      predictions: row.predictions_total,
      accuracy: row.predictions_total > 0
        ? ((row.predictions_correct / row.predictions_total) * 100).toFixed(1)
        : '0.0',
      streak: row.current_streak,
      level: row.level
    }));
  }

  getUserPosition(userId) {
    const db = getDb();

    const userStmt = db.prepare(`
      SELECT score, predictions_total, predictions_correct
      FROM users WHERE id = ?
    `);
    const user = userStmt.get(userId);

    if (!user) return null;

    const rankStmt = db.prepare(`
      SELECT COUNT(*) as rank FROM users WHERE score > ?
    `);
    const { rank } = rankStmt.get(user.score);

    return {
      rank: rank + 1,
      score: user.score,
      accuracy: user.predictions_total > 0
        ? ((user.predictions_correct / user.predictions_total) * 100).toFixed(1)
        : '0.0'
    };
  }
}

export const leaderboardService = new LeaderboardService();
