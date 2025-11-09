import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { claudeService } from '../services/claudeService.js';

/**
 * WebSocket Chat Server for Polymarket Trading Assistant
 */
export class ChatServer {
  constructor(server, mcpSessionManager) {
    this.wss = new WebSocketServer({ server });
    this.mcpSessionManager = mcpSessionManager;
    this.clients = new Map(); // ws -> { userId, sessionId, conversationHistory }

    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection');

      // Handle initial connection
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, error.message);
        }
      });

      ws.on('close', () => {
        const clientData = this.clients.get(ws);
        if (clientData) {
          console.log(`👋 WebSocket disconnected for user ${clientData.userId}`);
          this.clients.delete(ws);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('✅ WebSocket server is ready');
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(ws, message) {
    const { type, userId, content, sessionId } = message;

    switch (type) {
      case 'auth':
        await this.handleAuth(ws, userId, sessionId);
        break;

      case 'message':
        await this.handleChatMessage(ws, userId, content);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  /**
   * Handle user authentication
   */
  async handleAuth(ws, userId, sessionId) {
    try {
      // Initialize client data
      const clientData = {
        userId,
        sessionId: sessionId || uuidv4(),
        conversationHistory: [],
      };

      this.clients.set(ws, clientData);

      // Get or create MCP session for this user
      await this.mcpSessionManager.getSession(userId);

      this.send(ws, {
        type: 'auth_success',
        sessionId: clientData.sessionId,
      });
      console.log(`✅ User ${userId} authenticated, session: ${clientData.sessionId}`);
    } catch (error) {
      console.error('Auth error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  /**
   * Handle chat messages
   */
  async handleChatMessage(ws, userId, userMessage) {
    const clientData = this.clients.get(ws);

    if (!clientData) {
      this.sendError(ws, 'Not authenticated. Please reconnect.');
      return;
    }

    try {
      // Get MCP session for this user
      const mcpSession = await this.mcpSessionManager.getSession(userId);

      // Check if MCP session is connected
      if (!mcpSession.isConnected) {
        this.send(ws, {
          type: 'status',
          message: 'Connecting to Polymarket...',
        });

        // Try to initialize
        await mcpSession.initialize();

        if (!mcpSession.isConnected) {
          this.sendError(ws, 'Failed to connect to Polymarket');
          return;
        }
      }

      // Add user message to history
      clientData.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Send immediate processing indicator
      this.send(ws, {
        type: 'processing',
        message: 'Thinking...',
      });

      // Process message with Claude and MCP tools
      const response = await claudeService.processMessageWithTools(
        userMessage,
        clientData.conversationHistory,
        mcpSession,
        async (chunk) => {
          // Stream response chunks to client immediately!
          this.send(ws, {
            type: 'stream',
            content: chunk,
          });
        },
        async (statusMessage) => {
          // Send status updates (like "Searching markets...")
          this.send(ws, {
            type: 'status',
            message: statusMessage,
          });
        }
      );

      // Add assistant response to history
      clientData.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      console.log(`✅ Message processed for user ${userId}`);

    } catch (error) {
      console.error('Error processing chat message:', error);
      this.sendError(ws, `Error: ${error.message}`);
    }
  }

  /**
   * Send JSON message to WebSocket client
   */
  send(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send error message
   */
  sendError(ws, message) {
    this.send(ws, {
      type: 'error',
      message,
    });

    // Also send [END] to stop loading state
    this.send(ws, {
      type: 'stream',
      content: '[END]',
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        this.send(client, message);
      }
    });
  }

  /**
   * Close server
   */
  close() {
    this.wss.close();
    console.log('🔌 WebSocket server closed');
  }
}
