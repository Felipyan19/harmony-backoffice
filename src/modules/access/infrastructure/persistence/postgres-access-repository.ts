import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import type { AccessRepository } from '../../application/ports/access-repository';
import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { permissions, profileRoles, profiles, rolePermissions, roles, users } from '@/shared/infrastructure/database/schema';

export class PostgresAccessRepository implements AccessRepository {
  async getByUserId(userId: string): Promise<AccessProfile | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({
        profileId: profiles.id,
        userId: users.id,
        email: users.email,
        displayName: profiles.displayName,
        status: profiles.status,
        sessionVersion: users.sessionVersion,
        profileRoles: sql<string[]>`coalesce(array_agg(distinct ${roles.code}) filter (where ${roles.code} is not null), '{}')`,
        profilePermissions: sql<string[]>`coalesce(array_agg(distinct ${permissions.code}) filter (where ${permissions.code} is not null), '{}')`,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(profileRoles, eq(profileRoles.profileId, profiles.id))
      .leftJoin(roles, eq(roles.id, profileRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(users.id, userId))
      .groupBy(profiles.id, users.id)
      .limit(1);

    if (!row) return null;
    return {
      profileId: row.profileId,
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      status: row.status === 'disabled' ? 'disabled' : 'active',
      sessionVersion: row.sessionVersion,
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
