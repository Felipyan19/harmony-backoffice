'use server';

import 'server-only';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { auth } from '@/lib/auth/server';

const BOOTSTRAP_EMAIL = 'igniteapps@gmail.com';

const repairSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

type NeonAdminApi = {
  createUser(input: { email: string; password: string; name: string }): Promise<{
    data?: { user?: { id: string; email: string; name?: string | null } };
    error?: { message?: string };
  }>;
  removeUser(input: { userId: string }): Promise<{ error?: { message?: string } }>;
};

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

function deriveLegacyBootstrapKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      {
        N: 16384,
        r: 16,
        p: 1,
        maxmem: 128 * 16384 * 16 * 2,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(Buffer.from(derivedKey));
      },
    );
  });
}

async function verifyLegacyBootstrapPassword(password: string, storedHash: string) {
  const [saltHex, keyHex] = storedHash.split(':');
  if (!saltHex || !keyHex || saltHex.length !== 32 || keyHex.length !== 128) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  const derived = await deriveLegacyBootstrapKey(password, salt);

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function repairBootstrapAdminAction(input: { email: string; password: string }) {
  const parsed = repairSchema.safeParse(input);
  if (!parsed.success || parsed.data.email !== BOOTSTRAP_EMAIL) return { repaired: false };

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
  if (!row?.auth_user_id || !row.password_hash || !row.profile_id) return { repaired: false };

  const alreadyRepaired = await sql`
    SELECT 1
    FROM public.audit_logs
    WHERE action = 'system.bootstrap_auth_repaired'
      AND actor_profile_id = ${String(row.profile_id)}
    LIMIT 1
  `;
  if (alreadyRepaired.length > 0) return { repaired: false };

  const legacyPasswordMatches = await verifyLegacyBootstrapPassword(
    parsed.data.password,
    String(row.password_hash),
  );
  if (!legacyPasswordMatches) return { repaired: false };

  const admin = auth.admin as unknown as NeonAdminApi;
  const oldAuthUserId = String(row.auth_user_id);

  const removed = await admin.removeUser({ userId: oldAuthUserId });
  if (removed.error) throw new Error('No se pudo reemplazar la credencial bootstrap');

  const created = await admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    name: 'IgniteApps',
  });
  if (created.error || !created.data?.user?.id) {
    throw new Error('No se pudo recrear la identidad bootstrap');
  }

  const newAuthUserId = created.data.user.id;

  try {
    await sql`
      UPDATE public.auth_identities
      SET subject = ${newAuthUserId}, updated_at = now()
      WHERE provider = 'neon-auth'
        AND user_id = ${String(row.app_user_id)}
        AND subject = ${oldAuthUserId}
    `;

    await sql`
      INSERT INTO public.audit_logs (
        actor_profile_id, action, resource_type, resource_id, metadata
      ) VALUES (
        ${String(row.profile_id)},
        'system.bootstrap_auth_repaired',
        'auth',
        ${String(row.app_user_id)},
        ${JSON.stringify({ email: parsed.data.email })}::jsonb
      )
    `;
  } catch (error) {
    await admin.removeUser({ userId: newAuthUserId }).catch(() => undefined);
    throw error;
  }

  return { repaired: true };
}
