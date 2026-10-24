/**
 * Unit Tests: Date and Timezone Period Utilities
 */

const assert = require('assert');
const { getPeriodBoundaries } = require('../../src/utils/dateUtils');

async function runDateTests() {
  console.log('\n--- Date & Timezone Utilities Unit Tests ---');

  // Test UTC date: 2026-10-24 12:00:00 UTC
  const testDate = new Date('2026-10-24T12:00:00Z');
  const boundaries = getPeriodBoundaries(testDate, 'Asia/Kolkata');

  // In Asia/Kolkata (+5:30), 12:00 UTC is 17:30 IST on Oct 24
  assert.strictEqual(boundaries.dailyKey, '2026-10-24', 'Daily key in IST must be 2026-10-24');
  assert.strictEqual(boundaries.startOfDayUtc.toISOString(), '2026-10-23T18:30:00.000Z', 'Start of day UTC must match midnight IST');
  assert.strictEqual(boundaries.endOfDayUtc.toISOString(), '2026-10-24T18:29:59.999Z', 'End of day UTC must match 23:59:59.999 IST');

  // Test weekly boundary: Oct 24, 2026 is Saturday -> week starts on Monday Oct 19 IST (Oct 18 18:30 UTC)
  assert(boundaries.weeklyKey.startsWith('2026-W'), 'Valid ISO week key format');
  assert.strictEqual(boundaries.startOfWeekUtc.toISOString(), '2026-10-18T18:30:00.000Z', 'Start of week must be Monday 00:00:00 IST');

  console.log('✓ All Date & Timezone Unit Tests passed.');
}

module.exports = runDateTests;

if (require.main === module) {
  runDateTests().catch(err => {
    console.error('Date tests failed:', err);
    process.exit(1);
  });
}
