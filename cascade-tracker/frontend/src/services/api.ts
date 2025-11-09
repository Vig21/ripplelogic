import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cascades
export const getCascades = async (limit = 10) => {
  const response = await client.get('/cascades', { params: { limit } });
  return response.data.data;
};

export const getCascade = async (id: string) => {
  const response = await client.get(`/cascades/${id}`);
  return response.data.data;
};

// Predictions
export const submitPrediction = async (data: {
  cascadeId: string;
  userId: string;
  username: string;
  prediction: string;
  market?: string;
  confidence?: number;
}) => {
  const response = await client.post('/predictions', data);
  return response.data.data;
};

// Leaderboard
export const getLeaderboard = async (limit = 10) => {
  const response = await client.get('/leaderboard', { params: { limit } });
  return response.data.data;
};

export const getUserPosition = async (userId: string) => {
  const response = await client.get(`/leaderboard/user/${userId}`);
  return response.data.data;
};

// Challenges
export const getChallenges = async (userId?: string) => {
  const response = await client.get('/challenges', { params: { userId } });
  return response.data.data;
};

// Signals
export const getSignals = async (userId?: string) => {
  const response = await client.get('/signals', { params: { userId } });
  return response.data.data;
};

// Chat
export const askClaude = async (data: {
  question: string;
  cascadeId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}) => {
  const response = await client.post('/chat/ask', data);
  return response.data.data;
};

export default client;
