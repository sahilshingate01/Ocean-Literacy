/**
 * Integration Tests: Health Checks and Operational Probes
 */

const assert = require('assert');
const app = require('../../src/app');

async function runHealthIntegrationTests(port = 3014) {
  console.log('\n--- Operational Health & Diagnostic Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1/health`;

  try {
    // 1. Liveness check
    const liveRes = await fetch(`${baseUrl}/liveness`);
    assert.strictEqual(liveRes.status, 200, 'Liveness probe must return 200');
    const liveData = await liveRes.json();
    assert.strictEqual(liveData.status, 'UP');
    assert(liveData.timestamp, 'Timestamp must be present');

    // 2. Readiness check
    const readyRes = await fetch(`${baseUrl}/readiness`);
    assert.strictEqual(readyRes.status, 200, 'Readiness probe must return 200');
    const readyData = await readyRes.json();
    assert.strictEqual(readyData.status, 'READY');
    assert.strictEqual(readyData.database, 'CONNECTED');

    // 3. Sanitized Diagnostic status
    const diagRes = await fetch(`${baseUrl}/diagnostic`);
    assert.strictEqual(diagRes.status, 200, 'Diagnostic probe must return 200');
    const diagData = await diagRes.json();
    assert.strictEqual(diagData.status, 'HEALTHY');
    assert.strictEqual(diagData.database, 'CONNECTED');
    assert(diagData.uptimeSeconds >= 0);
    assert(diagData.memoryUsage !== undefined);
    assert.strictEqual(diagData.password, undefined, 'Must not leak credentials');
    assert.strictEqual(diagData.jwtSecret, undefined, 'Must not leak secrets');

    console.log('✓ All 3 Operational Health Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runHealthIntegrationTests;

if (require.main === module) {
  runHealthIntegrationTests().catch(err => {
    console.error('Health integration tests failed:', err);
    process.exit(1);
  });
}
