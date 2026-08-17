// Links an existing Neon Auth credential to the Harmony admin RBAC records.
//
//   node --env-file=.env scripts/bootstrap-admin.mjs someone@harmony.com --check
//   node --env-file=.env scripts/bootstrap-admin.mjs someone@harmony.com
//
// The credential itself (email + password) is created in the Neon Console under
// Auth -> Users. Neon's Admin API requires an already-authenticated admin
// session, so the very first admin cannot be created from code — and passwords
// must never be written or verified by this app. This script only owns the
// PostgreSQL side: users, profiles, auth_identities, profile_roles.
//
// Every write is idempotent. Re-running after a partial failure is safe.

import { neon } from '@neondatabase/serverless';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const nameFlag = args.indexOf('--name');
const overrideName = nameFlag >= 0 ? args[nameFlag + 1] : undefined;
const email = args.find((arg) => !arg.startsWith('--') && arg !== overrideName)?.trim().toLowerCase();

if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env scripts/bootstrap-admin.mjs <email> [--check] [--name "Display Name"]');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Pass --env-file=.env or export it.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const PROVIDER = 'neon-auth';

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`\n  ${hint}\n`);
  process.exit(1);
}

// --- 1. The credential, read-only. This app never writes to neon_auth. --------

let authUser;
try {
  const rows = await sql.query('SELECT * FROM neon_auth."user" WHERE lower(email) = $1 LIMIT 1', [email]);
  authUser = rows[0];
} catch (error) {
  fail(
    `Cannot read neon_auth."user": ${error instanceof Error ? error.message : String(error)}`,
    'Check that Auth is enabled on this branch and that the DATABASE_URL role can read the neon_auth schema.',
  );
}

if (!authUser) {
  fail(
    `No Neon Auth credential exists for ${email}.`,
    'Create it first: Neon Console -> your project -> Auth -> Users -> Create user.\n  Then re-run this script to link it to the Harmony admin role.',
  );
}

const authUserId = String(authUser.id);
const displayName = overrideName ?? authUser.name ?? email;

let providers = [];
try {
  const rows = await sql.query('SELECT "providerId" FROM neon_auth.account WHERE "userId" = $1', [authUserId]);
  providers = rows.map((row) => row.providerId);
} catch {
  providers = ['<unreadable>'];
}

console.log('\nNeon Auth credential');
console.log(`  id             ${authUserId}`);
console.log(`  email          ${authUser.email}`);
console.log(`  name           ${authUser.name ?? '—'}`);
if ('emailVerified' in authUser) console.log(`  emailVerified  ${authUser.emailVerified}`);
if ('banned' in authUser) console.log(`  banned         ${authUser.banned ?? false}`);
if ('role' in authUser) console.log(`  role           ${authUser.role ?? '—'}`);
console.log(`  providers      ${providers.join(', ') || 'none (no password set — set one in the Console)'}`);

// --- 2. Current Harmony RBAC state -------------------------------------------

const [appUser] = await sql.query('SELECT id FROM public.users WHERE lower(email) = $1 LIMIT 1', [email]);
const [profile] = appUser
  ? await sql.query('SELECT id, display_name, status FROM public.profiles WHERE user_id = $1 LIMIT 1', [appUser.id])
  : [];
const identities = appUser
  ? await sql.query('SELECT provider, subject FROM public.auth_identities WHERE user_id = $1', [appUser.id])
  : [];
const grantedRoles = profile
  ? await sql.query(
      'SELECT r.code FROM public.profile_roles pr JOIN public.roles r ON r.id = pr.role_id WHERE pr.profile_id = $1 ORDER BY r.code',
      [profile.id],
    )
  : [];
const orphanPending = await sql.query(
  "SELECT id, user_id, subject FROM public.auth_identities WHERE provider = $1 AND subject LIKE 'bootstrap-pending:%'",
  [PROVIDER],
);

