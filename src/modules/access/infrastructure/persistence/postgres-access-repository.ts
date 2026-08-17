import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import type { AccessRepository, EnsureIdentityInput } from '../../application/ports/access-repository';
import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { authIdentities, permissions, profileRoles, profiles, rolePermissions, roles, users } from '@/shared/infrastructure/database/schema';

export class PostgresAccessRepository implements AccessRepository {
  async ensureIdentity(input: EnsureIdentityInput): Promise<AccessProfile> {
    const existing = await this.getByAuthIdentity(input.provider, input.subject);
    if (existing) return existing;

    const db = getDrizzleDatabase();
    const email = input.email.trim().toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
    let userId = existingUser?.id;

    if (!userId) {
      const [created] = await db.insert(users).values({ email }).returning({ id: users.id });
      userId = created?.id;
    }
    if (!userId) throw new Error('Unable to synchronize authenticated user');

    await db.insert(authIdentities).values({ userId, provider: input.provider, subject: input.subject }).onConflictDoNothing();
    await db.insert(profiles).values({ userId, displayName: input.displayName, status: 'active' }).onConflictDoNothing();

    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const [agentRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'agent')).limit(1);
    if (profile && agentRole) await db.insert(profileRoles).values({ profileId: profile.id, roleId: agentRole.id }).onConflictDoNothing();

    const accessProfile = await this.getByAuthIdentity(input.provider, input.subject);
    if (!accessProfile) throw new Error('Unable to synchronize authenticated profile');
    return accessProfile;
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
