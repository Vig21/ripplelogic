-- Learning Challenges Table
CREATE TABLE IF NOT EXISTS learning_challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Finance', 'Politics', 'Sports', 'Tech', etc.
    difficulty_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
    min_user_level INTEGER DEFAULT 1,

    -- Polymarket Integration
    market_id TEXT NOT NULL,
    market_slug TEXT NOT NULL,
    market_question TEXT NOT NULL,
    market_data TEXT NOT NULL, -- JSON: {volume, liquidity, outcomes, current_odds, etc.}

    -- Educational Content
    educational_content TEXT, -- JSON: {context, key_factors, historical_precedents, analysis_framework}

    -- Status and Resolution
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'expired'
    resolution_outcome TEXT, -- 'yes', 'no', or outcome text

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Learning Predictions Table
CREATE TABLE IF NOT EXISTS learning_predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    challenge_id TEXT NOT NULL,

    -- Prediction Details
    predicted_outcome TEXT NOT NULL, -- 'yes' or 'no'
    confidence_level INTEGER NOT NULL, -- 1-5 scale
    reasoning_text TEXT, -- User's explanation

    -- Scoring
    is_correct INTEGER, -- NULL until resolved, then 0 or 1
    points_earned INTEGER DEFAULT 0,
    detailed_feedback TEXT, -- JSON: {explanation, key_signal, lesson, encouragement, next_steps}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES learning_challenges(id)
);

-- Learning Progress Table
CREATE TABLE IF NOT EXISTS learning_progress (
    user_id TEXT PRIMARY KEY,

    -- Overall Stats
    total_challenges INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,

    -- Skill Tracking
    skill_scores TEXT, -- JSON: {finance: 0.75, politics: 0.60, sports: 0.80, tech: 0.65}

    -- Unlocks
    unlocked_difficulties TEXT, -- JSON: ['beginner', 'intermediate']
    badges_earned TEXT, -- JSON: [{badge_id, earned_at, name}]

    -- Streaks
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Market Resolution Queue Table
CREATE TABLE IF NOT EXISTS market_resolution_queue (
    market_id TEXT PRIMARY KEY,
    market_slug TEXT NOT NULL,

    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    resolution_data TEXT, -- JSON: {outcome, resolved_at, final_odds}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_challenges_status ON learning_challenges(status);
CREATE INDEX IF NOT EXISTS idx_learning_challenges_difficulty ON learning_challenges(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_challenges_category ON learning_challenges(category);
CREATE INDEX IF NOT EXISTS idx_learning_predictions_user ON learning_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_predictions_challenge ON learning_predictions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_market_resolution_queue_status ON market_resolution_queue(status);
