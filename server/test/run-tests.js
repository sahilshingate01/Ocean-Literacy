/**
 * Master Test Runner for Ocean Literacy Phase 2 Backend
 *
 * Runs all unit and integration test suites sequentially:
 * 1. Cryptography, Hashing, Token rotation unit tests
 * 2. Timezone and leaderboard date boundary unit tests
 * 3. Authentication, RBAC, and DPDP compliance integration tests
 * 4. Server-authoritative gameplay, scoring, and anti-cheat integration tests
 * 5. Global leaderboards, Asia/Kolkata boundaries, and tie-breaking integration tests
 * 6. INCOIS integrations, provenance, caching, and simulation notices integration tests
 * 7. Admin CMS, version branching, user governance, and audit logging integration tests
 * 8. Operational health, liveness, readiness, and diagnostic probes
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for test execution
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runCryptoUnitTests = require('./unit/crypto.test');
const runDateUtilsUnitTests = require('./unit/dateUtils.test');
const runAuthIntegrationTests = require('./integration/auth.test');
const runGameIntegrationTests = require('./integration/game.test');
const runLeaderboardIntegrationTests = require('./integration/leaderboard.test');
const runIncoisIntegrationTests = require('./integration/incois.test');
const runAdminIntegrationTests = require('./integration/admin.test');
const runHealthIntegrationTests = require('./integration/health.test');

const prisma = require('../src/config/prisma');

async function main() {
  console.log('================================================================');
  console.log('  OCEAN LITERACY PLATFORM — PHASE 2 AUTOMATED TEST SUITE        ');
  console.log('================================================================');
  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;

  const suites = [
    { name: 'Unit: Cryptography & Hash Utilities', fn: () => runCryptoUnitTests() },
    { name: 'Unit: Timezone & Period Date Boundaries', fn: () => runDateUtilsUnitTests() },
    { name: 'Integration: Authentication & DPDP Compliance', fn: () => runAuthIntegrationTests(3021) },
    { name: 'Integration: Server-Authoritative Gameplay & Anti-Cheat', fn: () => runGameIntegrationTests(3022) },
    { name: 'Integration: Global Leaderboards & Deterministic Tie-Breaking', fn: () => runLeaderboardIntegrationTests(3023) },
    { name: 'Integration: INCOIS Provenance, Caching & Fallback Alerts', fn: () => runIncoisIntegrationTests(3024) },
    { name: 'Integration: Admin CMS, Versioning & Audit Governance', fn: () => runAdminIntegrationTests(3025) },
    { name: 'Integration: Operational Health Probes & Diagnostics', fn: () => runHealthIntegrationTests(3026) }
  ];

  for (const suite of suites) {
    try {
      await suite.fn();
      passedCount++;
    } catch (err) {
      console.error(`\n❌ FAILED: ${suite.name}`);
      console.error(err);
      failedCount++;
    }
  }

  // Close Prisma database pool
  await prisma.$disconnect();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedCount} suites passed, ${failedCount} suites failed (${durationSec}s)`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
