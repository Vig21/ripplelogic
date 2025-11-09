#!/bin/bash

# Domino Learn Section - Quick Test Script
# This script tests the complete Learn section implementation

echo "🎯 Domino Learn Section - Test Script"
echo "======================================"
echo ""

API_URL="http://localhost:3001/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Generate Learning Challenges
echo -e "${BLUE}Test 1: Generating 3 beginner challenges...${NC}"
curl -s -X POST ${API_URL}/learn/challenges/generate \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3,
    "difficulty": "beginner",
    "category": "Finance"
  }' | jq '.'

echo ""
echo -e "${GREEN}✅ Test 1 Complete${NC}"
echo ""

# Test 2: List Available Challenges
echo -e "${BLUE}Test 2: Listing available challenges...${NC}"
CHALLENGES=$(curl -s ${API_URL}/learn/challenges | jq -r '.challenges[0].id')
echo "First challenge ID: ${CHALLENGES}"

if [ -z "$CHALLENGES" ]; then
  echo -e "${RED}❌ No challenges found. Please generate challenges first.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Test 2 Complete${NC}"
echo ""

# Test 3: Get Challenge Details
echo -e "${BLUE}Test 3: Getting challenge details...${NC}"
curl -s ${API_URL}/learn/challenges/${CHALLENGES} | jq '.challenge | {id, title: .market_question, difficulty: .difficulty_level, status}'

echo ""
echo -e "${GREEN}✅ Test 3 Complete${NC}"
echo ""

# Test 4: Submit a Prediction
echo -e "${BLUE}Test 4: Submitting a test prediction...${NC}"
curl -s -X POST ${API_URL}/learn/predictions \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser_$(date +%s)\",
    \"challengeId\": \"${CHALLENGES}\",
    \"predictedOutcome\": \"yes\",
    \"confidenceLevel\": 4,
    \"reasoning\": \"This is a test prediction from the automated test script\"
  }" | jq '.'

echo ""
echo -e "${GREEN}✅ Test 4 Complete${NC}"
echo ""

# Test 5: Check User Progress
echo -e "${BLUE}Test 5: Checking user progress...${NC}"
TEST_USER="testuser_$(date +%s)"
curl -s ${API_URL}/learn/progress/${TEST_USER} | jq '.progress | {current_level, experience_points, total_challenges, correct_predictions, unlocked_difficulties}'

echo ""
echo -e "${GREEN}✅ Test 5 Complete${NC}"
echo ""

# Test 6: Check Resolution Queue Status
echo -e "${BLUE}Test 6: Checking resolution queue status...${NC}"
curl -s ${API_URL}/learn/resolution-status | jq '.status'

echo ""
echo -e "${GREEN}✅ Test 6 Complete${NC}"
echo ""

# Test 7: Get Leaderboard
echo -e "${BLUE}Test 7: Getting leaderboard...${NC}"
curl -s ${API_URL}/learn/leaderboard?limit=5 | jq '.leaderboard[] | {username, current_level, experience_points, total_challenges}'

echo ""
echo -e "${GREEN}✅ Test 7 Complete${NC}"
echo ""

# Test 8: Get All Categories
echo -e "${BLUE}Test 8: Getting available categories...${NC}"
curl -s ${API_URL}/learn/categories | jq '.categories'

echo ""
echo -e "${GREEN}✅ Test 8 Complete${NC}"
echo ""

# Test 9: Get All Badges
echo -e "${BLUE}Test 9: Getting badge definitions...${NC}"
curl -s ${API_URL}/learn/badges | jq '.badges[0:5] | .[] | {id, name, teaches}'

echo ""
echo -e "${GREEN}✅ Test 9 Complete${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 All Tests Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/learn in your browser"
echo "2. Enter a username to start learning"
echo "3. Browse and select challenges"
echo "4. Submit predictions and track your progress"
echo ""
echo "Manual resolution for testing:"
echo -e "${YELLOW}curl -X POST ${API_URL}/learn/resolution/manual \\${NC}"
echo -e "${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${YELLOW}  -d '{\"marketSlug\": \"MARKET_SLUG\", \"outcome\": \"yes\"}'${NC}"
echo ""
echo "Check backend logs for automated resolution polling (every 15 min)"
echo "======================================"
