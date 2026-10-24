/**
 * Ocean Literacy - Central Configuration
 * Reads from process.env with secure defaults and type coercion.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,file://')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),

  databaseUrl: process.env.DATABASE_URL || 'postgresql://sahilshingate@localhost:5432/ocean_literacy_dev',

  jwt: {
    secret: process.env.JWT_SECRET || 'ocean_literacy_jwt_secret_dev_key_must_be_at_least_32_characters_long_for_security',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  cookie: {
    secret: process.env.COOKIE_SECRET || 'ocean_literacy_cookie_secret_dev_32_chars_long',
    secure: process.env.SECURE_COOKIES === 'true'
  },

  leaderboard: {
    timezone: process.env.LEADERBOARD_TIMEZONE || 'Asia/Kolkata',
    pageSize: 25
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '30', 10)
  },

  incois: {
    baseUrl: process.env.INCOIS_BASE_URL || 'https://www.incois.gov.in',
    pfzUrl: process.env.INCOIS_PFZ_URL || 'https://www.incois.gov.in/MarineFisheries/PfzAdvisory',
    osfUrl: process.env.INCOIS_OSF_URL || 'https://www.incois.gov.in/site/services/osf.jsp',
    samudraUrl: process.env.INCOIS_SAMUDRA_URL || 'https://www.incois.gov.in/site/SAMUDRA/index.html',
    tewsUrl: process.env.INCOIS_TEWS_URL || 'https://tsunami.incois.gov.in/TEWS/about.jsp',
    timeoutMs: parseInt(process.env.INCOIS_REQUEST_TIMEOUT_MS || '6000', 10),
    cacheTtlSeconds: parseInt(process.env.INCOIS_CACHE_TTL_SECONDS || '900', 10),
    mockFallbackEnabled: process.env.INCOIS_MOCK_FALLBACK_ENABLED !== 'false'
  }
};

module.exports = config;
