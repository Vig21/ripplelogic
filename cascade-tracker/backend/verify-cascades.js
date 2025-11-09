import Database from 'better-sqlite3';
import axios from 'axios';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const db = new Database('./cascade.db');

/**
 * Verify all cascades against Polymarket API
 */
async function verifyCascades() {
  console.log('🔍 Starting cascade verification against Polymarket API...\n');

  // Get all cascades from database
  const cascades = db.prepare('SELECT * FROM cascades').all();
  console.log(`Found ${cascades.length} cascades in database\n`);

  const results = {
    totalMarkets: 0,
    existingMarkets: 0,
    nonExistentMarkets: 0,
    questionMatches: 0,
    questionMismatches: 0,
    urlMatches: 0,
    urlMismatches: 0,
    details: []
  };

  for (const cascade of cascades) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Cascade: "${cascade.name}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const eventData = JSON.parse(cascade.event_data);
    const allEffects = [
      ...(eventData.primary_effects || []),
      ...(eventData.secondary_effects || []),
      ...(eventData.tertiary_effects || [])
    ];

    for (const effect of allEffects) {
      results.totalMarkets++;

      const marketId = effect.market_id;
      const expectedQuestion = effect.market_name;
      const expectedUrl = effect.market_url;

      console.log(`\n🔍 Checking: ${marketId}`);
      console.log(`   Expected Question: "${expectedQuestion}"`);
      console.log(`   Expected URL: ${expectedUrl}`);

      try {
        // Call Polymarket API to verify EVENT exists (using events endpoint, not markets)
        const response = await axios.get(`${GAMMA_API_BASE}/events/${marketId}`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });

        const actualEvent = response.data;
        results.existingMarkets++;

        console.log(`   ✅ Event EXISTS on Polymarket`);
        console.log(`   Actual Title: "${actualEvent.title}"`);

        // Compare event title text
        if (expectedQuestion === actualEvent.title) {
          results.questionMatches++;
          console.log(`   ✅ Title MATCHES exactly`);
        } else {
          results.questionMismatches++;
          console.log(`   ❌ Title MISMATCH!`);
          console.log(`      Expected: "${expectedQuestion}"`);
          console.log(`      Actual:   "${actualEvent.title}"`);
        }

        // Compare URL
        const actualUrl = `https://polymarket.com/event/${actualEvent.slug}`;
        if (expectedUrl === actualUrl) {
          results.urlMatches++;
          console.log(`   ✅ URL MATCHES`);
        } else {
          results.urlMismatches++;
          console.log(`   ❌ URL MISMATCH!`);
          console.log(`      Expected: ${expectedUrl}`);
          console.log(`      Actual:   ${actualUrl}`);
        }

        results.details.push({
          cascade: cascade.name,
          marketId,
          exists: true,
          questionMatch: expectedQuestion === actualEvent.title,
          urlMatch: expectedUrl === actualUrl,
          expectedQuestion,
          actualQuestion: actualEvent.title,
          expectedUrl,
          actualUrl
        });

      } catch (error) {
        results.nonExistentMarkets++;

        if (error.response?.status === 404) {
          console.log(`   ❌ Market DOES NOT EXIST (404)`);
        } else {
          console.log(`   ❌ Error checking market: ${error.message}`);
        }

        results.details.push({
          cascade: cascade.name,
          marketId,
          exists: false,
          error: error.response?.status === 404 ? '404 Not Found' : error.message,
          expectedQuestion,
          expectedUrl
        });
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Print summary
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════');
  console.log('                VERIFICATION SUMMARY            ');
  console.log('═══════════════════════════════════════════════');
  console.log(`\nTotal Markets Checked: ${results.totalMarkets}`);
  console.log(`\n📊 EXISTENCE:`);
  console.log(`   ✅ Existing Markets:     ${results.existingMarkets} (${(results.existingMarkets/results.totalMarkets*100).toFixed(1)}%)`);
  console.log(`   ❌ Non-Existent Markets: ${results.nonExistentMarkets} (${(results.nonExistentMarkets/results.totalMarkets*100).toFixed(1)}%)`);

  if (results.existingMarkets > 0) {
    console.log(`\n📝 QUESTION MATCHING (for existing markets):`);
    console.log(`   ✅ Exact Matches:   ${results.questionMatches} (${(results.questionMatches/results.existingMarkets*100).toFixed(1)}%)`);
    console.log(`   ❌ Mismatches:      ${results.questionMismatches} (${(results.questionMismatches/results.existingMarkets*100).toFixed(1)}%)`);

    console.log(`\n🔗 URL MATCHING (for existing markets):`);
    console.log(`   ✅ Correct URLs:    ${results.urlMatches} (${(results.urlMatches/results.existingMarkets*100).toFixed(1)}%)`);
    console.log(`   ❌ Incorrect URLs:  ${results.urlMismatches} (${(results.urlMismatches/results.existingMarkets*100).toFixed(1)}%)`);
  }

  // Print non-existent markets
  if (results.nonExistentMarkets > 0) {
    console.log('\n\n❌ NON-EXISTENT MARKETS:');
    console.log('═══════════════════════════════════════════════');
    results.details
      .filter(d => !d.exists)
      .forEach(detail => {
        console.log(`\nCascade: ${detail.cascade}`);
        console.log(`Market ID: ${detail.marketId}`);
        console.log(`Expected Question: "${detail.expectedQuestion}"`);
        console.log(`Expected URL: ${detail.expectedUrl}`);
        console.log(`Error: ${detail.error}`);
      });
  }

  // Print question mismatches
  if (results.questionMismatches > 0) {
    console.log('\n\n❌ QUESTION MISMATCHES:');
    console.log('═══════════════════════════════════════════════');
    results.details
      .filter(d => d.exists && !d.questionMatch)
      .forEach(detail => {
        console.log(`\nCascade: ${detail.cascade}`);
        console.log(`Market ID: ${detail.marketId}`);
        console.log(`Expected: "${detail.expectedQuestion}"`);
        console.log(`Actual:   "${detail.actualQuestion}"`);
      });
  }

  console.log('\n═══════════════════════════════════════════════\n');

  db.close();
  return results;
}

// Run verification
verifyCascades()
  .then(results => {
    if (results.nonExistentMarkets === 0 && results.questionMismatches === 0) {
      console.log('✅ All markets verified successfully!');
      process.exit(0);
    } else {
      console.log('❌ Verification found issues - see details above');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
