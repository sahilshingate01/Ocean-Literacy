/**
 * Integration Tests: INCOIS Information Integration, Provenance, Caching, and Simulation Safety
 */

const assert = require('assert');
const app = require('../../src/app');

async function runIncoisIntegrationTests(port = 3013) {
  console.log('\n--- INCOIS Integration & Provenance Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1/integrations/incois`;

  try {
    // 1. Service Status Overview
    const statusRes = await fetch(`${baseUrl}/status`);
    assert.strictEqual(statusRes.status, 200, 'Status overview should return 200');
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.success, true);
    assert(statusData.data.services.length >= 4, 'Must list at least 4 registered INCOIS services');
    assert(statusData.data.upstreamAttribution.institution.includes('INCOIS'), 'Official attribution must cite INCOIS');

    // 2. PFZ Advisories
    const pfzRes = await fetch(`${baseUrl}/pfz?region=Goa`);
    assert.strictEqual(pfzRes.status, 200, 'PFZ advisory should return 200');
    const pfzData = await pfzRes.json();
    assert.strictEqual(pfzData.success, true);
    assert(pfzData.data.provenance, 'Provenance metadata must be present');
    assert.strictEqual(pfzData.data.isSimulated, true, 'Default fixture must be flagged as simulation');
    assert(pfzData.data.simulationNotice.includes('SIMULATION'), 'Must contain visible simulation notice');
    assert(Array.isArray(pfzData.data.data.chlorophyllFronts), 'Must contain chlorophyll fronts data');

    // 3. Cache test: repeat PFZ request should be served from PostgreSQL cache
    const pfzCacheRes = await fetch(`${baseUrl}/pfz?region=Goa`);
    const pfzCacheData = await pfzCacheRes.json();
    assert.strictEqual(pfzCacheData.status || 200, 200);
    assert.strictEqual(pfzCacheData.data.freshnessStatus, 'cached', 'Repeat request should be served as cached');

    // 4. Ocean State Forecast (OSF)
    const osfRes = await fetch(`${baseUrl}/osf?sector=West+Coast`);
    assert.strictEqual(osfRes.status, 200);
    const osfData = await osfRes.json();
    assert.strictEqual(osfData.success, true);
    assert(osfData.data.data.forecastParameters.significantWaveHeightMeters, 'OSF must include significant wave height');
    assert(osfData.data.data.forecastParameters.surfaceCurrentSpeedKnots, 'OSF must include surface current parameters');

    // 5. Tsunami Early Warning System (ITEWS)
    const tsunamiRes = await fetch(`${baseUrl}/tsunami`);
    assert.strictEqual(tsunamiRes.status, 200);
    const tsunamiData = await tsunamiRes.json();
    assert.strictEqual(tsunamiData.success, true);
    assert(tsunamiData.data.data.threatLevel.includes('NO THREAT'), 'Standard threat level is NO THREAT');
    assert(tsunamiData.data.data.bulletinNumber, 'Must include bulletin number');

    // 6. Marine Heatwave & Bleaching Indicators
    const heatRes = await fetch(`${baseUrl}/marine-heatwave?reefArea=Gulf+of+Mannar`);
    assert.strictEqual(heatRes.status, 200);
    const heatData = await heatRes.json();
    assert.strictEqual(heatData.success, true);
    assert(heatData.data.data.bleachingAlertLevel, 'Must report bleaching alert level');
    assert(heatData.data.data.thermalAnomalyCelsius !== undefined, 'Must report thermal anomaly');

    console.log('✓ All 6 INCOIS Integration Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runIncoisIntegrationTests;

if (require.main === module) {
  runIncoisIntegrationTests().catch(err => {
    console.error('INCOIS integration tests failed:', err);
    process.exit(1);
  });
}
