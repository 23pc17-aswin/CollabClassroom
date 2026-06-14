import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 configuration file.
 *
 * DATABASE_URL is loaded from backend/.env via dotenv/config.
 * - LOCAL:      matches docker-compose.yml postgres service defaults
 * - PRODUCTION: replace DATABASE_URL in .env with Neon Postgres connection string
 */
export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
