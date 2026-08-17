import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Provider-agnostic PostgreSQL adapter. Runtime depends only on DATABASE_URL.
let pool: Pool | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPostgresPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return pool;
}

export function getDrizzleDatabase() {
  if (database) return database;
  database = drizzle(getPostgresPool(), { schema });
  return database;
}
