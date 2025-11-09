import { initializeDatabase, getDb } from '../utils/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const challengesData = JSON.parse(
  readFileSync(join(__dirname, '../data/seedLearningChallenges.json'), 'utf-8')
);

const DIFFICULTY_MIN_LEVEL = {
  beginner: 1,
  intermediate: 3,
  advanced: 6,
  expert: 9
};

function resolveMinLevel(difficulty, fallback) {
  return DIFFICULTY_MIN_LEVEL[difficulty] ?? fallback ?? 1;
}

function buildResolutionData(challenge) {
  return JSON.stringify({
    outcome: challenge.resolution_outcome,
    reference: challenge.market_data?.reference_url || null
  });
}

async function seedChallenges(options = {}) {
  const { silent = false } = options;
  const db = getDb();

  if (!silent) {
    console.log('🌱 Seeding learning challenges...\n');
  }

  db.exec(`
    DELETE FROM learning_predictions;
    DELETE FROM learning_challenges;
    DELETE FROM market_resolution_queue;
  `);

  const insertChallengeStmt = db.prepare(`
    INSERT INTO learning_challenges (
      id, title, description, category, difficulty_level, min_user_level,
      market_id, market_slug, market_question, market_data, educational_content,
      status, resolution_outcome, created_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertResolutionStmt = db.prepare(`
    INSERT INTO market_resolution_queue (
      market_id, market_slug, status, resolution_data, resolved_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

  let createdCount = 0;

  for (const challenge of challengesData) {
    try {
      const minLevel = resolveMinLevel(challenge.difficulty_level, challenge.min_user_level);
      const marketDataJson = JSON.stringify(challenge.market_data || {});
      const educationJson = JSON.stringify(challenge.educational_content || {});
      const createdAt = challenge.created_at ?? Math.floor(Date.now() / 1000);
      const resolvedAt = challenge.resolved_at ?? createdAt;
      const status = challenge.status ?? 'resolved';

      insertChallengeStmt.run(
        challenge.id,
        challenge.title,
        challenge.description,
        challenge.category,
        challenge.difficulty_level,
        challenge.min_user_level ?? minLevel,
        challenge.market_id,
        challenge.market_slug,
        challenge.market_question,
        marketDataJson,
        educationJson,
        status,
        challenge.resolution_outcome,
        createdAt,
        resolvedAt
      );

      insertResolutionStmt.run(
        challenge.market_id,
        challenge.market_slug,
        status,
        buildResolutionData(challenge),
        resolvedAt
      );

      createdCount += 1;
      if (!silent) {
        console.log(`✅ Seeded ${challenge.difficulty_level} challenge: ${challenge.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed challenge ${challenge.title}:`, error.message);
    }
  }

  if (!silent) {
    console.log(`\n🎉 Seeded ${createdCount}/${challengesData.length} learning challenges.`);
    console.log('Visit http://localhost:3000/learn to explore the curriculum!');
  }

  return { created: createdCount };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    initializeDatabase();
    await seedChallenges();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding challenges:', error);
    process.exit(1);
  }
}

export { seedChallenges };
