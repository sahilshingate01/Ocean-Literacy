/**
 * HTTP Server Entry Point
 * Handles server lifecycle, database connection verification, and graceful shutdown.
 */

const app = require('./app');
const config = require('./config');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    // 1. Verify Database Connectivity
    console.log('Connecting to PostgreSQL database...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection established successfully.');

    // 2. Start HTTP Server
    const server = app.listen(config.port, config.host, () => {
      console.log(`\n========================================================`);
      console.log(`  🌊 Ocean Literacy Platform (Phase 2) Backend Active`);
      console.log(`  Mode:        ${config.env}`);
      console.log(`  API Base:    http://${config.host}:${config.port}${config.apiPrefix}`);
      console.log(`  Web Client:  http://${config.host}:${config.port}/`);
      console.log(`  Timezone:    ${config.leaderboard.timezone}`);
      console.log(`========================================================\n`);
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('✓ Database disconnected. Process exiting.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });

      // Force close after 10s timeout
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    console.error('❌ Failed to start Ocean Literacy server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
