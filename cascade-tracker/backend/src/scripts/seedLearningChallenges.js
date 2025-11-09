import { initializeDatabase, getDb } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed Learning Challenges
 * Creates sample challenges for testing the Learn section
 */

const SAMPLE_CHALLENGES = [
  // Beginner Challenges
  {
    difficulty: 'beginner',
    category: 'Politics',
    market_question: 'Will Donald Trump win the 2024 Presidential Election?',
    description: 'Predict the outcome of the 2024 US Presidential Election',
    market_data: {
      volume: 250000000,
      liquidity: 5000000,
      current_odds: [52, 48],
      outcomes: ['Yes', 'No'],
      end_date: '2024-11-05T00:00:00Z',
      category: 'Politics'
    },
    educational_content: {
      market_context: 'This market predicts whether Donald Trump will win the 2024 US Presidential Election. Presidential elections are influenced by polling data, economic conditions, and major events leading up to election day.',
      key_factors: [
        'National and swing state polling averages',
        'Economic indicators like GDP growth and unemployment',
        'Major political events and debates',
        'Voter turnout and demographic shifts'
      ],
      historical_precedents: 'In 2020, prediction markets initially favored Trump but shifted toward Biden as polling data improved. Markets tend to be accurate within a few percentage points of actual election results.',
      analysis_framework: 'Look at aggregate polling data from reputable sources, economic trends, and betting market consensus. Compare current odds to historical election markets and polling accuracy.',
      learning_objectives: [
        'Understanding how political prediction markets work',
        'Interpreting polling data and market odds'
      ]
    }
  },
  {
    difficulty: 'beginner',
    category: 'Sports',
    market_question: 'Will the Los Angeles Lakers make the NBA Playoffs?',
    description: 'Predict if the Lakers qualify for the 2024-25 NBA Playoffs',
    market_data: {
      volume: 15000000,
      liquidity: 500000,
      current_odds: [68, 32],
      outcomes: ['Yes', 'No'],
      end_date: '2025-04-15T00:00:00Z',
      category: 'Sports'
    },
    educational_content: {
      market_context: 'This market predicts whether the Lakers will qualify for the NBA Playoffs. Playoff qualification depends on team performance, injuries, and competition in the Western Conference.',
      key_factors: [
        'Current team win-loss record and standing',
        'Player health and injury reports',
        'Remaining schedule difficulty',
        'Historical playoff qualification cutoffs'
      ],
      historical_precedents: 'Teams with a .500 or better record typically make the playoffs. The Lakers have a strong playoff history but missed in 2022 due to injuries.',
      analysis_framework: 'Check current standings, games remaining, and injury status of key players. Compare to historical playoff thresholds and assess remaining opponents.',
      learning_objectives: [
        'Evaluating sports team performance metrics',
        'Understanding seasonal trends and injury impact'
      ]
    }
  },
  {
    difficulty: 'beginner',
    category: 'Finance',
    market_question: 'Will Bitcoin be above $100,000 by end of 2024?',
    description: 'Predict if Bitcoin price exceeds $100K by December 31, 2024',
    market_data: {
      volume: 45000000,
      liquidity: 1200000,
      current_odds: [35, 65],
      outcomes: ['Yes', 'No'],
      end_date: '2024-12-31T23:59:59Z',
      category: 'Finance'
    },
    educational_content: {
      market_context: 'This market predicts whether Bitcoin will reach $100,000 by the end of 2024. Cryptocurrency prices are volatile and influenced by adoption, regulation, and macroeconomic conditions.',
      key_factors: [
        'Current Bitcoin price and recent price trends',
        'Institutional adoption and ETF developments',
        'Regulatory news and policy changes',
        'Macroeconomic conditions and interest rates'
      ],
      historical_precedents: 'Bitcoin reached an all-time high of ~$69,000 in 2021 but has been volatile. Previous bull runs have been triggered by halving events and institutional adoption.',
      analysis_framework: 'Analyze current price momentum, major catalysts like ETF approvals, and broader market conditions. Consider historical volatility and time remaining.',
      learning_objectives: [
        'Understanding cryptocurrency market dynamics',
        'Evaluating price predictions and volatility'
      ]
    }
  },

  // Intermediate Challenges
  {
    difficulty: 'intermediate',
    category: 'Tech',
    market_question: 'Will OpenAI release GPT-5 in 2024?',
    description: 'Predict if OpenAI launches GPT-5 before end of 2024',
    market_data: {
      volume: 8000000,
      liquidity: 300000,
      current_odds: [42, 58],
      outcomes: ['Yes', 'No'],
      end_date: '2024-12-31T23:59:59Z',
      category: 'Tech'
    },
    educational_content: {
      market_context: 'This market predicts whether OpenAI will release GPT-5 in 2024. AI model releases depend on training completion, safety testing, and strategic timing.',
      key_factors: [
        'Official OpenAI announcements and roadmap hints',
        'Computing resource availability and training timelines',
        'Competitive pressure from other AI labs',
        'Regulatory and safety considerations'
      ],
      historical_precedents: 'GPT-4 was released in March 2023, about 16 months after GPT-3.5. Major model releases typically require 12-24 months of development.',
      analysis_framework: 'Track OpenAI executive statements, compute availability, and competitive dynamics. Consider development timelines and safety testing requirements.',
      learning_objectives: [
        'Understanding AI development cycles',
        'Evaluating company announcements and timelines'
      ]
    }
  },
  {
    difficulty: 'intermediate',
    category: 'Politics',
    market_question: 'Will there be a recession in the US in 2024?',
    description: 'Predict if the US enters a recession (2 consecutive quarters of negative GDP growth)',
    market_data: {
      volume: 12000000,
      liquidity: 450000,
      current_odds: [28, 72],
      outcomes: ['Yes', 'No'],
      end_date: '2024-12-31T23:59:59Z',
      category: 'Finance'
    },
    educational_content: {
      market_context: 'This market predicts whether the US will enter a technical recession (two consecutive quarters of negative GDP growth) in 2024. Recessions are influenced by interest rates, employment, and consumer spending.',
      key_factors: [
        'Federal Reserve interest rate policy',
        'Employment data and jobless claims',
        'Consumer spending and confidence indicators',
        'Yield curve inversion and financial stress'
      ],
      historical_precedents: 'The 2008 recession followed a housing crisis, while the 2020 recession was triggered by COVID-19. Inverted yield curves have preceded many recessions.',
      analysis_framework: 'Monitor Fed policy decisions, unemployment trends, and leading economic indicators. Consider the lag between rate hikes and economic impact.',
      learning_objectives: [
        'Understanding macroeconomic indicators',
        'Interpreting Federal Reserve policy'
      ]
    }
  },

  // Advanced Challenge
  {
    difficulty: 'advanced',
    category: 'Politics',
    market_question: 'Will Xi Jinping visit the US in 2024?',
    description: 'Predict if Chinese President Xi Jinping makes an official visit to the United States',
    market_data: {
      volume: 3500000,
      liquidity: 150000,
      current_odds: [45, 55],
      outcomes: ['Yes', 'No'],
      end_date: '2024-12-31T23:59:59Z',
      category: 'Politics'
    },
    educational_content: {
      market_context: 'This market predicts whether Chinese President Xi Jinping will visit the United States in 2024. High-level diplomatic visits depend on bilateral relations, political timing, and strategic interests.',
      key_factors: [
        'US-China diplomatic relations and trade tensions',
        'Upcoming summits and international meetings',
        'Domestic political considerations in both countries',
        'Taiwan situation and regional security dynamics'
      ],
      historical_precedents: 'Xi last visited the US in 2017. High-level visits often occur around major summits like APEC or G20, and require extensive diplomatic preparation.',
      analysis_framework: 'Track bilateral diplomatic signals, upcoming international events, and statements from both governments. Consider domestic political constraints and timing.',
      learning_objectives: [
        'Understanding international diplomacy',
        'Analyzing geopolitical relationships and signals'
      ]
    }
  }
];

