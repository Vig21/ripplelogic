import Database from 'better-sqlite3';
import { config } from '../config.js';

let db = null;

export function initializeDatabase() {
  db = new Database(config.DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      avatar TEXT,
      score INTEGER DEFAULT 0,
      predictions_total INTEGER DEFAULT 0,
      predictions_correct INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      max_streak INTEGER DEFAULT 0,
      level TEXT DEFAULT 'BEGINNER',
      badges TEXT DEFAULT '[]',
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS cascades (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      event_data TEXT,
      severity INTEGER,
      status TEXT DEFAULT 'LIVE',
      created_at INTEGER,
      resolved_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      cascade_id TEXT NOT NULL,
      prediction_text TEXT,
      market_id TEXT,
      market_name TEXT,
      predicted_direction TEXT,
      predicted_magnitude REAL,
      actual_direction TEXT,
      actual_magnitude REAL,
      confidence REAL,
      is_correct INTEGER,
      points_earned INTEGER DEFAULT 0,
      direction_points INTEGER DEFAULT 0,
      magnitude_points INTEGER DEFAULT 0,
      timing_points INTEGER DEFAULT 0,
      speed_bonus INTEGER DEFAULT 0,
      feedback TEXT,
      ai_analysis TEXT,
      created_at INTEGER,
      resolved_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cascade_id) REFERENCES cascades(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      badge_name TEXT,
      teaches TEXT,
      earned_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      progress_correct INTEGER DEFAULT 0,
      progress_total INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      started_at INTEGER,
      completed_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      messages TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_user_session ON chat_conversations(user_id, session_id);
    CREATE INDEX IF NOT EXISTS idx_oauth_user ON user_oauth_tokens(user_id);

    -- Learning Challenges Table
    CREATE TABLE IF NOT EXISTS learning_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty_level TEXT NOT NULL,
      min_user_level INTEGER DEFAULT 1,
      market_id TEXT NOT NULL,
      market_slug TEXT NOT NULL,
      market_question TEXT NOT NULL,
      market_data TEXT NOT NULL,
      educational_content TEXT,
      status TEXT DEFAULT 'active',
      resolution_outcome TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      resolved_at INTEGER
    );

    -- Learning Predictions Table
    CREATE TABLE IF NOT EXISTS learning_predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      predicted_outcome TEXT NOT NULL,
      confidence_level INTEGER NOT NULL,
      reasoning_text TEXT,
      is_correct INTEGER,
      points_earned INTEGER DEFAULT 0,
      detailed_feedback TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      resolved_at INTEGER,
      FOREIGN KEY (challenge_id) REFERENCES learning_challenges(id)
    );

    -- Learning Progress Table
    CREATE TABLE IF NOT EXISTS learning_progress (
      user_id TEXT PRIMARY KEY,
      total_challenges INTEGER DEFAULT 0,
      correct_predictions INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      experience_points INTEGER DEFAULT 0,
      skill_scores TEXT DEFAULT '{}',
      unlocked_difficulties TEXT DEFAULT '["beginner"]',
      badges_earned TEXT DEFAULT '[]',
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Market Resolution Queue Table
    CREATE TABLE IF NOT EXISTS market_resolution_queue (
      market_id TEXT PRIMARY KEY,
      market_slug TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      last_checked_at INTEGER DEFAULT (strftime('%s', 'now')),
      resolution_data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      resolved_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_learning_challenges_status ON learning_challenges(status);
    CREATE INDEX IF NOT EXISTS idx_learning_challenges_difficulty ON learning_challenges(difficulty_level);
    CREATE INDEX IF NOT EXISTS idx_learning_challenges_category ON learning_challenges(category);
    CREATE INDEX IF NOT EXISTS idx_learning_predictions_user ON learning_predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_predictions_challenge ON learning_predictions(challenge_id);
    CREATE INDEX IF NOT EXISTS idx_market_resolution_queue_status ON market_resolution_queue(status);
  `);

  console.log('✅ Database tables created (including learning tables)');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
