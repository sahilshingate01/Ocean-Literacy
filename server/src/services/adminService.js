/**
 * Admin Content Management & Governance Service
 *
 * Implements scenario drafting, validation, version-immutable publishing,
 * role management, user moderation, and audit logs.
 */

const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

class AdminService {
  /**
   * System overview metrics
   */
  async getStats() {
    const [totalUsers, totalAttempts, finalizedAttempts, rolesCount, scenariosCount] = await Promise.all([
      prisma.user.count(),
      prisma.missionAttempt.count(),
      prisma.missionAttempt.count({ where: { status: 'FINALIZED' } }),
      prisma.gameRole.count({ where: { isArchived: false } }),
      prisma.missionScenario.count()
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    const scenariosByStatus = await prisma.missionScenario.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    return {
      metrics: {
        totalUsers,
        totalAttempts,
        finalizedAttempts,
        completionRate: totalAttempts > 0 ? Math.round((finalizedAttempts / totalAttempts) * 100) : 0,
        activeRoles: rolesCount,
        totalScenarios: scenariosCount
      },
      distribution: {
        roles: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count.id }), {}),
        scenarioStatuses: scenariosByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {})
      }
    };
  }

  /**
   * Paginated user list with role and status filtering
   */
  async getUsers({ page = 1, limit = 25, search = '', role = null } = {}) {
    const offset = Math.max(0, (page - 1) * limit);
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { callsign: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          leaderboardOptIn: true,
          createdAt: true,
          profile: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Update user application role (Admin only)
   */
  async updateUserRole(adminUserId, targetUserId, newRole) {
    if (!['LEARNER', 'CONTENT_EDITOR', 'ADMIN'].includes(newRole)) {
      throw new AppError('Invalid application role.', 400);
    }

    if (adminUserId === targetUserId && newRole !== 'ADMIN') {
      throw new AppError('Administrators cannot revoke their own admin privileges.', 400);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, role: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'User',
        resourceId: targetUserId,
        details: { targetEmail: updated.email, newRole }
      }
    });

    return updated;
  }

  /**
   * Deactivate or reactivate user account (Admin only)
   */
  async updateUserStatus(adminUserId, targetUserId, isActive) {
    if (adminUserId === targetUserId && !isActive) {
      throw new AppError('Administrators cannot deactivate their own account.', 400);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: Boolean(isActive) },
      select: { id: true, email: true, isActive: true }
    });

    // If deactivating, revoke all sessions
    if (!isActive) {
      await prisma.session.deleteMany({ where: { userId: targetUserId } });
      await prisma.refreshToken.updateMany({ where: { userId: targetUserId }, data: { isRevoked: true } });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: isActive ? 'USER_ACCOUNT_ACTIVATED' : 'USER_ACCOUNT_DEACTIVATED',
        resourceType: 'User',
        resourceId: targetUserId,
        details: { targetEmail: updated.email, isActive }
      }
    });

    return updated;
  }

  /**
   * Retrieves all scenarios with version snapshots for CMS
   */
  async getAllMissions() {
    return prisma.missionScenario.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      },
      orderBy: { id: 'asc' }
    });
  }

  /**
   * Retrieves full details and version history of an individual scenario
   */
  async getMissionDetail(scenarioId) {
    const scenario = await prisma.missionScenario.findUnique({
      where: { id: scenarioId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    if (!scenario) throw new AppError('Scenario not found.', 404);
    return scenario;
  }

  /**
   * Creates a new draft scenario
   */
  async createDraftMission(userId, data) {
    const { id, roleId, title, region, topic, difficulty, objective, situationBriefing, oceanConditions, simulationNotice, options, scientificReferences } = data;

    if (!id || typeof id !== 'string') {
      throw new AppError('Scenario unique ID is required (e.g. scen-fisher-04).', 400);
    }

    const existing = await prisma.missionScenario.findUnique({ where: { id: id.trim() } });
    if (existing) {
      throw new AppError(`Scenario with ID "${id}" already exists.`, 409);
    }

    this._validateScenarioCompleteness({ title, options, simulationNotice, objective });

    const newScenario = await prisma.missionScenario.create({
      data: {
        id: id.trim(),
        roleId: roleId || 'fisher',
        status: 'DRAFT',
        currentVersion: 1,
        versions: {
          create: {
            versionNumber: 1,
            title: title.trim(),
            roleId: roleId || 'fisher',
            region: region || 'Indian Ocean',
            topic: topic || 'Marine Stewardship',
            difficulty: difficulty || 'Intermediate',
            objective: objective || '',
            situationBriefing: situationBriefing || '',
            oceanConditions: oceanConditions || [],
            simulationNotice: simulationNotice || 'SIMULATION — Educational demo data, not live INCOIS information.',
            options: options || [],
            scientificReferences: scientificReferences || null,
            publishedBy: userId
          }
        }
      },
      include: { versions: true }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MISSION_DRAFT_CREATED',
        resourceType: 'MissionScenario',
        resourceId: newScenario.id,
        details: { title, roleId }
      }
    });

    return newScenario;
  }

  /**
   * Updates an existing scenario draft
   */
  async updateDraftMission(userId, scenarioId, data) {
    const scenario = await prisma.missionScenario.findUnique({
      where: { id: scenarioId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!scenario) throw new AppError('Scenario not found.', 404);

    const latestVersion = scenario.versions[0];
    if (!latestVersion) throw new AppError('No version found for scenario.', 500);

    // Check if this latest version has recorded attempts
    const attemptsCount = await prisma.missionAttempt.count({
      where: { scenarioVersionId: latestVersion.id }
    });

    if (attemptsCount > 0) {
      // Version immutability rule: If attempts exist on this version, create a new draft version!
      const newVersionNumber = scenario.currentVersion + 1;

      const newVersion = await prisma.scenarioVersion.create({
        data: {
          scenarioId: scenario.id,
          versionNumber: newVersionNumber,
          title: data.title || latestVersion.title,
          roleId: data.roleId || latestVersion.roleId,
          region: data.region || latestVersion.region,
          topic: data.topic || latestVersion.topic,
          difficulty: data.difficulty || latestVersion.difficulty,
          objective: data.objective || latestVersion.objective,
          situationBriefing: data.situationBriefing || latestVersion.situationBriefing,
          oceanConditions: data.oceanConditions || latestVersion.oceanConditions,
          simulationNotice: data.simulationNotice || latestVersion.simulationNotice,
          options: data.options || latestVersion.options,
          scientificReferences: data.scientificReferences || latestVersion.scientificReferences,
          publishedBy: userId
        }
      });

      await prisma.missionScenario.update({
        where: { id: scenario.id },
        data: { currentVersion: newVersionNumber, status: 'DRAFT' }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'MISSION_NEW_VERSION_DRAFTED',
          resourceType: 'MissionScenario',
          resourceId: scenario.id,
          details: { previousVersion: scenario.currentVersion, newVersion: newVersionNumber }
        }
      });

      return { scenarioId: scenario.id, version: newVersion, isNewVersion: true };
    } else {
      // In-place draft modification allowed only when 0 attempts have been played against it
      const updatedVersion = await prisma.scenarioVersion.update({
        where: { id: latestVersion.id },
        data: {
          title: data.title !== undefined ? data.title : latestVersion.title,
          roleId: data.roleId !== undefined ? data.roleId : latestVersion.roleId,
          region: data.region !== undefined ? data.region : latestVersion.region,
          topic: data.topic !== undefined ? data.topic : latestVersion.topic,
          difficulty: data.difficulty !== undefined ? data.difficulty : latestVersion.difficulty,
          objective: data.objective !== undefined ? data.objective : latestVersion.objective,
          situationBriefing: data.situationBriefing !== undefined ? data.situationBriefing : latestVersion.situationBriefing,
          oceanConditions: data.oceanConditions !== undefined ? data.oceanConditions : latestVersion.oceanConditions,
          simulationNotice: data.simulationNotice !== undefined ? data.simulationNotice : latestVersion.simulationNotice,
          options: data.options !== undefined ? data.options : latestVersion.options,
          scientificReferences: data.scientificReferences !== undefined ? data.scientificReferences : latestVersion.scientificReferences
        }
      });

      return { scenarioId: scenario.id, version: updatedVersion, isNewVersion: false };
    }
  }

  /**
   * Publishes scenario and enforces complete validation
   */
  async publishMission(userId, scenarioId) {
    const scenario = await prisma.missionScenario.findUnique({
      where: { id: scenarioId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!scenario || !scenario.versions[0]) {
      throw new AppError('Scenario not found or has no version to publish.', 404);
    }

    const latest = scenario.versions[0];
    this._validateScenarioCompleteness(latest);

    const updated = await prisma.$transaction([
      prisma.scenarioVersion.update({
        where: { id: latest.id },
        data: {
          publishedAt: new Date(),
          publishedBy: userId
        }
      }),
      prisma.missionScenario.update({
        where: { id: scenario.id },
        data: {
          status: 'PUBLISHED',
          roleId: latest.roleId
        }
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: 'MISSION_PUBLISHED',
          resourceType: 'MissionScenario',
          resourceId: scenario.id,
          details: { versionNumber: latest.versionNumber, title: latest.title }
        }
      })
    ]);

    return updated[1];
  }

  /**
   * Unpublishes a scenario (returns status to DRAFT)
   */
  async unpublishMission(userId, scenarioId) {
    const updated = await prisma.missionScenario.update({
      where: { id: scenarioId },
      data: { status: 'DRAFT' }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MISSION_UNPUBLISHED',
        resourceType: 'MissionScenario',
        resourceId: scenarioId
      }
    });

    return updated;
  }

  /**
   * Archives a scenario
   */
  async archiveMission(userId, scenarioId) {
    const updated = await prisma.missionScenario.update({
      where: { id: scenarioId },
      data: { status: 'ARCHIVED' }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MISSION_ARCHIVED',
        resourceType: 'MissionScenario',
        resourceId: scenarioId
      }
    });

    return updated;
  }

  /**
   * Retrieves paginated administrative audit logs
   */
  async getAuditLogs({ page = 1, limit = 50 } = {}) {
    const offset = Math.max(0, (page - 1) * limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { email: true, role: true }
          }
        }
      }),
      prisma.auditLog.count()
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Leaderboard moderation: Revokes a fraudulent score transaction
   */
  async moderateScore(adminUserId, transactionId, reason) {
    const tx = await prisma.scoreTransaction.findUnique({
      where: { id: transactionId },
      include: { user: { include: { profile: true } } }
    });

    if (!tx) throw new AppError('Score transaction record not found.', 404);

    const newScore = Math.max(0, (tx.user.profile?.totalScore || 0) - tx.pointsDelta);
    const newXp = Math.max(0, (tx.user.profile?.totalXp || 0) - tx.xpDelta);

    await prisma.$transaction([
      prisma.userProfile.update({
        where: { userId: tx.userId },
        data: { totalScore: newScore, totalXp: newXp }
      }),
      prisma.scoreTransaction.create({
        data: {
          userId: tx.userId,
          pointsDelta: -tx.pointsDelta,
          xpDelta: -tx.xpDelta,
          reason: `admin_moderation_adjustment: ${reason || 'Score revoked by moderator'}`
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'LEADERBOARD_SCORE_MODERATED',
          resourceType: 'ScoreTransaction',
          resourceId: transactionId,
          details: { targetUserId: tx.userId, revokedPoints: tx.pointsDelta, reason }
        }
      })
    ]);

    return { success: true, message: 'Score successfully moderated and profile adjusted.' };
  }

  // Publication completeness validator
  _validateScenarioCompleteness(scenario) {
    if (!scenario.title || scenario.title.trim().length < 5) {
      throw new AppError('Validation failed: Title must be at least 5 characters.', 400);
    }
    if (!scenario.objective || scenario.objective.trim().length < 10) {
      throw new AppError('Validation failed: Objective must be at least 10 characters.', 400);
    }
    if (!scenario.simulationNotice || !scenario.simulationNotice.includes('SIMULATION')) {
      throw new AppError('Validation failed: Mandatory SIMULATION notice disclaimer is missing.', 400);
    }
    if (!Array.isArray(scenario.options) || scenario.options.length < 2) {
      throw new AppError('Validation failed: Scenario must contain at least 2 options.', 400);
    }

    const correctCount = scenario.options.filter(o => o.type === 'correct').length;
    if (correctCount < 1) {
      throw new AppError('Validation failed: Scenario must contain at least 1 "correct" option.', 400);
    }

    for (const opt of scenario.options) {
      if (!opt.id || !opt.text || opt.text.trim().length < 5) {
        throw new AppError(`Validation failed: Option ${opt.id || 'unidentified'} has invalid text.`, 400);
      }
      if (!opt.feedback || opt.feedback.trim().length < 10) {
        throw new AppError(`Validation failed: Option ${opt.id} missing educational feedback.`, 400);
      }
      if (!opt.scienceTakeaway || opt.scienceTakeaway.trim().length < 10) {
        throw new AppError(`Validation failed: Option ${opt.id} missing scientific takeaway.`, 400);
      }
    }
  }
}

module.exports = new AdminService();
