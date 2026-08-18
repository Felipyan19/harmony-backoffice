import 'server-only';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Provider-agnostic PostgreSQL adapter. Runtime depends only on DATABASE_URL.
let pool: Pool | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Neon's serverless compute can suspend when idle; the first query after a
// suspend occasionally outraces connectionTimeoutMillis while it wakes up.
// One immediate retry is Neon's documented mitigation for that cold start.
const RETRYABLE_CONNECTION_ERROR = /connection terminated|timeout|ECONNRESET|ETIMEDOUT/i;

function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (RETRYABLE_CONNECTION_ERROR.test(error.message)) return true;
  const cause = (error as { cause?: unknown }).cause;
  return cause instanceof Error && RETRYABLE_CONNECTION_ERROR.test(cause.message);
}

function withConnectionRetry(target: Pool): Pool {
  const originalQuery = target.query.bind(target);
  target.query = (async (...args: Parameters<typeof originalQuery>) => {
    try {
      return await originalQuery(...args);
    } catch (error) {
      if (!isRetryableConnectionError(error)) throw error;
      return await originalQuery(...args);
    }
  }) as typeof target.query;
  return target;
}

export function getPostgresPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');

  pool = withConnectionRetry(new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  }));

  return pool;
}

export function getDrizzleDatabase() {
  if (database) return database;
  database = drizzle(getPostgresPool(), { schema });
  return database;
}
