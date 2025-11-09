# 🚀 Cascade Tracker - Complete Setup Guide

## Step-by-Step Setup Instructions

### 1️⃣ Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18 or higher installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Anthropic API key (get from https://console.anthropic.com/settings/keys)

### 2️⃣ Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd cascade-tracker/backend

# Install all dependencies
npm install

# Create environment file from template
cp .env.example .env

# Open .env in your editor
# For macOS:
open .env
# For Linux:
nano .env
# For Windows:
notepad .env
```

**Edit the `.env` file and add your Anthropic API key:**
```
PORT=3001
NODE_ENV=development
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here  # ← ADD YOUR KEY HERE
POLYMARKET_API_KEY=optional-for-mvp
DB_PATH=./cascade.db
ENABLE_LIVE_DATA=false
```

**Seed the database with sample data:**
```bash
npm run seed
```

You should see:
```
🌱 Seeding database...
✅ Seeded cascade: Fed Rate Decision Impact
✅ Seeded cascade: AI Breakthrough Announcement
✅ Seeded cascade: Election Poll Shift
✅ Seeded user: MarketMaster
✅ Seeded user: CascadeKing
✅ Seeded user: PredictorPro
🎉 Database seeded successfully!
```

**Start the backend server:**
```bash
npm run dev
```

You should see:
```
✅ Configuration validated
✅ Database initialized
✅ Database tables created
🚀 Server running on port 3001
📊 Visit http://localhost:3001/health
```

**Test the backend (in a new terminal):**
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-01-08T...","uptime":1.234}
```

✅ **Backend is working!**

---

### 3️⃣ Frontend Setup (5 minutes)

**Open a new terminal window** and:

```bash
# Navigate to frontend directory
cd cascade-tracker/frontend

# Install all dependencies
npm install

# Create environment file from template
cp .env.local.example .env.local

# Open .env.local in your editor
# For macOS:
open .env.local
# For Linux:
nano .env.local
# For Windows:
notepad .env.local
```

**Edit the `.env.local` file:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Start the frontend server:**
```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

✅ **Frontend is working!**

---

### 4️⃣ Open the App

Open your browser and go to:
```
http://localhost:3000
```

You should see:
- 🎯 **Cascade Tracker** header
- 3 sample cascades displayed:
  - Fed Rate Decision Impact
  - AI Breakthrough Announcement
  - Election Poll Shift

Click on any cascade to see details!

---

## 🧪 Testing Everything Works

### Test 1: Backend API
```bash
# List cascades
curl http://localhost:3001/api/cascades

# Get specific cascade
curl http://localhost:3001/api/cascades/cascade_1

# Get leaderboard
curl http://localhost:3001/api/leaderboard
```

### Test 2: Frontend Pages
- ✅ Home page: `http://localhost:3000`
- ✅ Cascade detail: `http://localhost:3000/cascade/cascade_1`

### Test 3: Make a Prediction
```bash
curl -X POST http://localhost:3001/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "cascadeId": "cascade_1",
    "userId": "test_user_123",
    "username": "TestUser",
    "prediction": "BTC will go up due to rate cuts",
    "market": "btc_60k",
    "confidence": 0.8
  }'
```

---

## 📁 Project Structure

```
cascade-tracker/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── config.js          # Configuration
│   │   ├── routes/            # API endpoints
│   │   │   ├── cascades.js
│   │   │   ├── predictions.js
│   │   │   ├── leaderboard.js
│   │   │   ├── challenges.js
│   │   │   └── signals.js
│   │   ├── services/          # Business logic
│   │   │   ├── claudeService.js
│   │   │   ├── scoringService.js
│   │   │   └── leaderboardService.js
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Database & helpers
│   │   └── data/              # Seed data
│   ├── package.json
│   └── .env                   # ← YOU CREATE THIS
│
└── frontend/                   # Next.js 14 app
    ├── src/
    │   ├── app/               # Pages & layouts
    │   │   ├── page.tsx       # Home page
    │   │   ├── layout.tsx     # Root layout
    │   │   ├── globals.css    # Global styles
    │   │   └── cascade/[id]/  # Cascade detail page
    │   ├── components/        # React components (add yours here)
    │   ├── services/          # API client
    │   │   └── api.ts
    │   ├── store/             # Zustand state
    │   │   └── cascadeStore.ts
    │   └── types/             # TypeScript types
    │       └── index.ts
    ├── package.json
    └── .env.local             # ← YOU CREATE THIS
```

