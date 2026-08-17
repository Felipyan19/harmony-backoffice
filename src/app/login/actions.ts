'use server';

import 'server-only';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

const BOOTSTRAP_EMAIL = 'igniteapps@gmail.com';
const PENDING_PREFIX = 'bootstrap-pending:';

const repairSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const finalizeSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

async function verifyLegacyBootstrapPassword(password: string, storedHash: string) {
  const [saltHex, keyHex] = storedHash.split(':');
  if (!saltHex || !keyHex || saltHex.length !== 32 || keyHex.length !== 128) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (error, key) => {
        if (error) return reject(error);
        resolve(key);
      },
    );
  });

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function prepareBootstrapAdminRepairAction(input: { email: string; password: string }) {
  const parsed = repairSchema.safeParse(input);
  if (!parsed.success || parsed.data.email !== BOOTSTRAP_EMAIL) return { prepared: false };

  const sql = getSql();
  const rows = await sql`
    SELECT
      au.id AS auth_user_id,
      aa.password AS password_hash,
      ai.user_id AS app_user_id,
      p.id AS profile_id
    FROM neon_auth."user" au
    JOIN neon_auth.account aa
      ON aa."userId" = au.id
      AND aa."providerId" = 'credential'
    JOIN public.auth_identities ai
      ON ai.provider = 'neon-auth'
      AND ai.subject = au.id::text
    JOIN public.profiles p ON p.user_id = ai.user_id
    JOIN public.profile_roles pr ON pr.profile_id = p.id
    JOIN public.roles r ON r.id = pr.role_id AND r.code = 'admin'
    WHERE lower(au.email) = ${parsed.data.email}
      AND p.status = 'active'
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.auth_user_id || !row.password_hash || !row.app_user_id || !row.profile_id) {
    return { prepared: false };
  }

  const completed = await sql`
    SELECT 1
    FROM public.audit_logs
    WHERE action = 'system.bootstrap_auth_repaired'
      AND actor_profile_id = ${String(row.profile_id)}
    LIMIT 1
  `;
  if (completed.length > 0) return { prepared: false };

  const matches = await verifyLegacyBootstrapPassword(parsed.data.password, String(row.password_hash));
  if (!matches) return { prepared: false };

  const oldAuthUserId = String(row.auth_user_id);
  const appUserId = String(row.app_user_id);
  const profileId = String(row.profile_id);
  const pendingSubject = `${PENDING_PREFIX}${appUserId}`;

  const result = await sql`
    WITH moved_identity AS (
      UPDATE public.auth_identities
      SET subject = ${pendingSubject}, updated_at = now()
      WHERE provider = 'neon-auth'
        AND user_id = ${appUserId}
        AND subject = ${oldAuthUserId}
      RETURNING user_id
    ), deleted_auth AS (
      DELETE FROM neon_auth."user"
      WHERE id = ${oldAuthUserId}::uuid
      RETURNING id
    )
    INSERT INTO public.audit_logs (
      actor_profile_id, action, resource_type, resource_id, metadata
    )
    SELECT
      ${profileId}::uuid,
      'system.bootstrap_auth_repair_started',
      'auth',
      ${appUserId}::uuid,
      ${JSON.stringify({ email: parsed.data.email })}::jsonb
    FROM moved_identity, deleted_auth
    RETURNING id
  `;

  return { prepared: result.length === 1 };
}

export async function finalizeBootstrapAdminRepairAction(input: { email: string }) {
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success || parsed.data.email !== BOOTSTRAP_EMAIL) return { finalized: false };

  const sql = getSql();
  const rows = await sql`
    SELECT
      au.id AS auth_user_id,
      ai.user_id AS app_user_id,
      p.id AS profile_id,
      ai.subject AS pending_subject
    FROM neon_auth."user" au
    JOIN neon_auth.account aa
      ON aa."userId" = au.id
      AND aa."providerId" = 'credential'
    JOIN public.auth_identities ai
      ON ai.provider = 'neon-auth'
      AND ai.subject LIKE ${`${PENDING_PREFIX}%`}
    JOIN public.profiles p ON p.user_id = ai.user_id
    JOIN public.profile_roles pr ON pr.profile_id = p.id
    JOIN public.roles r ON r.id = pr.role_id AND r.code = 'admin'
    WHERE lower(au.email) = ${parsed.data.email}
      AND p.status = 'active'
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.auth_user_id || !row.app_user_id || !row.profile_id || !row.pending_subject) {
    return { finalized: false };
  }

  const authUserId = String(row.auth_user_id);
  const appUserId = String(row.app_user_id);
  const profileId = String(row.profile_id);
  const pendingSubject = String(row.pending_subject);

  const result = await sql`
    WITH relinked AS (
      UPDATE public.auth_identities
      SET subject = ${authUserId}, updated_at = now()
      WHERE provider = 'neon-auth'
        AND user_id = ${appUserId}
        AND subject = ${pendingSubject}
      RETURNING user_id
    )
    INSERT INTO public.audit_logs (
      actor_profile_id, action, resource_type, resource_id, metadata
    )
    SELECT
      ${profileId}::uuid,
      'system.bootstrap_auth_repaired',
      'auth',
      ${appUserId}::uuid,
      ${JSON.stringify({ email: parsed.data.email })}::jsonb
    FROM relinked
    RETURNING id
  `;

  return { finalized: result.length === 1 };
}
