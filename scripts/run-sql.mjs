// Applies a .sql file through the Neon HTTP driver.
//
//   npm run db:sql -- drizzle/manual/0001_access_unique_constraints.sql
//
// The HTTP driver accepts one statement per round trip, so the file is split on
// semicolons. Keep statements single and idempotent: no DO blocks, no functions.

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

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
const statements = raw
  .split(';')
  .map((statement) => statement.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean);

if (!statements.length) {
  console.error(`No statements found in ${file}`);
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log(`Applying ${statements.length} statement(s) from ${file}`);

for (const [index, statement] of statements.entries()) {
  const label = statement.replace(/\s+/g, ' ').slice(0, 90);
  try {
    await sql.query(statement);
    console.log(`  ${index + 1}/${statements.length} ok   ${label}`);
  } catch (error) {
    console.error(`  ${index + 1}/${statements.length} FAIL ${label}`);
    console.error(`        ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

console.log('Done.');
