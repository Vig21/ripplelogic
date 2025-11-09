import express from 'express';

const router = express.Router();

let mcpSessionManager = null;

/**
 * Initialize OAuth routes with MCP session manager
 */
export function initOAuthRoutes(sessionManager) {
  mcpSessionManager = sessionManager;
  return router;
}

/**
 * OAuth callback endpoint
 * Called after user authorizes the application on Polymarket/Smithery
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // state can contain userId
  const error = req.query.error;

  if (error) {
    console.error('❌ OAuth error:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 1rem;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 2rem;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 600;
            }
            button:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>There was an error during authentication: ${error}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // Extract userId from state parameter (if provided)
    // For now, we'll use a default user if not provided
    const userId = state || 'default-user';

    console.log(`✅ OAuth callback received for user ${userId}`);

    // Complete OAuth flow
    await mcpSessionManager.completeOAuth(userId, code);

    // Send success page that can be closed
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            .success-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #10b981;
              margin-bottom: 1rem;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 2rem;
            }
            button {
              background: #10b981;
              color: white;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 600;
            }
            button:hover {
              background: #059669;
            }
            .info {
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 0.5rem;
              margin-bottom: 2rem;
              font-size: 0.875rem;
              color: #374151;
            }
          </style>
          <script>
            // Auto-close after 3 seconds and notify parent window
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_success' }, '*');
              }
              window.close();
            }, 3000);
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Authentication Successful!</h1>
            <div class="info">
              You've successfully connected to Polymarket.
            </div>
            <p>You can now use the trading assistant to analyze prediction markets.</p>
            <button onclick="window.close()">Close Window</button>
            <p style="font-size: 0.875rem; color: #9ca3af; margin-top: 1rem;">
              This window will close automatically in 3 seconds...
            </p>
          </div>
        </body>
      </html>
    `);

    console.log(`✅ OAuth flow completed for user ${userId}`);
  } catch (error) {
    console.error('❌ Error completing OAuth:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 1rem;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 2rem;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 600;
            }
            button:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">⚠️</div>
            <h1>Authentication Error</h1>
            <p>There was an error completing the authentication process.</p>
            <p style="font-size: 0.875rem; color: #6b7280;">${error.message}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }
});

/**
 * Start OAuth flow for a user
 */
router.post('/start', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get or create MCP session
    const session = await mcpSessionManager.getSession(userId);

    // Check if already authenticated
    if (session.oauthProvider.hasValidTokens()) {
      return res.json({
        authenticated: true,
        message: 'Already authenticated',
      });
    }

    // Get pending auth URL (if OAuth flow was initiated)
    const authUrl = session.getPendingAuthUrl();

    if (authUrl) {
      return res.json({
        authenticated: false,
        authUrl,
        message: 'Please complete authentication',
      });
    }

    // Try to initialize (this will trigger OAuth if needed)
    await session.initialize();

    const newAuthUrl = session.getPendingAuthUrl();

    res.json({
      authenticated: session.isConnected,
      authUrl: newAuthUrl,
      message: newAuthUrl ? 'Please complete authentication' : 'Authentication successful',
    });
  } catch (error) {
    console.error('Error starting OAuth:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check OAuth status for a user
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await mcpSessionManager.getSession(userId);
    const authStatus = session.oauthProvider.getAuthStatus();

    res.json({
      ...authStatus,
      isConnected: session.isConnected,
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect OAuth for a user
 */
router.delete('/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await mcpSessionManager.getSession(userId);
    await session.oauthProvider.deleteTokens();
    await mcpSessionManager.removeSession(userId);

    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting OAuth:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
