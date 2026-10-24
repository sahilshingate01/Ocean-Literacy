/**
 * Request Validation Helpers for Authentication & Accounts
 */

const { AppError } = require('../middleware/errorHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }

  const { email, password, callsign } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError('A valid email address is required.', 400);
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }

  if (password.length > 128) {
    throw new AppError('Password cannot exceed 128 characters.', 400);
  }

  const safeCallsign = (typeof callsign === 'string' && callsign.trim())
    ? callsign.trim().slice(0, 32)
    : 'Ocean Cadet';

  return {
    email: email.trim().toLowerCase(),
    password,
    callsign: safeCallsign
  };
}

function validateLogin(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }

  const { email, password } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError('A valid email address is required.', 400);
  }

  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required.', 400);
  }

  return {
    email: email.trim().toLowerCase(),
    password
  };
}

function validatePasswordReset(data) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }

  const { token, newPassword } = data;

  if (!token || typeof token !== 'string') {
    throw new AppError('Reset token is required.', 400);
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long.', 400);
  }

  return {
    token: token.trim(),
    newPassword
  };
}

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordReset
};
