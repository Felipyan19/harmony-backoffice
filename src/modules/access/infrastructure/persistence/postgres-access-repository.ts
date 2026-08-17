import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import type {
  AccessRepository,
  AccessResolution,
  LinkIdentityInput,
} from '../../application/ports/access-repository';
import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { auditLogs, authIdentities, permissions, profileRoles, profiles, rolePermissions, roles, users } from '@/shared/infrastructure/database/schema';

export class PostgresAccessRepository implements AccessRepository {
  async resolveIdentity(input: LinkIdentityInput): Promise<AccessResolution> {
    const linked = await this.getByAuthIdentity(input.provider, input.subject);
    if (linked) return { granted: true, profile: linked };

    const db = getDrizzleDatabase();
    const email = input.email.trim().toLowerCase();

    // Only a user already invited from the backoffice (or seeded by the bootstrap
    // script) may be linked. A valid session alone grants nothing.
    const [invited] = await db
      .select({ userId: users.id, profileId: profiles.id })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (!invited) return { granted: false, reason: 'not-invited' };
    if (!invited.profileId) return { granted: false, reason: 'no-profile' };

    // The invited user already points at another credential. Relinking is an
    // explicit ops action, never something a sign-in attempt may perform.
    const [claimed] = await db
      .select({ subject: authIdentities.subject })
      .from(authIdentities)
      .where(and(eq(authIdentities.userId, invited.userId), eq(authIdentities.provider, input.provider)))
      .limit(1);

    if (claimed && claimed.subject !== input.subject) return { granted: false, reason: 'subject-mismatch' };

    await db
      .insert(authIdentities)
      .values({ userId: invited.userId, provider: input.provider, subject: input.subject })
      .onConflictDoNothing({ target: [authIdentities.provider, authIdentities.subject] });

    await db.insert(auditLogs).values({
      actorProfileId: invited.profileId,
      action: 'access.identity_linked',
      resourceType: 'auth',
      resourceId: invited.userId,
      metadata: { provider: input.provider, email },
    });

    const profile = await this.getByAuthIdentity(input.provider, input.subject);
    if (!profile) return { granted: false, reason: 'no-profile' };
    return { granted: true, profile };
  }

  async getByAuthIdentity(provider: string, subject: string): Promise<AccessProfile | null> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({
        profileId: profiles.id,
        userId: users.id,
        email: users.email,
        displayName: profiles.displayName,
        status: profiles.status,
        profileRoles: sql<string[]>`coalesce(array_agg(distinct ${roles.code}) filter (where ${roles.code} is not null), '{}')`,
        profilePermissions: sql<string[]>`coalesce(array_agg(distinct ${permissions.code}) filter (where ${permissions.code} is not null), '{}')`,
      })
      .from(authIdentities)
      .innerJoin(users, eq(users.id, authIdentities.userId))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(profileRoles, eq(profileRoles.profileId, profiles.id))
      .leftJoin(roles, eq(roles.id, profileRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(authIdentities.provider, provider), eq(authIdentities.subject, subject)))
      .groupBy(profiles.id, users.id)
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return {
      profileId: row.profileId,
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      status: row.status === 'disabled' ? 'disabled' : 'active',
      roles: row.profileRoles as RoleCode[],
      permissions: row.profilePermissions as PermissionCode[],
    };
  }

  async hasPermission(profileId: string, permission: PermissionCode): Promise<boolean> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({ code: permissions.code })
      .from(profileRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, profileRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(profileRoles.profileId, profileId), eq(permissions.code, permission)))
      .limit(1);
    return Boolean(row);
  }

  async assignRole(profileId: string, role: RoleCode, assignedBy?: string): Promise<void> {
    const db = getDrizzleDatabase();
    const [roleRow] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, role)).limit(1);
    if (!roleRow) throw new Error(`Unknown role: ${role}`);
    await db.insert(profileRoles).values({ profileId, roleId: roleRow.id, assignedBy: assignedBy ?? null }).onConflictDoNothing();
  }
}
