import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { config } from '../config.js';

const POLYMARKET_MCP_URL = "https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp";
const POLYMARKET_API_KEY = "aeb6ea24-5630-4e55-a03d-903a2e9d770b";
const POLYMARKET_PROFILE = "zealous-gopher-kBTcAGY";

/**
 * Simple API key auth provider with OAuth metadata
 */
class ApiKeyAuthProvider {
  constructor(apiKey, redirectUrl = 'http://localhost:3001/api/oauth/callback') {
    this.apiKey = apiKey;
    this._redirectUrl = redirectUrl;
    this._clientMetadata = {
      client_name: "Cascade Tracker Trading Assistant",
      redirect_uris: [redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp:tools mcp:prompts mcp:resources",
    };
  }

  get redirectUrl() {
    return this._redirectUrl;
  }

  get clientMetadata() {
    return this._clientMetadata;
  }

  clientInformation() {
    // Return dummy client info as if already registered
    return {
      client_id: "cascade-tracker-client",
      ...this._clientMetadata,
    };
  }

  async saveClientInformation() {
    // No-op - we're using static client info
  }

  tokens() {
    return {
      access_token: this.apiKey,
      token_type: "Bearer",
    };
  }

  async saveTokens() {
    // No-op - API key doesn't change
  }

  redirectToAuthorization() {
    // No-op - we're not doing interactive OAuth
  }

  saveCodeVerifier() {
    // No-op
  }

  codeVerifier() {
    return null;
  }
}

/**
 * User-specific MCP client session
 */
export class UserMCPSession {
  constructor(userId) {
    this.userId = userId;
    this.client = null;
    this.transport = null;
    this.availableTools = [];
    this.isConnected = false;
  }

  /**
   * Initialize MCP client for this user
   */
  async initialize() {
    try {
      console.log(`🔌 Initializing MCP client for user ${this.userId}...`);

      // Construct URL with API key and profile as query parameters
      const url = new URL(POLYMARKET_MCP_URL);
      url.searchParams.set('api_key', POLYMARKET_API_KEY);
      url.searchParams.set('profile', POLYMARKET_PROFILE);

      console.log(`🔗 Connecting to: ${url.toString().replace(POLYMARKET_API_KEY, '***')}`);

      // Create transport without auth provider (API key is in URL)
      this.transport = new StreamableHTTPClientTransport(url);

      this.client = new Client(
        {
          name: `cascade-tracker-${this.userId}`,
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      console.log(`✅ MCP client connected for user ${this.userId}`);

      // Load available tools
      await this.loadTools();
      this.isConnected = true;

      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize MCP client for user ${this.userId}:`, error);
      throw error;
    }
  }

  /**
   * Load available tools from MCP server
   */
  async loadTools() {
    if (!this.client) {
      throw new Error("MCP client not initialized");
    }

    try {
      const toolsResponse = await this.client.listTools();
      console.log(`📋 Found ${toolsResponse.tools.length} tools for user ${this.userId}:`);

      toolsResponse.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
      });

      // Convert MCP tools to Anthropic tool format
      this.availableTools = toolsResponse.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        input_schema: tool.inputSchema,
      }));

      console.log(`✅ Tools converted to Anthropic format for user ${this.userId}`);
    } catch (error) {
      console.error(`❌ Error loading tools for user ${this.userId}:`, error);
      throw error;
    }
  }

  /**
   * Get available tools in Anthropic format
   */
  getTools() {
    return this.availableTools;
  }

  /**
   * Call a tool with retry logic for session expiration
   */
  async callTool(toolName, toolInput) {
    if (!this.client) {
      throw new Error("MCP client not initialized");
    }

    const maxRetries = 2;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log(`🔧 Calling tool ${toolName} for user ${this.userId}`);
        console.log(`   Input:`, JSON.stringify(toolInput, null, 2));

        const result = await this.client.callTool({
          name: toolName,
          arguments: toolInput,
        });

        console.log(`✅ Tool result received for ${toolName}`);
        return result;

      } catch (error) {
        const errorMessage = error?.message || String(error);

        // Check if it's a session expiration error
        if (errorMessage.includes("Session not found") && retries < maxRetries - 1) {
          console.log(`⚠️  Session expired for user ${this.userId}, reconnecting... (attempt ${retries + 1}/${maxRetries - 1})`);
          await this.reconnect();
          retries++;
          continue;
        }

        // If not session error or out of retries, throw
        console.error(`❌ Error calling tool ${toolName}:`, errorMessage);
        throw error;
      }
    }

    throw new Error(`Failed to call tool ${toolName} after ${maxRetries} attempts`);
  }

  /**
   * Reconnect after session expiration
   */
  async reconnect() {
    console.log(`🔄 Reconnecting MCP session for user ${this.userId}...`);

    // Close existing client
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error closing existing client:', error);
      }
    }

    // Reinitialize
    await this.initialize();
    console.log(`✅ Session restored for user ${this.userId}`);
  }


  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        console.log(`✅ Disconnected MCP client for user ${this.userId}`);
      } catch (error) {
        console.error(`Error disconnecting MCP client for user ${this.userId}:`, error);
      }
    }
    this.client = null;
    this.transport = null;
    this.isConnected = false;
  }
}

/**
 * Manager for handling multiple user MCP sessions
 */
export class MCPSessionManager {
  constructor() {
    this.sessions = new Map(); // userId -> UserMCPSession
  }

  /**
   * Get or create MCP session for a user
   */
  async getSession(userId) {
    if (!this.sessions.has(userId)) {
      const session = new UserMCPSession(userId);

      // Initialize the session
      try {
        await session.initialize();
      } catch (error) {
        console.log(`Session initialization failed for user ${userId}:`, error);
      }

      this.sessions.set(userId, session);
    }

    return this.sessions.get(userId);
  }

  /**
   * Remove session for a user (on disconnect or logout)
   */
  async removeSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      await session.disconnect();
      this.sessions.delete(userId);
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Cleanup all sessions
   */
  async cleanup() {
    console.log('🧹 Cleaning up all MCP sessions...');
    for (const session of this.sessions.values()) {
      await session.disconnect();
    }
    this.sessions.clear();
  }
}
