# Polymarket MCP Trading Assistant Setup Guide

This guide will help you set up and use the Polymarket MCP Trading Assistant integrated into Cascade Tracker.

## Overview

The Polymarket Trading Assistant is a real-time AI-powered chatbot that provides:
- **Market Search**: Find prediction markets by keywords
- **Trend Analysis**: AI-powered analysis of market trends
- **Market Data**: Real-time market information and probabilities
- **Cascade Insights**: Understand how markets influence each other

## Architecture

```
Frontend (Next.js)           Backend (Express + WebSocket)          Polymarket MCP
├── PolymarketTradingChat   ├── WebSocket Server (port 3002)      ├── OAuth Provider
├── WebSocket Service        ├── MCP Session Manager               ├── Market Tools
├── Chat Store (Zustand)     ├── OAuth Provider Manager            └── Real-time Data
└── OAuth Modal              └── Claude + MCP Integration
```

## Prerequisites

1. **Node.js** 18+ installed
2. **Anthropic Claude API Key** (required)
3. **Polymarket Account** (for OAuth authentication)

## Installation Steps

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies (already done if you followed the main setup):
```bash
npm install
```

Create `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```env
PORT=3001
WS_PORT=3002
NODE_ENV=development

# Required: Add your Anthropic API key here
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# MCP Server URL (default is correct)
POLYMARKET_MCP_URL=https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp

# Database
DB_PATH=./cascade.db

# Features
ENABLE_LIVE_DATA=false
```

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../frontend
```

Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

The default values should work for local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ Database initialized
✅ MCP session manager initialized
🚀 Express server running on port 3001
📊 Visit http://localhost:3001/health
🔐 OAuth callback: http://localhost:3001/api/oauth/callback
🔌 WebSocket server running on port 3002
💬 Chat available at ws://localhost:3002
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
```

## Using the Trading Assistant

### First-Time Setup

1. **Open the Application**
   - Navigate to `http://localhost:3000`
   - You'll see the chat icon in the bottom-right corner

2. **Open the Chat**
   - Click the purple/cyan gradient chat bubble
   - Chat window will slide open

3. **Authenticate with Polymarket**
   - On first use, you'll be prompted to authenticate
   - Click "Authenticate with Polymarket"
   - A popup window will open
   - Complete the OAuth flow on Polymarket/Smithery
   - Window will auto-close after successful authentication

4. **Start Chatting**
   - Once authenticated, type your question
   - Example: "What are the trending markets right now?"

### Features

#### Global Availability
- Chat icon appears on **all pages** (home, cascade detail, leaderboard, archive)
- Your conversation persists as you navigate
- Connection maintained in the background

#### Real-Time Streaming
- Responses stream word-by-word for better UX
- See AI "thinking" with animated indicators
- Immediate feedback on message processing

#### Market Tools Available

The assistant has access to these Polymarket tools:

| Tool | Description |
|------|-------------|
| `search_markets` | Search for markets by keywords |
| `get_market` | Get detailed information about a specific market |
| `search_events` | Search events containing multiple markets |
| `get_event` | Get full event details with all markets |
| `list_tags` | List available market categories |
| `get_trades` | Get recent trading activity |
| `analyze_market` | Analyze market trends and probabilities |

#### Suggested Queries

Try these to get started:
- "What are the trending markets right now?"
- "Find markets about Bitcoin"
- "Show me the most active prediction markets"
- "Analyze cascade effects in crypto markets"
- "What markets are closing soon?"
- "Find all markets in the Politics category"

## User-Specific Authentication

Each user has their own Polymarket connection:
- OAuth tokens are stored per user in the database
- Multiple users can use the app simultaneously
- Each user maintains their own conversation history
- No shared state between users

## Troubleshooting

### Chat Icon Not Appearing
- Check browser console for errors
- Ensure frontend is running on port 3000
- Verify `PolymarketTradingChat` is imported in `layout.tsx`

### WebSocket Connection Failed
- Verify backend WebSocket server is running on port 3002
- Check `NEXT_PUBLIC_WS_URL` in frontend `.env.local`
- Look for WebSocket errors in backend logs