async function seedChallenges() {
  console.log('🌱 Seeding learning challenges...\n');

  const db = getDb();
  let created = 0;

  for (const challenge of SAMPLE_CHALLENGES) {
    try {
      const challengeId = uuidv4();
      const marketSlug = challenge.market_question.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const stmt = db.prepare(`
        INSERT INTO learning_challenges (
          id, title, description, category, difficulty_level, min_user_level,
          market_id, market_slug, market_question, market_data, educational_content, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const minLevel = challenge.difficulty === 'beginner' ? 1 :
                      challenge.difficulty === 'intermediate' ? 3 :
                      challenge.difficulty === 'advanced' ? 6 : 9;

      stmt.run(
        challengeId,
        challenge.market_question,
        challenge.description,
        challenge.category,
        challenge.difficulty,
        minLevel,
        marketSlug,
        marketSlug,
        challenge.market_question,
        JSON.stringify(challenge.market_data),
        JSON.stringify(challenge.educational_content),
        'active'
      );

      // Add to resolution queue
      db.prepare(`
        INSERT OR IGNORE INTO market_resolution_queue (market_id, market_slug, status)
        VALUES (?, ?, 'pending')
      `).run(marketSlug, marketSlug);

      console.log(`✅ Created ${challenge.difficulty} challenge: ${challenge.market_question}`);
      created++;

    } catch (error) {
      console.error(`❌ Error creating challenge: ${challenge.market_question}`, error.message);
    }
  }

  console.log(`\n🎉 Successfully created ${created}/${SAMPLE_CHALLENGES.length} challenges!`);
  console.log('\nBreakdown:');
  console.log(`  - Beginner: 3 challenges`);
  console.log(`  - Intermediate: 2 challenges`);
  console.log(`  - Advanced: 1 challenge`);
  console.log('\nVisit http://localhost:3000/learn to see them!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // Initialize database first
    initializeDatabase();
    await seedChallenges();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding challenges:', error);
    process.exit(1);
  }
}

export { seedChallenges };
