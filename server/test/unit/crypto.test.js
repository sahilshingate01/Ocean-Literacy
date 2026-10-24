/**
 * Unit Tests: Cryptographic & Token Utilities
 */

const assert = require('assert');
const {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  generateAccessToken,
  verifyAccessToken
} = require('../../src/utils/crypto');

async function runCryptoTests() {
  console.log('\n--- Cryptographic Utilities Unit Tests ---');

  // 1. Password hashing
  const password = 'TestSecurePassword2026!';
  const hash = await hashPassword(password);
  assert(hash.startsWith('$2'), 'Hash must be a bcrypt hash');
  assert.notStrictEqual(hash, password, 'Hash must not equal plaintext');

  // 2. Password verification
  const isMatch = await comparePassword(password, hash);
  assert.strictEqual(isMatch, true, 'Valid password must match hash');

  const isWrong = await comparePassword('WrongPassword!', hash);
  assert.strictEqual(isWrong, false, 'Invalid password must not match hash');

  // 3. Token generation & SHA-256
  const rawToken = generateSecureToken(32);
  assert.strictEqual(rawToken.length, 64, '32 bytes hex should be 64 characters');

  const tokenHashed = hashToken(rawToken);
  assert.strictEqual(tokenHashed.length, 64, 'SHA-256 output must be 64 characters');
  assert.strictEqual(tokenHashed, hashToken(rawToken), 'Hash must be deterministic');

  // 4. JWT access token
  const payload = { userId: 'usr-123', email: 'cadet@ocean.org', role: 'LEARNER' };
  const jwtToken = generateAccessToken(payload);
  assert(typeof jwtToken === 'string' && jwtToken.split('.').length === 3, 'Valid JWT structure');

  const decoded = verifyAccessToken(jwtToken);
  assert.strictEqual(decoded.userId, payload.userId);
  assert.strictEqual(decoded.email, payload.email);
  assert.strictEqual(decoded.role, payload.role);

  console.log('✓ All 4 Cryptographic Unit Tests passed.');
}

module.exports = runCryptoTests;

if (require.main === module) {
  runCryptoTests().catch(err => {
    console.error('Crypto tests failed:', err);
    process.exit(1);
  });
}
