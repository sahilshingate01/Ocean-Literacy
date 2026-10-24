/**
 * Authentication & Account Management Service
 *
 * Implements registration, login, refresh token rotation with reuse detection,
 * password reset lifecycle, DPDP data export & deletion, and security auditing.
 */

const {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  generateAccessToken
} = require('../utils/crypto');
const { AppError } = require('../middleware/errorHandler');
const prisma = require('../config/prisma');
const config = require('../config');

class AuthService {
  /**
   * Register a new user account
   */
  async register({ email, password, callsign, role = 'LEARNER' }) {
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const passwordHash = await hashPassword(password);

    // Create user and initial profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role === 'ADMIN' ? 'LEARNER' : role, // Prevent self-assigning ADMIN via register
        isActive: true,
        profile: {
          create: {
            callsign: callsign || 'Ocean Cadet',
            activeRoleId: 'fisher'
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Create initial session & tokens
    const { accessToken, refreshToken } = await this._issueTokenPair(user.id, user.email, user.role);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user.id,
        details: { email: user.email, role: user.role }
      }
    });

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticate an existing user
   */
  async login({ email, password, ipAddress, userAgent }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account is disabled. Please contact an administrator.', 403);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    // Issue rotated token pair
    const { accessToken, refreshToken } = await this._issueTokenPair(user.id, user.email, user.role);

    // Record session
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: hashToken(accessToken),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN_SUCCESS',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    });

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token with Refresh Token Rotation & Reuse Detection
   */
  async refresh({ refreshToken }) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required.', 400);
    }

    const tokenHashed = hashToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: tokenHashed },
      include: { user: { include: { profile: true } } }
    });

    if (!tokenRecord) {
      throw new AppError('Invalid refresh token.', 401);
    }

    // Reuse detection: If token was already revoked, revoke its entire family!
    if (tokenRecord.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { family: tokenRecord.family },
        data: { isRevoked: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: tokenRecord.userId,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          resourceType: 'RefreshToken',
          resourceId: tokenRecord.id,
          details: { family: tokenRecord.family, message: 'All tokens in family revoked.' }
        }
      });

      throw new AppError('Refresh token reuse detected. Access revoked for security.', 401);
    }

    // Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('Refresh token has expired. Please sign in again.', 401);
    }

    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      throw new AppError('User account is inactive.', 403);
    }

    // Revoke the used refresh token (single-use)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    // Issue new token in same family
    const newRefreshTokenRaw = generateSecureToken(32);
    const newRefreshTokenHash = hashToken(newRefreshTokenRaw);

    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newRefreshTokenHash,
        family: tokenRecord.family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenRaw,
      user: this._sanitizeUser(tokenRecord.user)
    };
  }

  /**
   * Revoke session and refresh token on logout
   */
  async logout({ userId, refreshToken }) {
    if (refreshToken) {
      const tokenHashed = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: tokenHashed },
        data: { isRevoked: true }
      });
    }

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          resourceType: 'User',
          resourceId: userId
        }
      });
    }

    return { success: true };
  }

  /**
   * Request password reset token
   */
  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // Avoid enumeration by always returning successful message
    if (!user || !user.isActive) {
      return { message: 'If this email is registered, a password reset link has been issued.' };
    }

    const resetTokenRaw = generateSecureToken(32);
    const tokenHash = hashToken(resetTokenRaw);

    // Invalidate existing unused tokens for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true }
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour validity
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'User',
        resourceId: user.id
      }
    });

    return {
      message: 'If this email is registered, a password reset link has been issued.',
      // In development/test mode, expose token for testing convenience
      ...(config.isProduction ? {} : { devResetToken: resetTokenRaw })
    };
  }

  /**
   * Complete password reset using token
   */
  async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token);

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.isUsed) {
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new AppError('Password reset token has expired.', 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { isUsed: true }
      }),
      // Revoke all existing sessions and refresh tokens on password change
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true }
      }),
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId }
      }),
      prisma.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: 'PASSWORD_RESET_SUCCESS',
          resourceType: 'User',
          resourceId: resetRecord.userId
        }
      })
    ]);

    return { success: true, message: 'Password has been successfully updated.' };
  }

  /**
   * Update user profile settings
   */
  async updateSettings(userId, { callsign, activeRoleId, leaderboardOptIn, soundAtmosphere, reducedMotion }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const profileData = {};
    if (typeof callsign === 'string' && callsign.trim()) profileData.callsign = callsign.trim().slice(0, 32);
    if (typeof activeRoleId === 'string') profileData.activeRoleId = activeRoleId;
    if (typeof soundAtmosphere === 'boolean') profileData.soundAtmosphere = soundAtmosphere;
    if (typeof reducedMotion === 'boolean') profileData.reducedMotion = reducedMotion;

    const userData = {};
    if (typeof leaderboardOptIn === 'boolean') userData.leaderboardOptIn = leaderboardOptIn;

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: userData
      }),
      prisma.userProfile.update({
        where: { userId },
        data: profileData
      })
    ]);

    return {
      user: this._sanitizeUser({ ...updatedUser, profile: updatedProfile })
    };
  }

  /**
   * DPDP Act Compliance: Export all user data in JSON format
   */
  async exportUserData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        attempts: {
          include: { decisions: true }
        },
        unlockedAchievements: {
          include: { achievement: true }
        },
        scoreTransactions: true,
        auditLogs: true
      }
    });

    if (!user) throw new AppError('User not found.', 404);

    return {
      exportedAt: new Date().toISOString(),
      complianceNote: 'Exported under the principles of the Digital Personal Data Protection (DPDP) framework.',
      user: this._sanitizeUser(user),
      profile: user.profile,
      missionHistory: user.attempts,
      achievements: user.unlockedAchievements,
      scoreLedger: user.scoreTransactions,
      auditHistory: user.auditLogs
    };
  }

  /**
   * DPDP Act Compliance: Full account deletion upon user request
   */
  async deleteAccount(userId, password) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new AppError('User not found.', 404);

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Incorrect password. Account deletion cannot be confirmed.', 400);
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return {
      success: true,
      message: 'Account and associated personal records have been permanently deleted.'
    };
  }

  // Internal helpers
  async _issueTokenPair(userId, email, role) {
    const accessToken = generateAccessToken({ userId, email, role });

    const refreshTokenRaw = generateSecureToken(32);
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const family = generateSecureToken(16);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  _sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
