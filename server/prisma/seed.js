/**
 * Database Seed Script for Ocean Literacy Platform (Phase 2)
 *
 * Populates authoritative database with:
 * - 5 Maritime Occupations / Game Roles
 * - 6 Milestone Achievements
 * - 4 Official INCOIS Service Configurations
 * - 15 Published Mission Scenarios (Version 1)
 *
 * Safe for development and production: Does NOT inject fake users or fraudulent leaderboard scores.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load Phase 1 authoritative datasets
const gameData = require('../../src/renderer/js/data/gameScenarios.js');
const gameLogic = require('../../src/renderer/js/modules/gameLogic.js');

async function seed() {
  console.log('🌱 Starting Ocean Literacy Phase 2 Database Seeding...\n');

  // 1. Seed Game Roles
  console.log('Seeding 5 Maritime Roles...');
  for (const role of gameData.ROLES) {
    await prisma.gameRole.upsert({
      where: { id: role.id },
      update: {
        title: role.title,
        icon: role.icon,
        shortDesc: role.shortDesc,
        detailedDesc: role.detailedDesc,
        keyServices: role.keyServices
      },
      create: {
        id: role.id,
        title: role.title,
        icon: role.icon,
        shortDesc: role.shortDesc,
        detailedDesc: role.detailedDesc,
        keyServices: role.keyServices
      }
    });
  }
  console.log(`  ✓ Seeded ${gameData.ROLES.length} roles.`);

  // 2. Seed Achievements
  console.log('Seeding Standard Milestone Achievements...');
  const achievements = [
    {
      id: 'first_tide',
      title: 'First Tide',
      icon: '🌊',
      desc: 'Successfully complete your first simulated ocean mission.',
      criteria: 'Complete 1 mission',
      xpReward: 100
    },
    {
      id: 'ocean_sentinel',
      title: 'Ocean Sentinel',
      icon: '⭐',
      desc: 'Achieve 5 consecutive correct decisions without an error.',
      criteria: 'Reach a streak of 5',
      xpReward: 250
    },
    {
      id: 'master_navigator',
      title: 'Master Navigator',
      icon: '🧭',
      desc: 'Demonstrate maritime versatility by completing missions across all 5 ocean roles.',
      criteria: 'Complete missions in all 5 roles',
      xpReward: 300
    },
    {
      id: 'ocean_scholar',
      title: 'Ocean Scholar',
      icon: '🎓',
      desc: 'Advance through scientific study and operational mastery to reach Level 4 (1,500 XP).',
      criteria: 'Reach Level 4',
      xpReward: 500
    },
    {
      id: 'storm_survivor',
      title: 'Storm Survivor',
      icon: '⚡',
      desc: 'Successfully resolve an Advanced difficulty hazard scenario on the first attempt.',
      criteria: 'Solve an Advanced hazard scenario correctly',
      xpReward: 200
    },
    {
      id: 'guardian_of_the_deep',
      title: 'Guardian of the Deep',
      icon: '🛡️',
      desc: 'Accumulate 10 completed missions without incurring an unsafe hazard penalty.',
      criteria: '10 completions with zero hazard penalties',
      xpReward: 400
    }
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: {
        title: ach.title,
        icon: ach.icon,
        desc: ach.desc,
        criteria: ach.criteria,
        xpReward: ach.xpReward
      },
      create: ach
    });
  }
  console.log(`  ✓ Seeded ${achievements.length} achievements.`);

  // 3. Seed INCOIS Service Configurations
  console.log('Seeding INCOIS Service Configurations...');
  const incoisConfigs = [
    {
      id: 'pfz',
      serviceName: 'Potential Fishing Zone (PFZ) Advisories',
      officialUrl: 'https://www.incois.gov.in/MarineFisheries/PfzAdvisory',
      portalUrl: 'https://incois.gov.in/MarineFisheries/PfzWebGis',
      endpointUrl: null,
      cacheTtlSeconds: 1800, // 30 minutes
      isEnabled: true
    },
    {
      id: 'osf',
      serviceName: 'Ocean State Forecasts (OSF)',
      officialUrl: 'https://www.incois.gov.in/site/services/osf.jsp',
      portalUrl: 'https://www.incois.gov.in/oceanservices/osfforecast.jsp',
      endpointUrl: null,
      cacheTtlSeconds: 900, // 15 minutes
      isEnabled: true
    },
    {
      id: 'tsunami',
      serviceName: 'Indian Tsunami Early Warning System (ITEWS)',
      officialUrl: 'https://tsunami.incois.gov.in/TEWS/about.jsp',
      portalUrl: 'https://tsunami.incois.gov.in/TEWS/about.jsp',
      endpointUrl: null,
      cacheTtlSeconds: 300, // 5 minutes
      isEnabled: true
    },
    {
      id: 'marine_heatwave',
      serviceName: 'Coral Bleaching & Marine Heatwave Alerts',
      officialUrl: 'https://www.incois.gov.in/portal/coral_bleaching.jsp',
      portalUrl: 'https://www.incois.gov.in/portal/coral_bleaching.jsp',
      endpointUrl: null,
      cacheTtlSeconds: 3600, // 1 hour
      isEnabled: true
    }
  ];

  for (const conf of incoisConfigs) {
    await prisma.incoisConfig.upsert({
      where: { id: conf.id },
      update: conf,
      create: conf
    });
  }
  console.log(`  ✓ Seeded ${incoisConfigs.length} INCOIS service configurations.`);

  // 4. Seed Mission Scenarios & Version 1 Snapshots
  console.log('Seeding 15 Scenarios with Immutable Version 1 Snapshots...');
  for (const s of gameData.SCENARIOS) {
    // 4a. Upsert parent Scenario
    await prisma.missionScenario.upsert({
      where: { id: s.id },
      update: {
        roleId: s.roleId,
        status: 'PUBLISHED',
        currentVersion: 1
      },
      create: {
        id: s.id,
        roleId: s.roleId,
        status: 'PUBLISHED',
        currentVersion: 1
      }
    });

    // 4b. Upsert Version 1
    const existingVersion = await prisma.scenarioVersion.findUnique({
      where: {
        scenarioId_versionNumber: {
          scenarioId: s.id,
          versionNumber: 1
        }
      }
    });

    const versionPayload = {
      scenarioId: s.id,
      versionNumber: 1,
      title: s.title,
      roleId: s.roleId,
      region: s.region || 'Indian Ocean',
      topic: s.topic || s.category || 'Ocean Science',
      difficulty: s.difficulty || 'Intermediate',
      objective: s.objective,
      situationBriefing: s.situationBriefing,
      oceanConditions: s.oceanConditions || [],
      simulationNotice: s.simulationNotice || 'SIMULATION — Educational demo data, not live INCOIS information.',
      options: s.options || [],
      scientificReferences: s.scientificReferences || null,
      publishedAt: new Date()
    };

    if (existingVersion) {
      await prisma.scenarioVersion.update({
        where: { id: existingVersion.id },
        data: versionPayload
      });
    } else {
      await prisma.scenarioVersion.create({
        data: versionPayload
      });
    }
  }
  console.log(`  ✓ Seeded ${gameData.SCENARIOS.length} scenarios with published Version 1.\n`);

  console.log('✅ Ocean Literacy Phase 2 Database Seeding completed successfully.');
}

seed()
  .catch((err) => {
    console.error('❌ Database seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
