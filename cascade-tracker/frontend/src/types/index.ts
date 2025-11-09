export interface Cascade {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'LIVE' | 'RESOLVED';
  severity: number;
  event_data: {
    affected_market_count?: number;
    event_headline?: string;
    impact_thesis?: string;
    cascade_chains?: CascadeChain[];
    market_impact_forecast?: MarketImpact[];
  };
  created_at: number;
  resolved_at?: number;
  predictions?: Prediction[];
}

export interface CascadeChain {
  chain: string;
  rationale: string;
  timeline_estimate: string;
}

export interface MarketImpact {
  market_id: string;
  market_name: string;
  direction: 'UP' | 'DOWN';
  magnitude_percent: number;
  confidence: number;
  reason: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  cascade_id: string;
  prediction_text: string;
  market_id?: string;
  guess: string;
  confidence: number;
  is_correct?: boolean;
  points_earned: number;
  feedback?: PredictionFeedback;
  created_at: number;
  resolved_at?: number;
}

export interface PredictionFeedback {
  explanation: string;
  keySignal: string;
  lesson: string;
  encouragement: string;
  nextSignalToWatch: string;
  readinessLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  predictions_total: number;
  predictions_correct: number;
  current_streak: number;
  max_streak: number;
  level: string;
  badges: string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  predictions: number;
  accuracy: string;
  streak: number;
  level: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress_correct: number;
  progress_total: number;
  status: 'ACTIVE' | 'COMPLETED';
  started_at: number;
  completed_at?: number;
}

export interface Signal {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  category: string;
}
