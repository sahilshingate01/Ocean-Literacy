/**
 * Timezone & Period Calculation Utilities
 * Default timezone: Asia/Kolkata (IST = UTC+05:30)
 */

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns UTC Date boundaries for day and week in the target timezone
 */
function getPeriodBoundaries(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  // Format date parts in target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const partMap = {};
  parts.forEach(p => { partMap[p.type] = p.value; });

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);

  const dailyKey = `${partMap.year}-${partMap.month}-${partMap.day}`;

  // Start of day in target timezone converted to UTC Date
  // In Asia/Kolkata (UTC+5:30), 00:00:00 IST is 18:30:00 UTC of previous day
  // We can calculate offset dynamically:
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMs = tzDate.getTime() - utcDate.getTime();

  // Midnight today in target timezone
  const localMidnightMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const startOfDayUtc = new Date(localMidnightMs - offsetMs);
  const endOfDayUtc = new Date(startOfDayUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Day of week in target timezone (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  // We want Monday as start of week (ISO-8601 standard):
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const startOfWeekUtc = new Date(startOfDayUtc.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const endOfWeekUtc = new Date(startOfWeekUtc.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  // ISO Week Number
  const tempDate = new Date(date.getTime());
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
  const weeklyKey = `${year}-W${String(weekNo).padStart(2, '0')}`;

  return {
    timeZone,
    dailyKey,
    startOfDayUtc,
    endOfDayUtc,
    weeklyKey,
    startOfWeekUtc,
    endOfWeekUtc
  };
}

module.exports = {
  DEFAULT_TIMEZONE,
  getPeriodBoundaries
};
