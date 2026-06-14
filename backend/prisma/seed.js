/**
 * Admin seed script — creates the first ADMIN user in PostgreSQL.
 * Run via: npm run prisma:seed
 *
 * NOTE: You must ALSO create this user in Keycloak manually on first boot.
 * See the Keycloak Manual Setup Guide (Phase 6) for instructions.
 *
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@college.edu';
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';
  const userId = process.env.SEED_ADMIN_USERID || 'ADMIN001';

  // Upsert — safe to run multiple times
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      userId,
      role: 'ADMIN',
      // keycloakId will be populated on the admin's first Keycloak login
      keycloakId: `seed-pending-${userId}`,
    },
    select: { id: true, email: true, role: true },
  });

  console.log('✅ Seed complete. Admin user in PostgreSQL:', admin);
  console.log('');
  console.log('⚠️  REMINDER: You must also create this admin user in Keycloak:');
  console.log('   1. Navigate to http://localhost:8080');
  console.log('   2. Log in with KEYCLOAK_ADMIN credentials');
  console.log('   3. Create realm: virtual-classroom');
  console.log('   4. Create user with email:', email);
  console.log('   5. Assign role: ADMIN');
  console.log('   6. Once the admin logs in via Keycloak, update the keycloakId in Postgres.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
