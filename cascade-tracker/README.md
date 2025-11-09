# 🎯 Cascade Tracker

Learn prediction markets through real-time AI-powered cascade analysis. Built with Claude AI and Polymarket integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Anthropic API key (get from https://console.anthropic.com)
- Polymarket API key (optional for MVP)

### Setup Instructions

#### 1. Clone and Install Backend

```bash
# Navigate to backend directory
cd cascade-tracker/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Add your keys to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

#### 2. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Backend will run on `http://localhost:3001`

#### 3. Install Frontend

```bash
# In a new terminal, navigate to frontend
cd cascade-tracker/frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Add backend URL to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### 4. Start Frontend Server

```bash
# Development mode
npm run dev
```

Frontend will run on `http://localhost:3000`

#### 5. Open Browser

Visit `http://localhost:3000` and you should see the Cascade Tracker homepage!

## 📁 Project Structure

```
cascade-tracker/
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── index.js      # Server entry point
│   │   ├── config.js     # Configuration
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Database & helpers
│   └── package.json
│
└── frontend/             # Next.js 14 app
    ├── src/
    │   ├── app/         # Pages & layouts
    │   ├── components/  # React components
    │   ├── services/    # API client
    │   ├── store/       # Zustand state
    │   └── types/       # TypeScript types
    └── package.json
```

## 🔧 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI**: Anthropic Claude API
- **Database**: SQLite (MVP)
- **Markets**: Polymarket API

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts

## 🎮 Features

### MVP Features
- ✅ Real-time cascade display
- ✅ AI-powered predictions
- ✅ User leaderboard
- ✅ Prediction scoring
- ✅ Educational feedback

### Coming Soon
- 🔄 Live Polymarket integration
- 🔄 Network visualization
- 🔄 Advanced challenges
- 🔄 Signal progression system

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T...",
  "uptime": 123.456
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cascades` | GET | List all cascades |
| `/api/cascades/:id` | GET | Get cascade detail |
| `/api/predictions` | POST | Submit prediction |
| `/api/leaderboard` | GET | Get top players |
| `/api/leaderboard/user/:userId` | GET | Get user rank |

## 🐛 Troubleshooting

### Backend won't start

**Error**: `ANTHROPIC_API_KEY not set`
- Make sure you created `.env` file in `backend/` directory
- Add valid Claude API key: `ANTHROPIC_API_KEY=sk-ant-...`

**Error**: `Database not initialized`
- Backend will auto-create database on first run
- Delete `cascade.db` file and restart if corrupted

### Frontend won't connect

**Error**: `Failed to load cascades`
- Make sure backend is running on port 3001
- Check `.env.local` has correct API URL
- Verify CORS is enabled (already configured)

### Port already in use

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
ANTHROPIC_API_KEY=sk-ant-your-key
POLYMARKET_API_KEY=optional
DB_PATH=./cascade.db
ENABLE_LIVE_DATA=false
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚢 Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Add `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

## 🤝 Contributing

This is a hackathon project! Feel free to:
- Add new cascade detection algorithms
- Improve prediction scoring
- Enhance UI/UX
- Add more educational features

## 📄 License

MIT License - feel free to use for your hackathon projects!

## 🙏 Acknowledgments

- Built with Claude AI (Anthropic)
- Market data from Polymarket
- Hackathon project for Claude + Polymarket integration

---

**Happy Cascading! 🌊**

For questions or issues, create an issue in the repository.
