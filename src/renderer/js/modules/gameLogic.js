/**
 * Ocean Literacy - Deterministic Game Logic & Progression Engine (Phase 1)
 *
 * Provides pure functions for decision evaluation, scoring rules, level formulas,
 * streak tracking, achievement verification, and local daily/weekly leaderboard grouping.
 *
 * This module is completely decoupled from DOM operations and runs identically
 * in browser environments and Node.js unit tests.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser global
    root.GameLogic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const XP_PER_LEVEL = 500;

  const RANK_TITLES = [
    { level: 1, title: 'Ocean Cadet', badge: '🌱' },
    { level: 2, title: 'Coastal Navigator', badge: '🧭' },
    { level: 3, title: 'Marine Specialist', badge: '🔬' },
    { level: 4, title: 'Ocean Scholar', badge: '🎓' },
    { level: 5, title: 'Master Ocean Steward', badge: '🪸' },
    { level: 6, title: 'Ocean Fleet Commander', badge: '⚓' }
  ];

  const ACHIEVEMENTS = [
    {
      id: 'first_tide',
      title: 'First Tide',
      icon: '🌊',
      desc: 'Successfully complete your first simulated ocean mission.',
      criteria: 'Complete 1 mission'
    },
    {
      id: 'ocean_sentinel',
      title: 'Ocean Sentinel',
      icon: '⭐',
      desc: 'Achieve 5 consecutive correct decisions without an error.',
      criteria: 'Reach a streak of 5'
    },
    {
      id: 'master_navigator',
      title: 'Master Navigator',
      icon: '🧭',
      desc: 'Demonstrate maritime versatility by completing missions across all 5 ocean roles.',
      criteria: 'Complete missions in all 5 roles'
    },
    {
      id: 'ocean_scholar',
      title: 'Ocean Scholar',
      icon: '🎓',
      desc: 'Advance through scientific study and operational mastery to reach Level 4 (1,500 XP).',
      criteria: 'Reach Level 4'
    },
    {
      id: 'storm_survivor',
      title: 'Storm Survivor',
      icon: '⚡',
      desc: 'Successfully resolve an Advanced difficulty hazard scenario on the first attempt.',
      criteria: 'Solve an Advanced hazard scenario correctly'
    },
    {
      id: 'guardian_of_the_deep',
      title: 'Guardian of the Deep',
      icon: '🛡️',
      desc: 'Accumulate 10 completed missions without incurring an unsafe hazard penalty.',
      criteria: '10 completions with zero hazard penalties'
    }
  ];

  const DEMO_LEADERBOARD_DAILY = [
    { id: 'demo-1', playerName: 'Arjun M. [Demo]', roleTitle: 'Fisher', score: 300, date: null, isDemo: true },
    { id: 'demo-2', playerName: 'Capt. Lakshmi [Demo]', roleTitle: 'Ship Captain', score: 280, date: null, isDemo: true },
    { id: 'demo-3', playerName: 'Priya K. [Demo]', roleTitle: 'Tourism Operator', score: 260, date: null, isDemo: true },
    { id: 'demo-4', playerName: 'Kiran R. [Demo]', roleTitle: 'Community Volunteer', score: 200, date: null, isDemo: true },
    { id: 'demo-5', playerName: 'Deepa S. [Demo]', roleTitle: 'Conservation Ranger', score: 180, date: null, isDemo: true }
  ];

  const DEMO_LEADERBOARD_WEEKLY = [
    { id: 'demo-w1', playerName: 'Capt. Lakshmi [Demo]', roleTitle: 'Ship Captain', score: 850, week: null, isDemo: true },
    { id: 'demo-w2', playerName: 'Arjun M. [Demo]', roleTitle: 'Fisher', score: 790, week: null, isDemo: true },
    { id: 'demo-w3', playerName: 'Deepa S. [Demo]', roleTitle: 'Conservation Ranger', score: 720, week: null, isDemo: true },
    { id: 'demo-w4', playerName: 'Priya K. [Demo]', roleTitle: 'Tourism Operator', score: 650, week: null, isDemo: true },
    { id: 'demo-w5', playerName: 'Kiran R. [Demo]', roleTitle: 'Community Volunteer', score: 600, week: null, isDemo: true }
  ];

  /**
   * Calculates player level from total XP.
   * Every 500 XP unlocks the next level, starting from Level 1 at 0 XP.
   */
  function calculateLevel(xp) {
    const safeXp = Math.max(0, Number(xp) || 0);
    return Math.floor(safeXp / XP_PER_LEVEL) + 1;
  }

  /**
   * Computes granular progress towards the next level.
   */
  function calculateProgress(xp) {
    const safeXp = Math.max(0, Number(xp) || 0);
    const level = calculateLevel(safeXp);
    const currentLevelBase = (level - 1) * XP_PER_LEVEL;
    const nextLevelTarget = level * XP_PER_LEVEL;
    const xpInLevel = safeXp - currentLevelBase;
    const xpNeeded = nextLevelTarget - safeXp;
    const percent = Math.min(100, Math.floor((xpInLevel / XP_PER_LEVEL) * 100));

    const rankInfo = RANK_TITLES.find(r => r.level === level) || {
      level,
      title: 'Ocean Master',
      badge: '🔱'
    };

    return {
      level,
      rankTitle: rankInfo.title,
      badge: rankInfo.badge,
      xp: safeXp,
      xpInLevel,
      xpNeeded,
      nextLevelTarget,
      percent
    };
  }

  /**
   * Evaluates a player's decision on a scenario.
   *
   * @param {Object} scenario The scenario object from OCEAN_GAME_DATA
   * @param {string} optionId The selected option identifier
   * @param {Object} state Current player state { score, xp, streak, completedMissions, hazardCount }
   * @returns {Object} Evaluation report with score changes, feedback, and updated progression
   */
  function evaluateDecision(scenario, optionId, state = {}) {
    if (!scenario || !Array.isArray(scenario.options)) {
      throw new Error('Invalid scenario provided to evaluateDecision');
    }

    const option = scenario.options.find(o => o.id === optionId);
    if (!option) {
      throw new Error(`Option ID "${optionId}" not found in scenario "${scenario.id}"`);
    }

    const completedMissions = Array.isArray(state.completedMissions) ? state.completedMissions : [];
    const isReplay = completedMissions.includes(scenario.id);

    const currentScore = Math.max(0, Number(state.score) || 0);
    const currentXp = Math.max(0, Number(state.xp) || 0);
    const currentStreak = Math.max(0, Number(state.streak) || 0);
    const currentHazardCount = Math.max(0, Number(state.hazardCount) || 0);

    const isCorrect = option.type === 'correct';
    const isPartial = option.type === 'partial';
    const isHazardous = option.isHazardous === true || option.type === 'unsafe';

    let pointsDelta = 0;
    let earnedXp = 0;
    let newStreak = 0;
    let newHazardCount = currentHazardCount;

    if (isCorrect) {
      pointsDelta = typeof option.score === 'number' ? option.score : 100;
      // Do not award duplicate XP if already completed, to prevent replay inflation
      earnedXp = isReplay ? 0 : (typeof option.xp === 'number' ? option.xp : 100);
      newStreak = currentStreak + 1;
    } else if (isPartial) {
      pointsDelta = typeof option.score === 'number' ? option.score : 40;
      earnedXp = isReplay ? 0 : (typeof option.xp === 'number' ? option.xp : 40);
      newStreak = 0;
    } else if (isHazardous) {
      const penalty = typeof option.penalty === 'number' ? option.penalty : 60;
      pointsDelta = -Math.abs(penalty);
      earnedXp = 0; // Never award XP for incorrect/unsafe decisions
      newStreak = 0;
      newHazardCount = currentHazardCount + 1;
    } else {
      // Standard incorrect
      const penalty = typeof option.penalty === 'number' ? option.penalty : 20;
      pointsDelta = -Math.abs(penalty);
      earnedXp = 0;
      newStreak = 0;
    }

    // Score can never be negative
    const newScore = Math.max(0, currentScore + pointsDelta);
    const newXp = currentXp + earnedXp;

    return {
      scenarioId: scenario.id,
      optionId: option.id,
      optionType: option.type,
      isCorrect,
      isPartial,
      isHazardous,
      isReplay,
      pointsDelta,
      earnedXp,
      previousScore: currentScore,
      newScore,
      previousXp: currentXp,
      newXp,
      newStreak,
      newHazardCount,
      feedback: option.feedback,
      scienceTakeaway: option.scienceTakeaway,
      sourceUrl: scenario.sourceUrl,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Formats a date object into local 'YYYY-MM-DD'
   */
  function getLocalDateKey(d = new Date()) {
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return '1970-01-01';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a date into a local weekly key: Year and week start date 'YYYY-MM-DD' (Monday)
   */
  function getLocalWeekKey(d = new Date()) {
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return '1970-W01';
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday
    // Calculate Monday of current week
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    return `Week of ${getLocalDateKey(monday)}`;
  }

  /**
   * Evaluates achievement unlock triggers based on cumulative statistics and mission history.
   *
   * @param {Object} stats { totalCompleted, xp, level, streak, maxStreak, hazardIncidents }
   * @param {Array} history Array of completed mission records
   * @param {Array} unlockedIds Already unlocked achievement IDs
   * @returns {Array} List of newly unlocked achievement objects
   */
  function checkAchievements(stats = {}, history = [], unlockedIds = []) {
    const existing = new Set(unlockedIds);
    const newlyUnlocked = [];

    const completedCount = Number(stats.totalCompleted) || 0;
    const xp = Number(stats.xp) || 0;
    const maxStreak = Math.max(Number(stats.streak) || 0, Number(stats.maxStreak) || 0);
    const hazardIncidents = Number(stats.hazardIncidents) || 0;

    // 1. First Tide
    if (!existing.has('first_tide') && completedCount >= 1) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'first_tide');
      if (ach) newlyUnlocked.push(ach);
    }

    // 2. Ocean Sentinel (Streak of 5)
    if (!existing.has('ocean_sentinel') && maxStreak >= 5) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'ocean_sentinel');
      if (ach) newlyUnlocked.push(ach);
    }

    // 3. Master Navigator (All 5 roles)
    if (!existing.has('master_navigator')) {
      const uniqueRoles = new Set();
      (history || []).forEach(h => {
        if (h.isCorrect && h.roleId) uniqueRoles.add(h.roleId);
      });
      if (uniqueRoles.size >= 5) {
        const ach = ACHIEVEMENTS.find(a => a.id === 'master_navigator');
        if (ach) newlyUnlocked.push(ach);
      }
    }

    // 4. Ocean Scholar (Level 4 / 1500 XP)
    if (!existing.has('ocean_scholar') && xp >= 1500) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'ocean_scholar');
      if (ach) newlyUnlocked.push(ach);
    }

    // 5. Storm Survivor (Advanced hazard resolved correctly)
    if (!existing.has('storm_survivor')) {
      const advancedHazardSolved = (history || []).some(h =>
        h.isCorrect && h.difficulty === 'Advanced' && (h.isHazardousScenario || h.scenarioId.includes('volunteer-02') || h.scenarioId.includes('volunteer-03') || h.scenarioId.includes('captain-03'))
      );
      if (advancedHazardSolved) {
        const ach = ACHIEVEMENTS.find(a => a.id === 'storm_survivor');
        if (ach) newlyUnlocked.push(ach);
      }
    }

    // 6. Guardian of the Deep (10 completions with 0 hazards)
    if (!existing.has('guardian_of_the_deep') && completedCount >= 10 && hazardIncidents === 0) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'guardian_of_the_deep');
      if (ach) newlyUnlocked.push(ach);
    }

    return newlyUnlocked;
  }

  /**
   * Groups local history records into daily or weekly rankings.
   *
   * @param {Array} history Array of decision history entries
   * @param {string} period 'daily' or 'weekly'
   * @param {Date|string} targetDate Reference date
   * @returns {Array} Sorted leaderboard entries
   */
  function groupLeaderboard(history = [], period = 'daily', targetDate = new Date()) {
    const refDate = (targetDate instanceof Date) ? targetDate : new Date(targetDate);
    const targetKey = period === 'daily' ? getLocalDateKey(refDate) : getLocalWeekKey(refDate);

    // Filter relevant non-practice or highest scores for that day/week
    const playerEntries = [];

    (history || []).forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      const entryKey = period === 'daily' ? getLocalDateKey(entryDate) : getLocalWeekKey(entryDate);

      if (entryKey === targetKey) {
        playerEntries.push({
          id: entry.id || `local-${entry.timestamp}`,
          playerName: entry.playerName || 'Local Cadet (You)',
          roleTitle: entry.roleTitle || 'Maritime Explorer',
          score: entry.pointsDelta > 0 ? entry.pointsDelta : 0,
          dateKey: entryKey,
          timestamp: entry.timestamp,
          isDemo: false
        });
      }
    });

    // Merge with demo baseline entries for that period
    const demoPool = period === 'daily' ? DEMO_LEADERBOARD_DAILY : DEMO_LEADERBOARD_WEEKLY;
    const combined = [...playerEntries, ...demoPool];

    // Sort descending by score
    combined.sort((a, b) => b.score - a.score);

    // Assign 1-based ranks
    return combined.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  return {
    XP_PER_LEVEL,
    RANK_TITLES,
    ACHIEVEMENTS,
    calculateLevel,
    calculateProgress,
    evaluateDecision,
    getLocalDateKey,
    getLocalWeekKey,
    checkAchievements,
    groupLeaderboard
  };
}));
