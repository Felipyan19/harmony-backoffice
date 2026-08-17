// Idempotent ops bootstrap for the first Harmony administrator.
// Authentication and RBAC are fully app-owned; this script never touches neon_auth.
//
// Check only:
//   BOOTSTRAP_ADMIN_EMAIL=admin@example.com npm run auth:bootstrap-admin -- --check
//
// Create/reset admin credential:
//   BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
//   BOOTSTRAP_ADMIN_PASSWORD='strong password' \
//   BOOTSTRAP_ADMIN_NAME='System Administrator' \
//   npm run auth:bootstrap-admin

import pg from 'pg';
import { Algorithm, hash } from '@node-rs/argon2';

const { Client } = pg;
const checkOnly = process.argv.includes('--check');
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'System Administrator';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
if (!email || !email.includes('@')) {
  console.error('BOOTSTRAP_ADMIN_EMAIL is required.');
  process.exit(1);
}
if (!checkOnly && (!password || password.length < 12)) {
  console.error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const state = await client.query(
    `SELECT u.id AS user_id, u.email, u.session_version, p.id AS profile_id, p.status,
            EXISTS (SELECT 1 FROM public.password_credentials pc WHERE pc.user_id = u.id) AS has_password,
            COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
       FROM public.users u
       LEFT JOIN public.profiles p ON p.user_id = u.id
       LEFT JOIN public.profile_roles pr ON pr.profile_id = p.id
       LEFT JOIN public.roles r ON r.id = pr.role_id
      WHERE lower(u.email) = $1
      GROUP BY u.id, p.id`,
    [email],
  );

  if (checkOnly) {
    const row = state.rows[0];
    console.log(row ?? { email, state: 'missing' });
    process.exit(0);
  }

  const passwordHash = await hash(password.normalize('NFKC'), {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });

  await client.query('BEGIN');

  let userId = state.rows[0]?.user_id;
  if (!userId) {
    const created = await client.query(
      `INSERT INTO public.users (email, session_version)
       VALUES ($1, 1)
       RETURNING id`,
      [email],
    );
    userId = created.rows[0].id;
  } else {
    await client.query(
      `UPDATE public.users
          SET session_version = session_version + 1, updated_at = now()
        WHERE id = $1`,
      [userId],
    );
  }

  await client.query(
    `INSERT INTO public.password_credentials (user_id, password_hash, password_changed_at, failed_attempts, locked_until)
     VALUES ($1, $2, now(), 0, NULL)
     ON CONFLICT (user_id) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           password_changed_at = now(),
           failed_attempts = 0,
           locked_until = NULL`,
    [userId, passwordHash],
  );

  const profileResult = await client.query(
    `INSERT INTO public.profiles (user_id, display_name, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           status = 'active',
           updated_at = now()
     RETURNING id`,
    [userId, displayName],
  );
  const profileId = profileResult.rows[0].id;

  const roleResult = await client.query(`SELECT id FROM public.roles WHERE code = 'admin' LIMIT 1`);
  if (!roleResult.rows[0]) throw new Error("Role 'admin' does not exist");
  const adminRoleId = roleResult.rows[0].id;

  await client.query(
    `INSERT INTO public.profile_roles (profile_id, role_id, assigned_by)
     VALUES ($1, $2, $1)
     ON CONFLICT (profile_id, role_id) DO NOTHING`,
    [profileId, adminRoleId],
  );

  await client.query(
    `INSERT INTO public.role_permissions (role_id, permission_id)
     SELECT $1, id FROM public.permissions
     ON CONFLICT (role_id, permission_id) DO NOTHING`,
    [adminRoleId],
  );

  await client.query(
    `INSERT INTO public.audit_logs (actor_profile_id, action, resource_type, resource_id, metadata)
     VALUES ($1, 'system.admin_bootstrapped', 'user', $2, $3::jsonb)`,
    [profileId, userId, JSON.stringify({ email })],
  );

  await client.query('COMMIT');
  console.log(`Admin ready: ${email}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