### OAuth Authentication Issues

**Problem**: OAuth popup blocked
- **Solution**: Allow popups for localhost in browser settings

**Problem**: OAuth callback fails
- **Solution**: Verify `PORT` in backend `.env` matches the callback URL
- Check backend logs for OAuth errors

**Problem**: "Not authenticated" persists after OAuth
- **Solution**:
  1. Open browser DevTools → Application → IndexedDB
  2. Clear site data
  3. Refresh page and try OAuth again

### Messages Not Streaming

**Problem**: Messages don't appear or don't stream
- **Solution**:
  1. Check WebSocket connection status (green dot in chat header)
  2. Look for `[END]` markers in backend logs
  3. Verify Claude API key is valid in backend `.env`

### MCP Server Connection Issues

**Problem**: "Failed to connect to MCP server"
- **Solution**:
  1. Verify `POLYMARKET_MCP_URL` is correct
  2. Check internet connection
  3. Look for MCP-related errors in backend logs

## Database Schema

The integration adds two new tables:

**user_oauth_tokens**
```sql
- id (PRIMARY KEY)
- user_id (UNIQUE, references users.id)
- access_token
- refresh_token
- expires_at
- created_at
- updated_at
```

**chat_conversations**
```sql
- id (PRIMARY KEY)
- user_id (references users.id)
- session_id
- messages (JSON array)
- created_at
- updated_at
```

## API Endpoints

### WebSocket Messages

**Client → Server:**
```json
{
  "type": "auth",
  "userId": "user-id",
  "sessionId": "session-id-optional"
}
```

```json
{
  "type": "message",
  "userId": "user-id",
  "content": "What are trending markets?"
}
```

**Server → Client:**
```json
{
  "type": "stream",
  "content": "word "
}
```

```json
{
  "type": "auth_required",
  "authUrl": "https://...",
  "message": "Please authenticate"
}
```

### HTTP OAuth Endpoints

- `POST /api/oauth/start` - Initiate OAuth flow
- `GET /api/oauth/callback` - OAuth callback handler
- `GET /api/oauth/status/:userId` - Check auth status
- `DELETE /api/oauth/disconnect/:userId` - Disconnect user

## Development Tips

### Testing OAuth Flow
1. Open two browser windows
2. Authenticate as different users
3. Verify each has separate conversations and auth states

### Debugging WebSocket Messages
Add this to frontend console:
```javascript
// In browser DevTools console
websocketService.on('*', (data) => console.log('WS:', data));
```

### Monitoring MCP Tool Calls
Check backend logs for:
```
🔧 Tool called: search_markets
   Input: { "query": "Bitcoin" }
✅ Tool result received for search_markets
```

## Production Deployment

### Environment Variables

**Backend:**
```env
NODE_ENV=production
PORT=3001
WS_PORT=3002
ANTHROPIC_API_KEY=sk-ant-production-key
POLYMARKET_MCP_URL=https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp
DB_PATH=/path/to/production/cascade.db
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com:3002
```

### Security Considerations

1. **Use HTTPS/WSS in production**
   - WebSocket: `wss://` instead of `ws://`
   - API: `https://` instead of `http://`

2. **Secure OAuth Callback**
   - Update redirect URI to production domain
   - Use environment-specific callback URLs

3. **Rate Limiting**
   - Implement rate limiting on WebSocket connections
   - Limit messages per user per minute

4. **Token Security**
   - OAuth tokens stored securely in database
   - Never expose tokens in client-side code
   - Implement token refresh logic

## Support

For issues or questions:
1. Check backend logs for error details
2. Verify environment variables are set correctly
3. Test with simple queries first (e.g., "Hello")
4. Ensure Anthropic API key has sufficient credits

## Next Steps

Once everything is working:
1. Explore different market queries
2. Test cascade effect analysis
3. Compare with markets on Polymarket.com
4. Integrate market data into your predictions
5. Build custom features using the MCP tools

---

**Congratulations!** You now have a fully functional Polymarket Trading Assistant integrated into Cascade Tracker. 🎉
