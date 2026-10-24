/**
 * Centralized API Error Handling Middleware
 *
 * Sanitizes errors, catches validation and database exceptions,
 * hides stack traces in production, and standardizes JSON error envelopes.
 */

const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';
  let details = err.details || null;

  // Handle Prisma Known Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A resource with this identifier or unique attribute already exists.';
      details = { target: err.meta?.target };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'The requested resource was not found.';
    } else {
      statusCode = 400;
      message = 'Database operation failed.';
    }
  }

  // Handle JSON parsing errors in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON request body.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // Log server errors internally (redacted)
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, {
      message: err.message,
      stack: config.isProduction ? undefined : err.stack
    });
  }

  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
      ...(details ? { details } : {})
    }
  };

  res.status(statusCode).json(response);
}

module.exports = {
  AppError,
  errorHandler
};
