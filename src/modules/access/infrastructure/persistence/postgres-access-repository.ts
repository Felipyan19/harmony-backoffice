import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import type { AccessRepository } from '../../application/ports/access-repository';
import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import {
  permissions,
  profiles,
  rolePermissions,
  roles,
  users,
  workspaceMembershipRoles,
  workspaceMemberships,
} from '@/shared/infrastructure/database/schema';

export class PostgresAccessRepository implements AccessRepository {
  async getIdentityByUserId(userId: string): Promise<AccessProfile | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({
        profileId: profiles.id,
        userId: users.id,
        email: users.email,
        displayName: profiles.displayName,
        status: profiles.status,
        sessionVersion: users.sessionVersion,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return null;
    return {
      profileId: row.profileId,
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      status: row.status === 'disabled' ? 'disabled' : 'active',
      sessionVersion: row.sessionVersion,
      roles: [],
      permissions: [],
    };
  }

  async getByUserId(userId: string, workspaceId: string): Promise<AccessProfile | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({
        profileId: profiles.id,
        userId: users.id,
        email: users.email,
        displayName: profiles.displayName,
        status: profiles.status,
        sessionVersion: users.sessionVersion,
        workspaceRoles: sql<string[]>`coalesce(array_agg(distinct ${roles.code}) filter (where ${roles.code} is not null), '{}')`,
        workspacePermissions: sql<string[]>`coalesce(array_agg(distinct ${permissions.code}) filter (where ${permissions.code} is not null), '{}')`,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .innerJoin(
        workspaceMemberships,
        and(
          eq(workspaceMemberships.profileId, profiles.id),
          eq(workspaceMemberships.workspaceId, workspaceId),
          eq(workspaceMemberships.status, 'active'),
        ),
      )
      .leftJoin(workspaceMembershipRoles, eq(workspaceMembershipRoles.membershipId, workspaceMemberships.id))
      .leftJoin(roles, eq(roles.id, workspaceMembershipRoles.roleId))
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
      roles: row.workspaceRoles as RoleCode[],
      permissions: row.workspacePermissions as PermissionCode[],
    };
  }

  async hasPermission(profileId: string, workspaceId: string, permission: PermissionCode): Promise<boolean> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({ code: permissions.code })
      .from(workspaceMemberships)
      .innerJoin(workspaceMembershipRoles, eq(workspaceMembershipRoles.membershipId, workspaceMemberships.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, workspaceMembershipRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(
        eq(workspaceMemberships.profileId, profileId),
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.status, 'active'),
        eq(permissions.code, permission),
      ))
      .limit(1);
    return Boolean(row);
  }
}
