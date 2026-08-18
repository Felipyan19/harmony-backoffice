import 'server-only';

import { asc, eq, inArray } from 'drizzle-orm';
import type { RolePermissionRepository, SetRolePermissionsInput } from '../../application/ports/role-permission-repository';
import type { PermissionCode, PermissionOption, RoleCode, RoleWithPermissions } from '../../domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { auditLogs, permissions, rolePermissions, roles } from '@/shared/infrastructure/database/schema';

export class PostgresRolePermissionRepository implements RolePermissionRepository {
  async listRoles(): Promise<RoleWithPermissions[]> {
    const db = getDrizzleDatabase();

    const [roleRows, grantRows] = await Promise.all([
      db.select({ id: roles.id, code: roles.code, name: roles.name, description: roles.description })
        .from(roles)
        .orderBy(asc(roles.name)),
      db.select({ roleId: rolePermissions.roleId, code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId)),
    ]);

    const grantsByRole = new Map<string, PermissionCode[]>();
    for (const grant of grantRows) {
      const list = grantsByRole.get(grant.roleId) ?? [];
      list.push(grant.code as PermissionCode);
      grantsByRole.set(grant.roleId, list);
    }

    return roleRows.map((role) => ({
      code: role.code as RoleCode,
      name: role.name,
      description: role.description ?? undefined,
      permissions: grantsByRole.get(role.id) ?? [],
    }));
  }

  async listPermissions(): Promise<PermissionOption[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({ code: permissions.code, name: permissions.name, description: permissions.description })
      .from(permissions)
      .orderBy(asc(permissions.code));

    return rows.map((row) => ({
      code: row.code as PermissionCode,
      name: row.name ?? row.code,
      description: row.description ?? undefined,
    }));
  }

  async setRolePermissions(input: SetRolePermissionsInput): Promise<void> {
    const db = getDrizzleDatabase();

    await db.transaction(async (tx) => {
      const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.code, input.roleCode)).limit(1);
      if (!role) throw new Error('Rol no encontrado');

      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

      if (input.permissionCodes.length > 0) {
        const permissionRows = await tx
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.code, input.permissionCodes));

        if (permissionRows.length > 0) {
          await tx.insert(rolePermissions)
            .values(permissionRows.map((permission) => ({ roleId: role.id, permissionId: permission.id })))
            .onConflictDoNothing();
        }
      }

      await tx.insert(auditLogs).values({
        actorProfileId: input.actorProfileId,
        action: 'role.permissions_updated',
        resourceType: 'role',
        resourceId: role.id,
        metadata: { roleCode: input.roleCode, permissions: input.permissionCodes },
      });
    });
  }
}
