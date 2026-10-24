/**
 * Authentication and RBAC Middleware
 *
 * Extracts credentials from:
 * 1. Bearer Token in `Authorization: Bearer <token>` (Desktop/Electron/Mobile)
 * 2. Signed/Secure HttpOnly Cookie `accessToken` (Web Browser)
 *
 * Verifies active user status and enforces Role-Based Access Control (RBAC).
 */

const { verifyAccessToken } = require('../utils/crypto');
const { AppError } = require('./errorHandler');
const prisma = require('../config/prisma');

/**
 * Extracts and verifies token without throwing if absent
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });

    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      leaderboardOptIn: user.leaderboardOptIn,
      profile: user.profile
    };

    next();
  } catch (err) {
    // Stale or invalid token in optional context
    req.user = null;
    next();
  }
}

/**
 * Requires valid authenticated user
 */
async function requireAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Authentication required. Please sign in.', 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });

    if (!user) {
      return next(new AppError('User account not found.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact administration.', 403));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      leaderboardOptIn: user.leaderboardOptIn,
      profile: user.profile
    };

    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication session.', 401));
  }
}

/**
 * Enforces Role-Based Access Control (RBAC)
 * e.g., requireRole('ADMIN', 'CONTENT_EDITOR')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges for this operation.', 403));
    }

    next();
  };
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole
};
