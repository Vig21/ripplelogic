import express from 'express';
import cors from 'cors';
import http from 'http';
import { initializeDatabase } from './utils/db.js';
import { errorHandler, requestLogger } from './middleware/errorHandler.js';
import { config } from './config.js';

// Import routes
import cascadeRoutes from './routes/cascades.js';
import predictionRoutes from './routes/predictions.js';
import leaderboardRoutes from './routes/leaderboard.js';
import challengeRoutes from './routes/challenges.js';
import signalRoutes from './routes/signals.js';
import chatRoutes from './routes/chat.js';
import learnRoutes from './routes/learn.js';

// Import WebSocket and MCP services
import { ChatServer } from './websocket/chatServer.js';
import { MCPSessionManager } from './services/mcpService.js';
import { marketResolutionService } from './services/marketResolutionService.js';

const app = express();
const PORT = config.PORT;
const WS_PORT = config.WS_PORT;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ============================================
// DATABASE INITIALIZATION
// ============================================
try {
  initializeDatabase();
  console.log('✅ Database initialized');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// ============================================
// MCP INITIALIZATION
// ============================================
const mcpSessionManager = new MCPSessionManager();

console.log('✅ MCP session manager initialized');

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/cascades', cascadeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/learn', learnRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorHandler);

// ============================================
// START SERVERS
// ============================================

// Create HTTP server for Express
const httpServer = http.createServer(app);

// Create WebSocket server on separate HTTP server for chat
const wsHttpServer = http.createServer();
const chatServer = new ChatServer(wsHttpServer, mcpSessionManager);

// Start Express server
httpServer.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT}/health`);
});

// Start WebSocket server
wsHttpServer.listen(WS_PORT, () => {
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
  console.log(`💬 Chat available at ws://localhost:${WS_PORT}`);
});

// ============================================
// START MARKET RESOLUTION POLLING
// ============================================
// DISABLED: Skipping Polymarket API polling - using seeded data for gamification
// marketResolutionService.startPolling();
// console.log('✅ Market resolution polling started');
console.log('ℹ️  Market resolution polling disabled - using seeded data');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  marketResolutionService.stopPolling();
  await mcpSessionManager.cleanup();
  chatServer.close();
  httpServer.close();
  wsHttpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  marketResolutionService.stopPolling();
  await mcpSessionManager.cleanup();
  chatServer.close();
  httpServer.close();
  wsHttpServer.close();
  process.exit(0);
});
