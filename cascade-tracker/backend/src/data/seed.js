import { initializeDatabase, getDb } from '../utils/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { seedChallenges } from '../scripts/seedLearningChallenges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Initialize database
  initializeDatabase();
  const db = getDb();

  // Load seed data
  const cascadesData = JSON.parse(
    readFileSync(join(__dirname, 'seedCascades.json'), 'utf-8')
  );

  console.log('🌱 Seeding database...');

  // Seed cascades
  const cascadeStmt = db.prepare(`
    INSERT OR REPLACE INTO cascades
    (id, name, description, category, event_data, severity, status, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cascade of cascadesData) {
    cascadeStmt.run(
      cascade.id,
      cascade.name,
      cascade.description,
      cascade.category,
      JSON.stringify(cascade.event_data),
      cascade.severity,
      cascade.status,
      cascade.created_at,
      cascade.resolved_at || null
    );
    console.log(`✅ Seeded cascade: ${cascade.name}`);
  }

  // Seed sample users
  const userStmt = db.prepare(`
    INSERT OR REPLACE INTO users
    (id, username, avatar, score, predictions_total, predictions_correct, current_streak, max_streak, level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleUsers = [
    { id: 'user_1', username: 'MarketMaster', score: 450, total: 15, correct: 12, streak: 5 },
    { id: 'user_2', username: 'CascadeKing', score: 380, total: 12, correct: 10, streak: 3 },
    { id: 'user_3', username: 'PredictorPro', score: 320, total: 10, correct: 7, streak: 2 }
  ];

  for (const user of sampleUsers) {
    userStmt.run(
      user.id,
      user.username,
      null,
      user.score,
      user.total,
      user.correct,
      user.streak,
      user.streak,
      'INTERMEDIATE',
      Date.now(),
      Date.now()
    );
    console.log(`✅ Seeded user: ${user.username}`);
  }

  // Seed learning challenges
  await seedChallenges();

  console.log('\n🎉 Database seeded successfully!');
  console.log('You can now start the server with: npm run dev');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
