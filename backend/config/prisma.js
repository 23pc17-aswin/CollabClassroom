/**
 * Prisma Client singleton.
 * Prevents multiple PrismaClient instances during hot-reload in development.
 * @module config/prisma
 */

import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient} */
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
