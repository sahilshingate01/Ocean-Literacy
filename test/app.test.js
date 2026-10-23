/**
 * Ocean Literacy Desktop Application - Test Suite
 * Validates data schemas, assets, desktop entry points, and script integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('Running Ocean Literacy Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
    }
  }

  // 1. Check Package Configuration
  test('package.json exists and defines electron main', () => {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    assert(fs.existsSync(pkgPath), 'package.json missing');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.main, 'src/main/main.js');
    assert(pkg.scripts.start, 'npm start missing');
    assert(pkg.scripts.dist, 'npm run dist missing');
  });

  // 2. Check Core Electron Entrypoints
  test('Electron main process and preload scripts exist', () => {
    const mainPath = path.join(__dirname, '..', 'src/main/main.js');
    const preloadPath = path.join(__dirname, '..', 'src/preload/preload.js');
    const indexPath = path.join(__dirname, '..', 'src/renderer/index.html');
    assert(fs.existsSync(mainPath), 'main.js missing');
    assert(fs.existsSync(preloadPath), 'preload.js missing');
    assert(fs.existsSync(indexPath), 'index.html missing');
  });

  // 3. Check 7 UNESCO Principles Data
  test('Principles dataset contains all 7 UNESCO principles', () => {
    const dataPath = path.join(__dirname, '..', 'src/renderer/js/data/principles.js');
    assert(fs.existsSync(dataPath), 'principles.js missing');
    const content = fs.readFileSync(dataPath, 'utf8');
    const window = {};
    eval(content); // safely evaluate data assignment to window.OCEAN_PRINCIPLES
    assert(Array.isArray(window.OCEAN_PRINCIPLES), 'OCEAN_PRINCIPLES is not an array');
    assert.strictEqual(window.OCEAN_PRINCIPLES.length, 7, 'Must have exactly 7 principles');
    window.OCEAN_PRINCIPLES.forEach((p, idx) => {
      assert.strictEqual(p.number, idx + 1, `Principle number mismatch at ${idx}`);
      assert(p.title && p.title.length > 5, `Principle ${idx + 1} missing title`);
      assert(Array.isArray(p.concepts) && p.concepts.length > 0, `Principle ${idx + 1} missing concepts`);
      assert(p.caseStudy && p.caseStudy.title, `Principle ${idx + 1} missing case study`);
    });
  });

  // 4. Check Depth Zones Data
  test('Depth Zones dataset contains 5 bathymetric layers', () => {
    const depthPath = path.join(__dirname, '..', 'src/renderer/js/data/depthZones.js');
    assert(fs.existsSync(depthPath), 'depthZones.js missing');
    const content = fs.readFileSync(depthPath, 'utf8');
    const window = {};
    eval(content);
    assert(Array.isArray(window.OCEAN_DEPTH_ZONES), 'OCEAN_DEPTH_ZONES is not an array');
    assert.strictEqual(window.OCEAN_DEPTH_ZONES.length, 5, 'Must have 5 vertical depth zones');
  });

  // 5. Check Marine Species Dataset
  test('Marine Life dataset contains valid species records', () => {
    const marinePath = path.join(__dirname, '..', 'src/renderer/js/data/marineLife.js');
    assert(fs.existsSync(marinePath), 'marineLife.js missing');
    const content = fs.readFileSync(marinePath, 'utf8');
    const window = {};
    eval(content);
    assert(Array.isArray(window.MARINE_SPECIES), 'MARINE_SPECIES is not an array');
    assert(window.MARINE_SPECIES.length >= 10, 'Expected at least 10 marine species');
    window.MARINE_SPECIES.forEach(s => {
      assert(s.commonName && s.scientificName, 'Species missing name');
      assert(['CR', 'EN', 'VU', 'NT', 'LC', 'NE'].includes(s.iucnCode), `Invalid IUCN code ${s.iucnCode}`);
    });
  });

  // 6. Check Asset Icons
  test('App branding and tray icon PNGs exist and have non-zero size', () => {
    const iconPath = path.join(__dirname, '..', 'assets/icons/icon.png');
    const trayPath = path.join(__dirname, '..', 'assets/icons/tray-icon.png');
    assert(fs.existsSync(iconPath), 'icon.png missing');
    assert(fs.existsSync(trayPath), 'tray-icon.png missing');
    assert(fs.statSync(iconPath).size > 1000, 'icon.png too small');
    assert(fs.statSync(trayPath).size > 100, 'tray-icon.png too small');
  });

  // 7. Phase 1: Check 5 Playable Roles Data
  test('All 5 playable roles exist and contain complete metadata', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    assert(Array.isArray(gameData.ROLES), 'ROLES array missing');
    assert.strictEqual(gameData.ROLES.length, 5, 'Must have exactly 5 playable roles');

    const expectedRoleIds = ['fisher', 'captain', 'tourism_operator', 'community_volunteer', 'conservation_ranger'];
    const foundIds = gameData.ROLES.map(r => r.id);
    expectedRoleIds.forEach(id => {
      assert(foundIds.includes(id), `Missing expected role ID: ${id}`);
    });

    gameData.ROLES.forEach(r => {
      assert(r.title && r.title.length > 3, `Role ${r.id} missing title`);
      assert(r.icon && r.icon.length > 0, `Role ${r.id} missing icon`);
      assert(r.shortDesc && r.shortDesc.length > 10, `Role ${r.id} missing shortDesc`);
      assert(r.detailedDesc && r.detailedDesc.length > 20, `Role ${r.id} missing detailedDesc`);
      assert(Array.isArray(r.keyServices) && r.keyServices.length > 0, `Role ${r.id} missing keyServices`);
    });
  });

  // 8. Phase 1: Check 15 Scenarios with Unique IDs and Simulation Disclaimers
  test('At least 15 scenarios exist with unique IDs and explicit simulation notices', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    assert(Array.isArray(gameData.SCENARIOS), 'SCENARIOS array missing');
    assert(gameData.SCENARIOS.length >= 15, `Expected at least 15 scenarios, found ${gameData.SCENARIOS.length}`);

    const idSet = new Set();
    gameData.SCENARIOS.forEach(scen => {
      assert(!idSet.has(scen.id), `Duplicate scenario ID detected: ${scen.id}`);
      idSet.add(scen.id);

      assert(scen.title && scen.title.length > 5, `Scenario ${scen.id} missing title`);
      assert(scen.roleId, `Scenario ${scen.id} missing roleId`);
      assert(scen.region, `Scenario ${scen.id} missing region`);
      assert(scen.objective, `Scenario ${scen.id} missing objective`);
      assert(scen.situationBriefing, `Scenario ${scen.id} missing situationBriefing`);
      assert(Array.isArray(scen.oceanConditions) && scen.oceanConditions.length >= 3, `Scenario ${scen.id} must have at least 3 oceanConditions`);
      assert(scen.simulationNotice && scen.simulationNotice.includes('SIMULATION'), `Scenario ${scen.id} missing mandatory SIMULATION notice`);
      assert(Array.isArray(scen.options) && scen.options.length >= 2, `Scenario ${scen.id} must have 2 to 4 options`);
    });
  });

  // 9. Phase 1: Check Each Role Has at Least 3 Scenarios
  test('Each of the 5 roles has at least three applicable scenarios', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    const roleIds = ['fisher', 'captain', 'tourism_operator', 'community_volunteer', 'conservation_ranger'];

    roleIds.forEach(roleId => {
      const missions = gameData.SCENARIOS.filter(s => s.roleId === roleId);
      assert(missions.length >= 3, `Role ${roleId} has only ${missions.length} missions (expected >= 3)`);
    });
  });

  // 10. Phase 1: Scenario Decision Logic & Option Validation
  test('Scenario options reference valid types and complete scientific takeaways', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    gameData.SCENARIOS.forEach(scen => {
      const correctOptions = scen.options.filter(o => o.type === 'correct');
      assert(correctOptions.length >= 1, `Scenario ${scen.id} must have at least one correct option`);

      scen.options.forEach(opt => {
        assert(opt.id, `Option in ${scen.id} missing id`);
        assert(opt.text && opt.text.length > 5, `Option ${opt.id} missing text`);
        assert(['correct', 'partial', 'incorrect', 'unsafe'].includes(opt.type), `Option ${opt.id} invalid type: ${opt.type}`);
        assert(opt.feedback && opt.feedback.length > 10, `Option ${opt.id} missing feedback`);
        assert(opt.scienceTakeaway && opt.scienceTakeaway.length > 10, `Option ${opt.id} missing scienceTakeaway`);
      });
    });
  });

  // 11. Phase 1: Deterministic Scoring - Correct Decisions
  test('Correct decisions award expected configurable points and XP', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    const sample = gameData.SCENARIOS[0];
    const correctOpt = sample.options.find(o => o.type === 'correct');

    const evalRes = gameLogic.evaluateDecision(sample, correctOpt.id, {
      score: 50,
      xp: 200,
      streak: 2,
      completedMissions: []
    });

    assert.strictEqual(evalRes.isCorrect, true);
    assert.strictEqual(evalRes.pointsDelta, correctOpt.score || 100);
    assert.strictEqual(evalRes.earnedXp, correctOpt.xp || 100);
    assert.strictEqual(evalRes.newScore, 50 + evalRes.pointsDelta);
    assert.strictEqual(evalRes.newXp, 200 + evalRes.earnedXp);
    assert.strictEqual(evalRes.newStreak, 3);
  });

  // 12. Phase 1: Penalty Scoring - Incorrect and Unsafe Decisions
  test('Incorrect and unsafe answers apply penalties and zero XP', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    // Test unsafe option in scenario 1
    const sample = gameData.SCENARIOS[0];
    const unsafeOpt = sample.options.find(o => o.type === 'unsafe');
    assert(unsafeOpt, 'Expected unsafe option in scenario 0');

    const evalRes = gameLogic.evaluateDecision(sample, unsafeOpt.id, {
      score: 100,
      xp: 300,
      streak: 4,
      completedMissions: []
    });

    assert.strictEqual(evalRes.isCorrect, false);
    assert.strictEqual(evalRes.isHazardous, true);
    assert.strictEqual(evalRes.earnedXp, 0, 'No XP should be awarded for unsafe choice');
    assert(evalRes.pointsDelta < 0, 'Penalty must be negative');
    assert.strictEqual(evalRes.newStreak, 0, 'Streak must reset to 0 on penalty');
    assert.strictEqual(evalRes.newScore, 100 + evalRes.pointsDelta);
  });

  // 13. Phase 1: Score Floor Constraint
  test('Mission scores cannot drop below zero after penalties', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    const sample = gameData.SCENARIOS[0];
    const unsafeOpt = sample.options.find(o => o.type === 'unsafe');

    const evalRes = gameLogic.evaluateDecision(sample, unsafeOpt.id, {
      score: 10, // low starting score
      xp: 50,
      streak: 1,
      completedMissions: []
    });

    assert(evalRes.newScore >= 0, `Score dropped below 0: ${evalRes.newScore}`);
    assert.strictEqual(evalRes.newScore, 0);
  });

  // 14. Phase 1: XP and Level Boundaries
  test('XP and level progression adhere strictly to level boundaries', () => {
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    // Level formula: 500 XP per level, starting at Level 1 (0 XP)
    assert.strictEqual(gameLogic.calculateLevel(0), 1);
    assert.strictEqual(gameLogic.calculateLevel(499), 1);
    assert.strictEqual(gameLogic.calculateLevel(500), 2);
    assert.strictEqual(gameLogic.calculateLevel(999), 2);
    assert.strictEqual(gameLogic.calculateLevel(1000), 3);
    assert.strictEqual(gameLogic.calculateLevel(1500), 4);

    const prog0 = gameLogic.calculateProgress(0);
    assert.strictEqual(prog0.level, 1);
    assert.strictEqual(prog0.xpInLevel, 0);
    assert.strictEqual(prog0.percent, 0);

    const prog250 = gameLogic.calculateProgress(250);
    assert.strictEqual(prog250.level, 1);
    assert.strictEqual(prog250.xpInLevel, 250);
    assert.strictEqual(prog250.percent, 50);

    const prog500 = gameLogic.calculateProgress(500);
    assert.strictEqual(prog500.level, 2);
    assert.strictEqual(prog500.xpInLevel, 0);
    assert.strictEqual(prog500.percent, 0);
  });

  // 15. Phase 1: Anti-Exploit Replay Protection
  test('Replaying an already-completed mission prevents XP inflation', () => {
    const gameData = require('../src/renderer/js/data/gameScenarios.js');
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    const sample = gameData.SCENARIOS[0];
    const correctOpt = sample.options.find(o => o.type === 'correct');

    const evalRes = gameLogic.evaluateDecision(sample, correctOpt.id, {
      score: 200,
      xp: 300,
      streak: 3,
      completedMissions: [sample.id] // scenario already completed
    });

    assert.strictEqual(evalRes.isReplay, true);
    assert.strictEqual(evalRes.earnedXp, 0, 'Replay must award 0 duplicate XP');
    assert.strictEqual(evalRes.newXp, 300, 'Total XP must remain unchanged on replay');
  });

  // 16. Phase 1: Daily and Weekly Leaderboard Grouping
  test('Daily and weekly leaderboard grouping handles dates and periods correctly', () => {
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    const now = new Date('2026-10-23T12:00:00Z');
    const todayKey = gameLogic.getLocalDateKey(now);
    assert(todayKey.startsWith('2026-10-23') || todayKey.startsWith('2026-10-24'), 'Valid local date key');

    const weekKey = gameLogic.getLocalWeekKey(now);
    assert(weekKey.includes('Week of'), 'Valid local week key');

    const history = [
      { id: '1', playerName: 'Pilot One', pointsDelta: 100, timestamp: now.toISOString() },
      { id: '2', playerName: 'Pilot Two', pointsDelta: 80, timestamp: now.toISOString() }
    ];

    const dailyRank = gameLogic.groupLeaderboard(history, 'daily', now);
    assert(Array.isArray(dailyRank), 'Leaderboard must return an array');
    assert(dailyRank.length >= 2, 'Should include history and demo entries');
    // Ensure descending order
    for (let i = 0; i < dailyRank.length - 1; i++) {
      assert(dailyRank[i].score >= dailyRank[i + 1].score, 'Leaderboard must be sorted descending by score');
      assert.strictEqual(dailyRank[i].rank, i + 1, 'Ranks must be contiguous 1-indexed');
    }
  });

  // 17. Phase 1: Achievement Unlock Verification
  test('Achievements trigger on reaching milestone conditions', () => {
    const gameLogic = require('../src/renderer/js/modules/gameLogic.js');

    const newAchs = gameLogic.checkAchievements(
      { totalCompleted: 1, xp: 100, streak: 1, maxStreak: 1, hazardIncidents: 0 },
      [],
      []
    );
    const firstTide = newAchs.find(a => a.id === 'first_tide');
    assert(firstTide, 'Completing 1 mission should unlock first_tide achievement');

    const streakAchs = gameLogic.checkAchievements(
      { totalCompleted: 5, xp: 500, streak: 5, maxStreak: 5, hazardIncidents: 0 },
      [],
      ['first_tide']
    );
    const sentinel = streakAchs.find(a => a.id === 'ocean_sentinel');
    assert(sentinel, 'Reaching streak of 5 should unlock ocean_sentinel');
  });

  // 18. Phase 1: Storage Resilience & Schema Migration
  test('GameStorage gracefully repairs corrupted, negative, or missing state', () => {
    const gameStorage = require('../src/renderer/js/modules/gameStorage.js');

    const corruptedInput = {
      score: -999,
      xp: 'invalid_number',
      activeRoleId: 'unregistered_role_xyz',
      completedMissions: 'not_an_array'
    };

    const sanitized = gameStorage.validateAndMigrateState(corruptedInput);
    assert.strictEqual(sanitized.schemaVersion, 1);
    assert.strictEqual(sanitized.score, 0, 'Negative score repaired to 0');
    assert.strictEqual(sanitized.xp, 0, 'Invalid XP repaired to 0');
    assert.strictEqual(sanitized.activeRoleId, 'fisher', 'Invalid role reset to default');
    assert(Array.isArray(sanitized.completedMissions), 'Repaired completedMissions to array');
    assert.strictEqual(sanitized.completedMissions.length, 0);
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
