import {
  OAuthClientProvider,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { getDb } from '../utils/db.js';

/**
 * Database-backed OAuth provider for user-specific authentication
 * Stores tokens per user in SQLite database
 */
export class UserOAuthProvider {
  constructor(userId, redirectUrl, clientMetadata) {
    this.userId = userId;
    this._redirectUrl = redirectUrl;
    this._clientMetadata = clientMetadata;
    this._clientInformation = null;
    this._tokens = null;
    this._codeVerifier = null;
    this._pendingAuthUrl = null;
  }

  /**
   * Load saved tokens from database for this user
   */
  async loadSavedTokens() {
    try {
      const db = getDb();
      const row = db.prepare('SELECT * FROM user_oauth_tokens WHERE user_id = ?').get(this.userId);

      if (row) {
        this._tokens = {
          access_token: row.access_token,
          refresh_token: row.refresh_token,
          expires_at: row.expires_at,
        };
        console.log(`✅ Loaded saved OAuth tokens for user ${this.userId}`);
        return true;
      } else {
        console.log(`ℹ️  No saved tokens found for user ${this.userId}`);
        return false;
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      return false;
    }
  }

  /**
   * Save tokens to database for this user
   */
  async saveTokensToDb() {
    if (!this._tokens) return;

    try {
      const db = getDb();
      const now = Math.floor(Date.now() / 1000);

      db.prepare(`
        INSERT INTO user_oauth_tokens (user_id, access_token, refresh_token, expires_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          access_token = excluded.access_token,
          refresh_token = excluded.refresh_token,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `).run(
        this.userId,
        this._tokens.access_token,
        this._tokens.refresh_token,
        this._tokens.expires_at || null,
        now
      );

      console.log(`✅ Saved OAuth tokens for user ${this.userId}`);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Delete tokens from database for this user
   */
  async deleteTokens() {
    try {
      const db = getDb();
      db.prepare('DELETE FROM user_oauth_tokens WHERE user_id = ?').run(this.userId);
      this._tokens = null;
      this._clientInformation = null;
      console.log(`✅ Deleted OAuth tokens for user ${this.userId}`);
    } catch (error) {
      console.error('Error deleting tokens:', error);
      throw error;
    }
  }

  get redirectUrl() {
    return this._redirectUrl;
  }

  get clientMetadata() {
    return this._clientMetadata;
  }

  clientInformation() {
    return this._clientInformation;
  }

  async saveClientInformation(clientInformation) {
    this._clientInformation = clientInformation;
    // Client information is saved as part of tokens
  }

  tokens() {
    return this._tokens;
  }

  async saveTokens(tokens) {
    this._tokens = tokens;
    await this.saveTokensToDb();
  }

  redirectToAuthorization(authorizationUrl) {
    this._pendingAuthUrl = authorizationUrl.toString();
    console.log("\n" + "=".repeat(80));
    console.log(`🔐 OAUTH AUTHENTICATION REQUIRED FOR USER: ${this.userId}`);
    console.log("=".repeat(80));
    console.log("\nPlease complete authentication by visiting:");
    console.log("\n  👉 " + this._pendingAuthUrl);
    console.log("\nAfter authorizing, you'll be redirected to:");
    console.log("  " + this._redirectUrl);
    console.log("\nThe chat will continue once authenticated.");
    console.log("=".repeat(80) + "\n");
  }

  getPendingAuthUrl() {
    return this._pendingAuthUrl;
  }

  clearPendingAuth() {
    this._pendingAuthUrl = undefined;
  }

  async saveCodeVerifier(codeVerifier) {
    this._codeVerifier = codeVerifier;
  }

  async codeVerifier() {
    if (!this._codeVerifier) {
      throw new Error("No code verifier saved");
    }
    return this._codeVerifier;
  }

  /**
   * Check if user has valid tokens
   */
  hasValidTokens() {
    if (!this._tokens || !this._tokens.access_token) {
      return false;
    }

    // Check if token is expired
    if (this._tokens.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= this._tokens.expires_at) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get authentication status for this user
   */
  getAuthStatus() {
    return {
      userId: this.userId,
      isAuthenticated: this.hasValidTokens(),
      hasPendingAuth: !!this._pendingAuthUrl,
      pendingAuthUrl: this._pendingAuthUrl,
    };
  }
}

/**
 * Manager for handling multiple user OAuth providers
 */
export class OAuthProviderManager {
  constructor(redirectUrl, clientMetadata) {
    this.redirectUrl = redirectUrl;
    this.clientMetadata = clientMetadata;
    this.providers = new Map(); // userId -> UserOAuthProvider
  }

  /**
   * Get or create provider for a user
   */
  getProvider(userId) {
    if (!this.providers.has(userId)) {
      const provider = new UserOAuthProvider(
        userId,
        this.redirectUrl,
        this.clientMetadata
      );
      this.providers.set(userId, provider);
    }
    return this.providers.get(userId);
  }

  /**
   * Remove provider for a user (on disconnect)
   */
  removeProvider(userId) {
    this.providers.delete(userId);
  }

  /**
   * Get all active providers
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }
}
