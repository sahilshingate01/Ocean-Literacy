/**
 * Prisma Client Singleton
 */

const { PrismaClient } = require('@prisma/client');
const config = require('./index');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl
    }
  },
  log: config.isProduction ? ['error', 'warn'] : ['error', 'warn']
});

module.exports = prisma;