console.log('\nHarmony RBAC');
console.log(`  users row      ${appUser?.id ?? '— missing'}`);
console.log(`  profile        ${profile ? `${profile.id} (${profile.status})` : '— missing'}`);
console.log(`  identities     ${identities.map((row) => `${row.provider}:${row.subject}`).join(', ') || '— none'}`);
console.log(`  roles          ${grantedRoles.map((row) => row.code).join(', ') || '— none'}`);
if (orphanPending.length) {
  console.log(`  ⚠ leftover     ${orphanPending.length} bootstrap-pending row(s) from the removed repair flow`);
}

const linkedSubject = identities.find((row) => row.provider === PROVIDER)?.subject;
const alreadyCorrect = linkedSubject === authUserId && grantedRoles.some((row) => row.code === 'admin') && profile?.status === 'active';

if (checkOnly) {
  console.log(`\n${alreadyCorrect ? '✓ Ready: this credential resolves to an active admin profile.' : '→ Not linked yet. Re-run without --check to apply.'}\n`);
  process.exit(0);
}

// --- 3. Link it. Idempotent. --------------------------------------------------

const [adminRole] = await sql.query("SELECT id FROM public.roles WHERE code = 'admin' LIMIT 1");
if (!adminRole) {
  fail("The 'admin' role does not exist in public.roles.", 'Seed roles and permissions before bootstrapping an admin.');
}

console.log('\nApplying');

let userId = appUser?.id;
if (!userId) {
  const [created] = await sql.query('INSERT INTO public.users (email) VALUES ($1) RETURNING id', [email]);
  userId = created.id;
  console.log(`  + users row               ${userId}`);
} else {
  console.log(`  = users row               ${userId}`);
}

let profileId = profile?.id;
if (!profileId) {
  const [created] = await sql.query(
    "INSERT INTO public.profiles (user_id, display_name, status) VALUES ($1, $2, 'active') RETURNING id",
    [userId, displayName],
  );
  profileId = created.id;
  console.log(`  + profile                 ${profileId}`);
} else {
  if (profile.status !== 'active') {
    await sql.query("UPDATE public.profiles SET status = 'active', updated_at = now() WHERE id = $1", [profileId]);
    console.log(`  ~ profile re-activated    ${profileId}`);
  } else {
    console.log(`  = profile                 ${profileId}`);
  }
}

// Relinking is an explicit ops action: the app itself must never do this.
if (linkedSubject === authUserId) {
  console.log(`  = identity                ${PROVIDER}:${authUserId}`);
} else if (linkedSubject) {
  await sql.query(
    'UPDATE public.auth_identities SET subject = $1 WHERE user_id = $2 AND provider = $3',
    [authUserId, userId, PROVIDER],
  );
  console.log(`  ~ identity relinked       ${linkedSubject} -> ${authUserId}`);
} else {
  await sql.query(
    'INSERT INTO public.auth_identities (user_id, provider, subject) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [userId, PROVIDER, authUserId],
  );
  console.log(`  + identity                ${PROVIDER}:${authUserId}`);
}

const [roleGrant] = await sql.query(
  'INSERT INTO public.profile_roles (profile_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING profile_id',
  [profileId, adminRole.id],
);
console.log(`  ${roleGrant ? '+' : '='} admin role`);

const permissionGrants = await sql.query(
  'INSERT INTO public.role_permissions (role_id, permission_id) SELECT $1, id FROM public.permissions ON CONFLICT DO NOTHING RETURNING permission_id',
  [adminRole.id],
);
console.log(`  ${permissionGrants.length ? '+' : '='} admin permissions        ${permissionGrants.length} added`);

const staleLeftovers = orphanPending.filter((row) => String(row.user_id) !== String(userId));
if (staleLeftovers.length) {
  console.log(`  ⚠ ${staleLeftovers.length} bootstrap-pending row(s) belong to other users — review them manually`);
}

await sql.query(
  `INSERT INTO public.audit_logs (actor_profile_id, action, resource_type, resource_id, metadata)
   VALUES ($1, 'system.admin_bootstrapped', 'auth', $2, $3::jsonb)`,
  [profileId, userId, JSON.stringify({ email, provider: PROVIDER, subject: authUserId })],
);

console.log(`\n✓ ${email} resolves to an active admin profile. Sign in at /login with the password set in the Neon Console.\n`);
