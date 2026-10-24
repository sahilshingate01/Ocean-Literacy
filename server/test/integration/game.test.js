/**
 * Integration Tests: Server-Authoritative Gameplay Engine, Anti-Cheat, and Idempotency
 */

const assert = require('assert');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

async function runGameIntegrationTests(port = 3011) {
  console.log('\n--- Server-Authoritative Gameplay & Anti-Cheat Integration Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // 1. Create a fresh test user
    const email = `player_${Date.now()}@oceanliteracy.org`;
    const password = 'PlayerPassword2026!';

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, callsign: 'Ocean Challenger' })
    });
    const regData = await regRes.json();
    const token = regData.data.accessToken;

    // 2. Fetch published missions
    const missionsRes = await fetch(`${baseUrl}/game/missions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const missionsData = await missionsRes.json();
    assert.strictEqual(missionsRes.status, 200);
    assert(Array.isArray(missionsData.data.missions), 'Missions must be an array');
    assert(missionsData.data.missions.length >= 15, 'Must have at least 15 scenarios');

    // Anti-Cheat Check: Ensure client cannot see answer types or score deltas in mission options!
    const sample = missionsData.data.missions.find(m => m.id === 'scen-fisher-01');
    assert(sample, 'scen-fisher-01 must be present in published missions');
    assert.strictEqual(sample.options[0].type, undefined, 'Option type must not be leaked before decision');
    assert.strictEqual(sample.options[0].score, undefined, 'Option score must not be leaked before decision');

    // 3. Start authoritative attempt
    const idempotencyKey = `test_key_${Date.now()}`;
    const startRes = await fetch(`${baseUrl}/game/attempts/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ scenarioId: sample.id })
    });
    const startData = await startRes.json();
    assert.strictEqual(startRes.status, 201);
    const attemptId = startData.data.attemptId;
    assert(attemptId, 'Attempt ID must be returned');
    assert.strictEqual(startData.data.status, 'IN_PROGRESS');
    assert.strictEqual(startData.data.isPractice, false, 'First attempt must not be practice');

    // 4. Idempotency test: repeating start request with same idempotency key returns same attempt
    const repeatStartRes = await fetch(`${baseUrl}/game/attempts/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ scenarioId: sample.id })
    });
    const repeatStartData = await repeatStartRes.json();
    assert.strictEqual(repeatStartData.data.attemptId, attemptId, 'Idempotent request must return identical attempt ID');

    // 5. Submit valid decision (Correct option opt-f1-b)
    // Anti-Cheat Check: Client payload attempts to tamper with score by sending fake points/XP
    const decRes = await fetch(`${baseUrl}/game/attempts/${attemptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        optionId: 'opt-f1-b',
        // Injected fake client fields that server MUST completely ignore
        score: 999999,
        earnedXp: 999999,
        isCorrect: true
      })
    });
    const decData = await decRes.json();
    assert.strictEqual(decRes.status, 200);
    assert.strictEqual(decData.data.evaluation.isCorrect, true);
    assert.strictEqual(decData.data.evaluation.pointsDelta, 100, 'Server must enforce genuine +100 score, ignoring injected 999999');
    assert.strictEqual(decData.data.evaluation.earnedXp, 100, 'Server must enforce genuine +100 XP, ignoring injected 999999');
    assert.strictEqual(decData.data.profile.totalScore, 100);
    assert.strictEqual(decData.data.profile.totalXp, 200, 'Total XP includes 100 mission XP + 100 first_tide achievement bonus');

    // 6. Duplicate Submission Protection: Attempt cannot accept another decision
    const dupDecRes = await fetch(`${baseUrl}/game/attempts/${attemptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ optionId: 'opt-f1-b' })
    });
    assert.strictEqual(dupDecRes.status, 400, 'Duplicate submission on finalized attempt must be rejected');

    // 7. Replay Protection: Replaying the scenario flags attempt as practice with 0 duplicate XP
    const replayStartRes = await fetch(`${baseUrl}/game/attempts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ scenarioId: sample.id })
    });
    const replayStartData = await replayStartRes.json();
    const replayAttemptId = replayStartData.data.attemptId;
    assert.strictEqual(replayStartData.data.isPractice, true, 'Replay attempt must be marked isPractice=true');

    const replayDecRes = await fetch(`${baseUrl}/game/attempts/${replayAttemptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ optionId: 'opt-f1-b' })
    });
    const replayDecData = await replayDecRes.json();
    assert.strictEqual(replayDecRes.status, 200);
    assert.strictEqual(replayDecData.data.isReplay, true);
    assert.strictEqual(replayDecData.data.evaluation.earnedXp, 0, 'Replay must award 0 duplicate XP');
    assert.strictEqual(replayDecData.data.profile.totalXp, 200, 'Total XP must remain unchanged on replay (200)');

    // 8. Resume Attempt test
    const resumeRes = await fetch(`${baseUrl}/game/attempts/${replayAttemptId}/resume`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const resumeData = await resumeRes.json();
    assert.strictEqual(resumeRes.status, 200);
    assert.strictEqual(resumeData.data.attemptId, replayAttemptId);

    // 9. Score Floor: Penalty cannot drop profile score below 0
    const scen2Start = await fetch(`${baseUrl}/game/attempts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ scenarioId: 'scen-captain-01' })
    }).then(r => r.json());

    // Submit unsafe option in scenario 2
    const unsafeDecRes = await fetch(`${baseUrl}/game/attempts/${scen2Start.data.attemptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ optionId: 'opt-c1-b' }) // unsafe choice in scen-captain-01
    });
    const unsafeData = await unsafeDecRes.json();
    assert.strictEqual(unsafeDecRes.status, 200);
    assert.strictEqual(unsafeData.data.evaluation.isCorrect, false);
    assert.strictEqual(unsafeData.data.evaluation.isHazardous, true);
    assert(unsafeData.data.profile.totalScore >= 0, 'Total score must never drop below 0');

    // 10. Attempt Expiration: Expired attempt cannot be submitted
    // Simulate expired attempt by directly altering expiresAt in db
    const versionRecord = await prisma.scenarioVersion.findFirst({
      where: { scenarioId: 'scen-fisher-01', versionNumber: 1 }
    });

    const expiredAttempt = await prisma.missionAttempt.create({
      data: {
        userId: regData.data.user.id,
        scenarioId: 'scen-fisher-01',
        scenarioVersionId: versionRecord.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() - 1000) // already expired
      }
    });

    const expDecRes = await fetch(`${baseUrl}/game/attempts/${expiredAttempt.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ optionId: 'opt-f1-b' })
    });
    assert.strictEqual(expDecRes.status, 400, 'Expired attempt decision must return 400');

    console.log('✓ All 10 Game Integrity & Anti-Cheat Integration Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runGameIntegrationTests;

if (require.main === module) {
  runGameIntegrationTests().catch(err => {
    console.error('Game integration tests failed:', err);
    process.exit(1);
  });
}
