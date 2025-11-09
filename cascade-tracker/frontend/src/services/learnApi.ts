import apiClient from './api';

export interface LearningChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  min_user_level: number;
  market_id: string;
  market_slug: string;
  market_question: string;
  market_data: {
    volume: number;
    liquidity: number;
    current_odds: number[] | string[];
    outcomes: string[];
    end_date: string;
    category: string;
    image?: string;
  };
  educational_content: {
    market_context: string;
    key_factors: string[];
    historical_precedents: string;
    analysis_framework: string;
    learning_objectives: string[];
  };
  status: 'active' | 'resolved' | 'expired';
  resolution_outcome?: string;
  created_at: number;
  resolved_at?: number;
}

export interface LearningPrediction {
  id: string;
  user_id: string;
  challenge_id: string;
  predicted_outcome: 'yes' | 'no';
  confidence_level: number;
  reasoning_text?: string;
  is_correct?: number;
  points_earned?: number;
  detailed_feedback?: {
    explanation: string;
    key_signal: string;
    lesson: string;
    encouragement: string;
    next_steps: string;
    skill_development: string;
  };
  created_at: number;
  resolved_at?: number;
  challenge_title?: string;
  category?: string;
  difficulty_level?: string;
  challenge_status?: string;
}

export interface LearningProgress {
  user_id: string;
  total_challenges: number;
  correct_predictions: number;
  current_level: number;
  experience_points: number;
  skill_scores: {
    [category: string]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
  unlocked_difficulties: string[];
  badges_earned: Array<{
    id: string;
    name: string;
    teaches: string;
    earned_at: number;
  }>;
  current_streak: number;
  best_streak: number;
  updated_at: number;
  rank?: number;
  next_level_xp?: number;
  xp_to_next_level?: number;
}

export interface Badge {
  id: string;
  name: string;
  teaches: string;
}

/**
 * Get available learning challenges
 */
export async function getLearningChallenges(params?: {
  category?: string;
  difficulty?: string;
  userLevel?: number;
  username?: string;
}): Promise<LearningChallenge[]> {
  const response = await apiClient.get('/learn/challenges', { params });
  return response.data.challenges;
}

/**
 * Get challenge by ID
 */
export async function getLearningChallenge(id: string): Promise<{
  challenge: LearningChallenge;
  stats: {
    total_predictions: number;
    yes_count: number;
    no_count: number;
    avg_confidence: number;
  };
}> {
  const response = await apiClient.get(`/learn/challenges/${id}`);
  return response.data;
}

/**
 * Generate new learning challenges
 */
export async function generateLearningChallenges(params: {
  count?: number;
  difficulty?: string;
  category?: string;
}): Promise<LearningChallenge[]> {
  const response = await apiClient.post('/learn/challenges/generate', params);
  return response.data.challenges;
}

/**
 * Submit a learning prediction
 */
export async function submitLearningPrediction(data: {
  username: string;
  challengeId: string;
  predictedOutcome: 'yes' | 'no';
  confidenceLevel: number;
  reasoning?: string;
}): Promise<{
  prediction: LearningPrediction;
  isCorrect: boolean;
  pointsEarned: number;
  feedback: {
    explanation: string;
    key_signal: string;
    lesson: string;
    encouragement: string;
    next_steps: string;
    skill_development: string;
  };
  message: string;
}> {
  const response = await apiClient.post('/learn/predictions', data);
  return response.data;
}

/**
 * Get user's prediction history
 */
export async function getUserPredictions(username: string): Promise<LearningPrediction[]> {
  const response = await apiClient.get(`/learn/predictions/user/${username}`);
  return response.data.predictions;
}

/**
 * Get user's learning progress
 */
export async function getLearningProgress(username: string): Promise<LearningProgress> {
  const response = await apiClient.get(`/learn/progress/${username}`);
  return response.data.progress;
}

/**
 * Get learning leaderboard
 */
export async function getLearningLeaderboard(limit = 10): Promise<LearningProgress[]> {
  const response = await apiClient.get('/learn/leaderboard', {
    params: { limit }
  });
  return response.data.leaderboard;
}

/**
 * Get available challenge categories
 */
export async function getLearningCategories(): Promise<string[]> {
  const response = await apiClient.get('/learn/categories');
  return response.data.categories;
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const response = await apiClient.get('/learn/badges');
  return response.data.badges;
}

/**
 * Get market resolution queue status
 */
export async function getResolutionStatus(): Promise<{
  pending: number;
  resolved: number;
  total: number;
  is_polling: boolean;
  polling_active: boolean;
}> {
  const response = await apiClient.get('/learn/resolution-status');
  return response.data.status;
}
