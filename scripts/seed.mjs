// Seeds the initial RBAC catalog, test users and the default Harmony workspace.
// Safe to re-run: every insert is idempotent.
//
//   npm run db:seed

import pg from 'pg';
import { hash } from '@node-rs/argon2';

const { Client } = pg;
const ARGON2ID = 2;
const SEED_PASSWORD = 'Test1234!';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const ROLES = [
  { code: 'admin', name: 'Administrador', description: 'Acceso completo a la operación y configuración del workspace' },
  { code: 'agent', name: 'Agente', description: 'Atiende conversaciones y clientes asignados' },
  { code: 'receptionist', name: 'Recepcionista', description: 'Registra clientes y gestiona la bandeja de conversaciones' },
];

const PERMISSIONS = [
  { code: 'customers.read', name: 'Ver clientes', description: 'Consultar la lista y el detalle de clientes' },
  { code: 'customers.write', name: 'Editar clientes', description: 'Crear y modificar la información de clientes' },
  { code: 'conversations.read', name: 'Ver conversaciones', description: 'Consultar conversaciones y su historial de mensajes' },
  { code: 'conversations.reply', name: 'Responder conversaciones', description: 'Enviar mensajes dentro de una conversación' },
  { code: 'conversations.assign', name: 'Asignar conversaciones', description: 'Asignar conversaciones a un agente' },
  { code: 'conversations.manage_status', name: 'Gestionar estado de conversaciones', description: 'Cambiar el estado de una conversación (abierta, pendiente, cerrada)' },
  { code: 'users.read', name: 'Ver usuarios', description: 'Consultar la lista de usuarios internos' },
  { code: 'users.manage', name: 'Gestionar usuarios', description: 'Crear, modificar, activar/desactivar y eliminar usuarios internos' },
  { code: 'roles.manage', name: 'Gestionar roles y permisos', description: 'Definir qué permisos tiene cada rol' },
  { code: 'audit.read', name: 'Ver auditoría', description: 'Consultar el historial de acciones administrativas' },
  { code: 'reservations.manage', name: 'Gestionar reservas', description: 'Crear y modificar reservas' },
];

const ROLE_PERMISSIONS = {
  agent: ['conversations.read', 'conversations.reply', 'conversations.manage_status', 'customers.read', 'reservations.manage'],
  receptionist: ['customers.read', 'customers.write', 'conversations.read', 'conversations.assign', 'reservations.manage'],
};

const TEST_USERS = [
  { email: 'admin@harmony.test', displayName: 'Admin de Prueba', role: 'admin' },
  { email: 'agente@harmony.test', displayName: 'Agente de Prueba', role: 'agent' },
  { email: 'recepcion@harmony.test', displayName: 'Recepción de Prueba', role: 'receptionist' },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');

  const roleIdByCode = {};
  for (const role of ROLES) {
    const { rows } = await client.query(
      `INSERT INTO public.roles (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [role.code, role.name, role.description],
    );
    roleIdByCode[role.code] = rows[0].id;
  }

  const permissionIdByCode = {};
  for (const permission of PERMISSIONS) {
    const { rows } = await client.query(
      `INSERT INTO public.permissions (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [permission.code, permission.name, permission.description],
    );
    permissionIdByCode[permission.code] = rows[0].id;
  }

  await client.query(
    `INSERT INTO public.role_permissions (role_id, permission_id)
     SELECT $1, id FROM public.permissions
     ON CONFLICT (role_id, permission_id) DO NOTHING`,
    [roleIdByCode.admin],
  );

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionCode of permissionCodes) {
      await client.query(
        `INSERT INTO public.role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleIdByCode[roleCode], permissionIdByCode[permissionCode]],
      );
    }
  }

  const passwordHash = await hash(SEED_PASSWORD.normalize('NFKC'), {
    algorithm: ARGON2ID,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });

  const profileIdByEmail = {};

  for (const testUser of TEST_USERS) {
    const { rows: existing } = await client.query(
      `SELECT id FROM public.users WHERE lower(email) = $1`,
      [testUser.email],
    );

    let userId = existing[0]?.id;
    if (!userId) {
      const created = await client.query(
        `INSERT INTO public.users (email, session_version) VALUES ($1, 1) RETURNING id`,
        [testUser.email],
      );
      userId = created.rows[0].id;
    } else {
      await client.query(
        `UPDATE public.users SET session_version = session_version + 1, updated_at = now() WHERE id = $1`,
        [userId],
      );
    }

    await client.query(
      `INSERT INTO public.password_credentials (user_id, password_hash, password_changed_at, failed_attempts, locked_until)
       VALUES ($1, $2, now(), 0, NULL)
       ON CONFLICT (user_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, password_changed_at = now(), failed_attempts = 0, locked_until = NULL`,
      [userId, passwordHash],
    );

    const profileResult = await client.query(
      `INSERT INTO public.profiles (user_id, display_name, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, status = 'active', updated_at = now()
       RETURNING id`,
      [userId, testUser.displayName],
    );
    const profileId = profileResult.rows[0].id;
    profileIdByEmail[testUser.email] = profileId;

    // Legacy assignments stay in sync until authorization fully moves to workspace memberships.
    await client.query(`DELETE FROM public.profile_roles WHERE profile_id = $1`, [profileId]);
    await client.query(
      `INSERT INTO public.profile_roles (profile_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [profileId, roleIdByCode[testUser.role]],
    );
  }

  await client.query(
    `INSERT INTO public.workspaces (name, slug, status, created_by_profile_id)
     SELECT 'Harmony', 'harmony', 'active', $1
     WHERE NOT EXISTS (SELECT 1 FROM public.workspaces WHERE lower(slug) = 'harmony')`,
    [profileIdByEmail['admin@harmony.test'] ?? null],
  );

  const { rows: [workspace] } = await client.query(
    `SELECT id FROM public.workspaces WHERE lower(slug) = 'harmony' LIMIT 1`,
  );

  await client.query(
    `INSERT INTO public.workspace_branding
       (workspace_id, primary_color, secondary_color, accent_color)
     VALUES ($1, '#33513a', '#22362a', '#b4894a')
     ON CONFLICT (workspace_id) DO UPDATE
       SET primary_color = EXCLUDED.primary_color,
           secondary_color = EXCLUDED.secondary_color,
           accent_color = EXCLUDED.accent_color,
           updated_at = now()`,
    [workspace.id],
  );

  for (const testUser of TEST_USERS) {
    const profileId = profileIdByEmail[testUser.email];
    const { rows: [membership] } = await client.query(
      `INSERT INTO public.workspace_memberships (workspace_id, profile_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (workspace_id, profile_id) DO UPDATE SET status = 'active', updated_at = now()
       RETURNING id`,
      [workspace.id, profileId],
    );

    await client.query(`DELETE FROM public.workspace_membership_roles WHERE membership_id = $1`, [membership.id]);
    await client.query(
      `INSERT INTO public.workspace_membership_roles (membership_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [membership.id, roleIdByCode[testUser.role]],
    );
  }

  // Test-only Ignite platform owner so the multi-tenant administration layer can be exercised.
  await client.query(
    `INSERT INTO public.platform_staff (profile_id, role)
     VALUES ($1, 'owner')
     ON CONFLICT (profile_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now()`,
    [profileIdByEmail['admin@harmony.test']],
  );

  await client.query('COMMIT');
  console.log(`Seed complete. Harmony workspace + test users (password: ${SEED_PASSWORD}):`);
  for (const testUser of TEST_USERS) console.log(`  - ${testUser.email} [${testUser.role}]`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
