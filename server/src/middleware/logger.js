/**
 * Structured Logging Middleware with Sensitive Data Redaction
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'secret',
  'cookie'
]);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      cleaned[key] = redact(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    // Keep non-error requests succinct
    if (statusCode >= 400) {
      console.warn(`[WARN] ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`);
    } else if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`);
    }
  });

  next();
}

module.exports = {
  requestLogger,
  redact
};
