/**
 * Integration Tests: Global Leaderboards, Timezone Boundaries, and Deterministic Tie-Breaking
 */

const assert = require('assert');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

async function runLeaderboardIntegrationTests(port = 3012) {
  console.log('\n--- Global Leaderboard Integration Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // 1. Fetch public Daily, Weekly, Overall leaderboards
    const dailyRes = await fetch(`${baseUrl}/leaderboards/daily`);
    assert.strictEqual(dailyRes.status, 200);
    const dailyData = await dailyRes.json();
    assert.strictEqual(dailyData.success, true);
    assert(dailyData.data.leaderboard !== undefined, 'leaderboard array should exist');
    assert(dailyData.data.methodology !== undefined, 'methodology explanation must be present');
    assert.strictEqual(dailyData.data.methodology.timezone, 'Asia/Kolkata');

    const weeklyRes = await fetch(`${baseUrl}/leaderboards/weekly`);
    assert.strictEqual(weeklyRes.status, 200);
    const weeklyData = await weeklyRes.json();
    assert.strictEqual(weeklyData.success, true);

    const overallRes = await fetch(`${baseUrl}/leaderboards/overall`);
    assert.strictEqual(overallRes.status, 200);
    const overallData = await overallRes.json();
    assert.strictEqual(overallData.success, true);

    // 2. Create two test users to verify scoring, ranking, and deterministic tie-breaking
    const userAEmail = `lb_a_${Date.now()}@oceanliteracy.org`;
    const userBEmail = `lb_b_${Date.now()}@oceanliteracy.org`;
    const password = 'LeaderboardPass123!';

    const regARes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password, callsign: 'Navigator Alpha' })
    });
    const regAData = await regARes.json();
    const tokenA = regAData.data.accessToken;
    const userAId = regAData.data.user.id;

    const regBRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password, callsign: 'Navigator Beta' })
    });
    const regBData = await regBRes.json();
    const tokenB = regBData.data.accessToken;
    const userBId = regBData.data.user.id;

    // Insert controlled score transactions directly into PostgreSQL for testing tie-break
    const now = new Date();
    await prisma.scoreTransaction.create({
      data: {
        userId: userAId,
        pointsDelta: 100,
        xpDelta: 150,
        reason: 'scenario_completed',
        createdAt: new Date(now.getTime() - 2000) // earlier
      }
    });

    await prisma.scoreTransaction.create({
      data: {
        userId: userBId,
        pointsDelta: 100,
        xpDelta: 150,
        reason: 'scenario_completed',
        createdAt: now // later
      }
    });

    // Also update their user profiles for overall score
    await prisma.userProfile.update({
      where: { userId: userAId },
      data: { totalScore: 100, totalXp: 150 }
    });
    await prisma.userProfile.update({
      where: { userId: userBId },
      data: { totalScore: 100, totalXp: 150 }
    });

    // 3. Test Daily leaderboard ranking and deterministic tie-break
    // Both have 100 points and 150 XP, User A submitted earlier -> User A should be rank 1, User B rank 2 (or higher rank)
    const dailyRankRes = await fetch(`${baseUrl}/leaderboards/daily?limit=50`);
    const dailyRankData = await dailyRankRes.json();
    const rankA = dailyRankData.data.leaderboard.find(r => r.userId === userAId);
    const rankB = dailyRankData.data.leaderboard.find(r => r.userId === userBId);

    assert(rankA, 'User A must appear in daily rankings');
    assert(rankB, 'User B must appear in daily rankings');
    assert(rankA.rank < rankB.rank, `User A (earlier submission) rank ${rankA.rank} must beat User B rank ${rankB.rank}`);

    // 4. Test Opt-out privacy policy: User A opts out of leaderboards
    await fetch(`${baseUrl}/auth/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ leaderboardOptIn: false })
    });

    const optOutDailyRes = await fetch(`${baseUrl}/leaderboards/daily?limit=50`);
    const optOutDailyData = await optOutDailyRes.json();
    const rankAAfterOptOut = optOutDailyData.data.leaderboard.find(r => r.userId === userAId);
    assert.strictEqual(rankAAfterOptOut, undefined, 'Opted-out user must not appear in global leaderboards');

    // 5. Re-enable opt-in and test /me standing
    await fetch(`${baseUrl}/auth/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ leaderboardOptIn: true })
    });

    const myStandingRes = await fetch(`${baseUrl}/leaderboards/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(myStandingRes.status, 200);
    const myStandingData = await myStandingRes.json();
    assert.strictEqual(myStandingData.success, true);
    assert(myStandingData.data.overall !== undefined);
    assert(myStandingData.data.daily !== undefined);
    assert(myStandingData.data.weekly !== undefined);

    // 6. Test practice attempt exclusion: add a practice score transaction, ensure it does not increase daily score
    await prisma.scoreTransaction.create({
      data: {
        userId: userBId,
        pointsDelta: 500,
        xpDelta: 500,
        reason: 'replay_practice_attempt',
        createdAt: new Date()
      }
    });

    const practiceCheckRes = await fetch(`${baseUrl}/leaderboards/daily?limit=50`);
    const practiceCheckData = await practiceCheckRes.json();
    const updatedUserB = practiceCheckData.data.leaderboard.find(r => r.userId === userBId);
    assert.strictEqual(updatedUserB.score, 100, 'Practice attempt must NOT inflate competitive score');

    console.log('✓ All 6 Global Leaderboard Integration Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runLeaderboardIntegrationTests;

if (require.main === module) {
  runLeaderboardIntegrationTests().catch(err => {
    console.error('Leaderboard integration tests failed:', err);
    process.exit(1);
  });
}
