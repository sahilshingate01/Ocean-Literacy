/**
 * Integration Tests: Admin CMS, RBAC, Scenario Versioning, and Moderation
 */

const assert = require('assert');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

async function runAdminIntegrationTests(port = 3015) {
  console.log('\n--- Admin CMS, RBAC, and Content Governance Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // 1. Setup a regular LEARNER user
    const learnerEmail = `learner_cms_${Date.now()}@oceanliteracy.org`;
    const password = 'LearnerPassword123!';
    const regLearnerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: learnerEmail, password, callsign: 'Learner Only' })
    });
    const learnerData = await regLearnerRes.json();
    const learnerToken = learnerData.data.accessToken;

    // 2. Setup an ADMIN user directly in DB
    const adminEmail = `admin_cms_${Date.now()}@oceanliteracy.org`;
    const regAdminRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password, callsign: 'Chief Admin' })
    });
    const adminData = await regAdminRes.json();
    const adminUserId = adminData.data.user.id;

    // Elevate to ADMIN in database
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' }
    });

    // Re-login to get updated JWT with ADMIN role
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.accessToken;

    // 3. RBAC Check: Learner is rejected with 403 Forbidden
    const learnerDeniedRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${learnerToken}` }
    });
    assert.strictEqual(learnerDeniedRes.status, 403, 'Learners must be denied access to admin routes (403)');

    // 4. Admin Access: Admin retrieves dashboard statistics
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.strictEqual(statsData.success, true);
    assert(statsData.data.metrics !== undefined);
    assert(statsData.data.metrics.totalScenarios >= 15);
    assert(statsData.data.metrics.totalUsers >= 2);

    // 5. Scenario Completeness Validation: Reject incomplete draft
    const badScenarioRes = await fetch(`${baseUrl}/admin/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        id: `scen-bad-${Date.now()}`,
        title: 'Too short', // fails min 5 chars or missing options
        options: []
      })
    });
    assert.strictEqual(badScenarioRes.status, 400, 'Incomplete scenario must fail validation');

    // 6. Create valid scenario draft
    const testScenarioId = `scen-test-${Date.now()}`;
    const validDraftPayload = {
      id: testScenarioId,
      roleId: 'fisher',
      title: 'Sustainable Purse Seine Netting Protocol',
      region: 'Arabian Sea Offshore',
      topic: 'Bycatch Reduction',
      difficulty: 'Intermediate',
      objective: 'Eliminate juvenile fish catch and protect sea turtles in fishing nets.',
      situationBriefing: 'Sonar indicates a large school of adult sardines intermixed with dolphins.',
      simulationNotice: 'SIMULATION — Educational oceanographic scenario model.',
      options: [
        {
          id: 'opt_escape_grid',
          text: 'Deploy turtle excluder device and square mesh grid before hauling',
          type: 'correct',
          score: 100,
          xp: 150,
          feedback: 'Outstanding stewardship. Non-target marine life escapes uninjured while commercial harvest is preserved.',
          scienceTakeaway: 'Square mesh windows maintain open gaps during water drag, allowing smaller juveniles and turtles to safely swim free.'
        },
        {
          id: 'opt_rapid_haul',
          text: 'Haul the entire catch rapidly to maximize harvest speed',
          type: 'incorrect',
          score: -30,
          xp: 25,
          feedback: 'High bycatch mortality and net damage caused by entangled protected megafauna.',
          scienceTakeaway: 'Unsorted rapid purse seine recovery causes severe marine wildlife asphyxiation and ecosystem disruption.'
        }
      ]
    };

    const createDraftRes = await fetch(`${baseUrl}/admin/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(validDraftPayload)
    });
    assert.strictEqual(createDraftRes.status, 201);
    const createDraftData = await createDraftRes.json();
    assert.strictEqual(createDraftData.success, true);
    assert.strictEqual(createDraftData.data.scenario.status, 'DRAFT');

    // 7. Publish Scenario
    const publishRes = await fetch(`${baseUrl}/admin/missions/${testScenarioId}/publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(publishRes.status, 200);
    const publishData = await publishRes.json();
    assert.strictEqual(publishData.data.scenario.status, 'PUBLISHED');

    // 8. Immutable version branching test:
    // Create a simulated attempt on version 1 of this scenario
    const v1 = await prisma.scenarioVersion.findFirst({
      where: { scenarioId: testScenarioId, versionNumber: 1 }
    });

    await prisma.missionAttempt.create({
      data: {
        userId: adminUserId,
        scenarioId: testScenarioId,
        scenarioVersionId: v1.id,
        status: 'FINALIZED',
        finalScore: 100,
        finalXp: 150,
        isPractice: false,
        expiresAt: new Date(Date.now() + 3600000)
      }
    });

    // Now update the scenario: Because attempts exist on version 1, it MUST create version 2!
    const updateRes = await fetch(`${baseUrl}/admin/missions/${testScenarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        ...validDraftPayload,
        title: 'Sustainable Purse Seine Netting Protocol (Revised v2)'
      })
    });
    assert.strictEqual(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.data.isNewVersion, true, 'Should detect attempts and branch new version');
    assert.strictEqual(updateData.data.version.versionNumber, 2, 'Must branch to version 2 to protect historical immutability');

    // 9. User Account Management: Deactivate and reactivate learner
    const targetUserId = learnerData.data.user.id;
    const deactRes = await fetch(`${baseUrl}/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false })
    });
    assert.strictEqual(deactRes.status, 200);

    // Verify deactivated user cannot log in
    const deactLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: learnerEmail, password })
    });
    assert.strictEqual(deactLoginRes.status, 403, 'Suspended user cannot log in (403)');

    // Reactivate user
    const reactRes = await fetch(`${baseUrl}/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: true })
    });
    assert.strictEqual(reactRes.status, 200);

    // 10. Audit Logs
    const auditRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(auditRes.status, 200);
    const auditData = await auditRes.json();
    assert(Array.isArray(auditData.data.logs));
    assert(auditData.data.logs.length > 0, 'Audit log entries must be recorded');

    console.log('✓ All 10 Admin CMS & Governance Integration Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runAdminIntegrationTests;

if (require.main === module) {
  runAdminIntegrationTests().catch(err => {
    console.error('Admin integration tests failed:', err);
    process.exit(1);
  });
}
