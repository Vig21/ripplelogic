import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 3001,
  WS_PORT: process.env.WS_PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // APIs
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  POLYMARKET_API_KEY: process.env.POLYMARKET_API_KEY,
  POLYMARKET_MCP_URL: process.env.POLYMARKET_MCP_URL || 'https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp',

  // Database
  DB_PATH: process.env.DB_PATH || './cascade.db',

  // Features
  ENABLE_LIVE_DATA: process.env.ENABLE_LIVE_DATA === 'true',
  CACHE_TTL: 60000, // 1 minute

  // Validation
  PREDICTIONS_PER_USER_PER_CASCADE: 1,
  MIN_CASCADE_DELAY: 3600000, // 1 hour between cascades
};

export const validateConfig = () => {
  if (!config.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  console.log('✅ Configuration validated');
};
