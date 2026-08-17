// Applies a .sql file through standard PostgreSQL.
//
//   npm run db:sql -- drizzle/manual/0001_access_unique_constraints.sql

import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Client } = pg;
const [file] = process.argv.slice(2);

if (!file) {
  console.error('Usage: npm run db:sql -- <file.sql>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env or export it before running.');
  process.exit(1);
}

const raw = await readFile(file, 'utf8');
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');
  await client.query(raw);
  await client.query('COMMIT');
  console.log(`Applied ${file}`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