---

## 🐛 Troubleshooting

### Problem: "ANTHROPIC_API_KEY not set"
**Solution:**
1. Make sure you created `.env` file in `backend/` directory
2. Add your key: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the backend server

### Problem: "Failed to load cascades"
**Solution:**
1. Make sure backend is running (check `http://localhost:3001/health`)
2. Check `.env.local` in frontend has: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
3. Check browser console for errors (F12)

### Problem: "Port 3001 already in use"
**Solution:**
```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Restart backend
cd backend && npm run dev
```

### Problem: Frontend build errors
**Solution:**
```bash
# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problem: Database errors
**Solution:**
```bash
# Delete database and reseed
cd backend
rm cascade.db
npm run seed
npm run dev
```

---

## 🎯 Next Steps - Build Your Hackathon Project!

### Quick Wins (30 min each)
1. **Add a Prediction Form**
   - Create `frontend/src/components/PredictionInput.tsx`
   - Add form to cascade detail page
   - Submit predictions to backend

2. **Add Leaderboard Page**
   - Create `frontend/src/app/leaderboard/page.tsx`
   - Fetch from `/api/leaderboard`
   - Display top users

3. **Improve Cascade Display**
   - Add network graph visualization
   - Show impact forecast table
   - Display educational takeaways

### Medium Tasks (1-2 hours)
4. **Real Claude Integration**
   - Call Claude API for cascade explanations
   - Generate predictions dynamically
   - Provide educational feedback

5. **User System**
   - Add user login/signup
   - Track user predictions
   - Show personal stats

6. **Live Polymarket Data**
   - Connect to Polymarket API
   - Fetch real market data
   - Update cascades in real-time

### Advanced Features (3+ hours)
7. **Challenge System**
   - Create progressive challenges
   - Track completion
   - Award badges

8. **Signal Progression**
   - Unlock trading signals
   - Show educational tooltips
   - Guide user learning

9. **Analytics Dashboard**
   - User performance charts
   - Market correlation graphs
   - Prediction accuracy tracking

---

## 📚 Key Files to Modify

### Adding New API Endpoint
1. Create route file in `backend/src/routes/`
2. Add route to `backend/src/index.js`
3. Add client function in `frontend/src/services/api.ts`

### Adding New Page
1. Create page in `frontend/src/app/your-page/page.tsx`
2. Link from other pages
3. Add to navigation if needed

### Adding New Component
1. Create in `frontend/src/components/YourComponent.tsx`
2. Import and use in pages
3. Add to TypeScript types if needed

---

## 🚢 Deployment

### Backend (Railway)
1. Push to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Add environment variable: `ANTHROPIC_API_KEY`
5. Deploy!

### Frontend (Vercel)
1. Push to GitHub
2. Go to https://vercel.com
3. Import Project → Select your repo
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
5. Deploy!

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] Anthropic API key obtained
- [ ] Backend dependencies installed
- [ ] Backend `.env` file created with API key
- [ ] Database seeded with sample data
- [ ] Backend running on port 3001
- [ ] Backend health check passes
- [ ] Frontend dependencies installed
- [ ] Frontend `.env.local` file created
- [ ] Frontend running on port 3000
- [ ] Can view cascades at http://localhost:3000
- [ ] Can click cascade and see details
- [ ] Can make API calls successfully

---

**You're all set! Start building your hackathon project! 🚀**

For help, check:
- README.md for quick reference
- API documentation in route files
- TypeScript types in `frontend/src/types/index.ts`
