/**
 * Secure Admin Bootstrap CLI Script
 *
 * Usage:
 *   ADMIN_EMAIL="admin@oceanliteracy.org" ADMIN_PASSWORD="SecurePassword123!" node server/src/scripts/bootstrap-admin.js
 * or:
 *   node server/src/scripts/bootstrap-admin.js --email="admin@oceanliteracy.org" --password="SecurePassword123!" --callsign="Chief Ocean Admin"
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value;
    }
  });
  return args;
}

async function bootstrap() {
  console.log('🛡️ Starting Safe Admin Account Bootstrap...\n');

  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD;
  const callsign = args.callsign || process.env.ADMIN_CALLSIGN || 'Chief Ocean Admin';

  if (!email || !email.includes('@')) {
    console.error('❌ Error: Valid admin email is required.');
    console.error('Usage: node src/scripts/bootstrap-admin.js --email="admin@ocean.in" --password="StrongPassword123!"');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (existing) {
    console.log(`User ${email} already exists. Elevating to ADMIN role and resetting credentials...`);
    const updated = await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    if (!existing.profile) {
      await prisma.userProfile.create({
        data: {
          userId: updated.id,
          callsign,
          activeRoleId: 'conservation_ranger'
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: updated.id,
        action: 'BOOTSTRAP_ADMIN_ELEVATION',
        resourceType: 'User',
        resourceId: updated.id,
        details: { email, role: 'ADMIN' },
        ipAddress: '127.0.0.1'
      }
    });

    console.log(`✅ Administrator privileges successfully applied to: ${email}`);
  } else {
    console.log(`Creating new Administrator account: ${email}...`);
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
        profile: {
          create: {
            callsign,
            activeRoleId: 'conservation_ranger'
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'BOOTSTRAP_ADMIN_CREATION',
        resourceType: 'User',
        resourceId: newUser.id,
        details: { email, role: 'ADMIN' },
        ipAddress: '127.0.0.1'
      }
    });

    console.log(`✅ Initial Administrator account successfully created with ID: ${newUser.id}`);
  }
}

bootstrap()
  .catch((err) => {
    console.error('❌ Admin bootstrap failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
