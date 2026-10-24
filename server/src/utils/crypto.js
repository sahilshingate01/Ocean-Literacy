/**
 * Cryptographic & Token Utilities
 *
 * Implements secure password hashing, timing-safe token generation,
 * SHA-256 hashing for refresh/reset tokens, and JWT issuance/verification.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with salt rounds = 12
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares plaintext password against stored hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure random token (hex)
 */
function generateSecureToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Hashes a sensitive token using SHA-256 before database storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a short-lived access JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn
  });
}

/**
 * Verifies and decodes an access JWT token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  generateAccessToken,
  verifyAccessToken
};
