/**
 * Integration Tests: Authentication, Token Lifecycle, and DPDP Compliance
 */

const assert = require('assert');
const app = require('../../src/app');

async function runAuthIntegrationTests(port = 3010) {
  console.log('\n--- Authentication & Security Integration Tests ---');
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    const uniqueEmail = `cadet_${Date.now()}@oceanliteracy.org`;
    const password = 'TestCadetPassword123!';

    // 1. Registration
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password,
        callsign: 'Cadet Navigator'
      })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'Registration should return 201');
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.data.user.role, 'LEARNER', 'Default role must be LEARNER');
    assert(regData.data.accessToken, 'Access token must be present');
    assert(regData.data.refreshToken, 'Refresh token must be present');

    // 2. Reject duplicate registration
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password, callsign: 'Cadet Duplicate' })
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate registration should return 409');

    // 3. Reject weak password (< 8 chars)
    const weakRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `weak_${Date.now()}@ocean.org`, password: 'short' })
    });
    assert.strictEqual(weakRes.status, 400, 'Weak password should return 400');

    // 4. Successful login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Login should return 200');
    assert.strictEqual(loginData.data.user.email, uniqueEmail);
    const token = loginData.data.accessToken;
    let refreshToken = loginData.data.refreshToken;

    // 5. Reject invalid login credentials
    const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword123!' })
    });
    assert.strictEqual(wrongPassRes.status, 401, 'Wrong password must return 401');

    // 6. Access protected /me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.data.user.email, uniqueEmail);

    // 7. Refresh Token Rotation
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const refreshData = await refreshRes.json();
    assert.strictEqual(refreshRes.status, 200, 'Token refresh should return 200');
    assert(refreshData.data.accessToken, 'New access token issued');
    assert(refreshData.data.refreshToken, 'Rotated refresh token issued');
    const oldRefreshToken = refreshToken;
    refreshToken = refreshData.data.refreshToken;

    // 8. Refresh Token Reuse Detection
    // Presenting the already-used oldRefreshToken must trigger reuse detection and revoke the family!
    const reuseRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: oldRefreshToken })
    });
    assert.strictEqual(reuseRes.status, 401, 'Token reuse must be rejected with 401');

    // Now even the new token in that family should be revoked!
    const revokedRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    assert.strictEqual(revokedRes.status, 401, 'Subsequent tokens in compromised family must be revoked');

    // 9. DPDP Data Export
    const exportRes = await fetch(`${baseUrl}/auth/export-data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const exportData = await exportRes.json();
    assert.strictEqual(exportRes.status, 200);
    assert(exportData.data.complianceNote, 'DPDP compliance note present');
    assert.strictEqual(exportData.data.user.email, uniqueEmail);

    // 10. DPDP Account Deletion
    const deleteRes = await fetch(`${baseUrl}/auth/delete-account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password })
    });
    assert.strictEqual(deleteRes.status, 200, 'Account deletion should return 200');

    // Confirm deleted account cannot log in
    const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password })
    });
    assert.strictEqual(reLoginRes.status, 401, 'Deleted user cannot log in');

    console.log('✓ All 10 Authentication Integration Tests passed.');
  } finally {
    server.close();
  }
}

module.exports = runAuthIntegrationTests;

if (require.main === module) {
  runAuthIntegrationTests().catch(err => {
    console.error('Auth integration tests failed:', err);
    process.exit(1);
  });
}
