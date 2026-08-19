import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import type { RoleCode } from '@/modules/access/domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import {
  auditLogs,
  passwordCredentials,
  profiles,
  roles,
  users,
  workspaceMembershipRoles,
  workspaceMemberships,
} from '@/shared/infrastructure/database/schema';
import type { CreateInternalUserInput, UpdateInternalUserInput, UserRepository } from '../../application/ports/user-repository';
import type { BackofficeUser, RoleOption } from '../../domain/user';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export class PostgresUserRepository implements UserRepository {
  async list(workspaceId: string): Promise<BackofficeUser[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({
        userId: users.id,
        profileId: profiles.id,
        email: users.email,
        displayName: profiles.displayName,
        phone: profiles.phone,
        membershipStatus: workspaceMemberships.status,
        createdAt: workspaceMemberships.createdAt,
        userRoles: sql<string[]>`coalesce(array_agg(distinct ${roles.code}) filter (where ${roles.code} is not null), '{}')`,
      })
      .from(workspaceMemberships)
      .innerJoin(profiles, eq(profiles.id, workspaceMemberships.profileId))
      .innerJoin(users, eq(users.id, profiles.userId))
      .leftJoin(workspaceMembershipRoles, eq(workspaceMembershipRoles.membershipId, workspaceMemberships.id))
      .leftJoin(roles, eq(roles.id, workspaceMembershipRoles.roleId))
      .where(eq(workspaceMemberships.workspaceId, workspaceId))
      .groupBy(users.id, profiles.id, workspaceMemberships.id)
      .orderBy(asc(profiles.displayName));

    return rows.map((row) => ({
      userId: row.userId,
      profileId: row.profileId,
      email: row.email,
      displayName: row.displayName,
      phone: row.phone ?? undefined,
      status: row.membershipStatus === 'disabled' ? 'disabled' : 'active',
      roles: row.userRoles as RoleCode[],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listRoles(): Promise<RoleOption[]> {
    const db = getDrizzleDatabase();
    const rows = await db.select({ code: roles.code, name: roles.name, description: roles.description }).from(roles).orderBy(asc(roles.name));
    return rows.map((role) => ({ code: role.code as RoleCode, name: role.name, description: role.description ?? undefined }));
  }

  async create(workspaceId: string, input: CreateInternalUserInput): Promise<BackofficeUser> {
    const db = getDrizzleDatabase();
    let userId = '';

    try {
      await db.transaction(async (tx) => {
        const email = input.email.trim().toLowerCase();
        const [existing] = await tx
          .select({ userId: users.id, profileId: profiles.id, profileStatus: profiles.status })
          .from(users)
          .innerJoin(profiles, eq(profiles.userId, users.id))
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        let profileId = existing?.profileId;
        userId = existing?.userId ?? '';

        if (existing?.profileStatus === 'disabled') throw new Error('El usuario está deshabilitado a nivel de plataforma');

        if (!profileId) {
          const [createdUser] = await tx.insert(users).values({ email }).returning({ id: users.id });
          if (!createdUser) throw new Error('No se pudo crear el usuario');
          userId = createdUser.id;

          await tx.insert(passwordCredentials).values({ userId, passwordHash: input.passwordHash, mustChangePassword: true });
          const [createdProfile] = await tx
            .insert(profiles)
            .values({ userId, displayName: input.displayName, phone: input.phone ?? null, status: 'active' })
            .returning({ id: profiles.id });
          if (!createdProfile) throw new Error('No se pudo crear el perfil');
          profileId = createdProfile.id;
        }

        const [alreadyMember] = await tx
          .select({ id: workspaceMemberships.id })
          .from(workspaceMemberships)
          .where(and(eq(workspaceMemberships.workspaceId, workspaceId), eq(workspaceMemberships.profileId, profileId)))
          .limit(1);
        if (alreadyMember) throw new Error('El usuario ya pertenece a este negocio');

        const [membership] = await tx
          .insert(workspaceMemberships)
          .values({ workspaceId, profileId, status: 'active' })
          .returning({ id: workspaceMemberships.id });
        if (!membership) throw new Error('No se pudo crear la membresía');

        for (const roleCode of input.roles) {
          const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.code, roleCode)).limit(1);
          if (role) {
            await tx.insert(workspaceMembershipRoles).values({
              membershipId: membership.id,
              roleId: role.id,
              assignedBy: input.actorProfileId ?? null,
            }).onConflictDoNothing();
          }
        }
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error('No se pudo crear la membresía por un conflicto de datos');
      throw error;
    }

    const user = await this.findByUserId(workspaceId, userId);
    if (!user) throw new Error('No se pudo cargar el usuario creado');
    return user;
  }

  async update(workspaceId: string, userId: string, input: UpdateInternalUserInput): Promise<BackofficeUser> {
    const db = getDrizzleDatabase();

    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ profileId: profiles.id, membershipId: workspaceMemberships.id })
        .from(profiles)
        .innerJoin(workspaceMemberships, and(
          eq(workspaceMemberships.profileId, profiles.id),
          eq(workspaceMemberships.workspaceId, workspaceId),
        ))
        .where(eq(profiles.userId, userId))
        .limit(1);
      if (!row) throw new Error('Usuario no encontrado en este negocio');

      await tx.update(profiles).set({
        displayName: input.displayName,
        phone: input.phone ?? null,
        updatedAt: new Date(),
      }).where(eq(profiles.id, row.profileId));

      await tx.update(workspaceMemberships).set({
        status: input.status,
        updatedAt: new Date(),
      }).where(eq(workspaceMemberships.id, row.membershipId));

      await tx.delete(workspaceMembershipRoles).where(eq(workspaceMembershipRoles.membershipId, row.membershipId));
      for (const roleCode of input.roles) {
        const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.code, roleCode)).limit(1);
        if (role) await tx.insert(workspaceMembershipRoles).values({
          membershipId: row.membershipId,
          roleId: role.id,
          assignedBy: input.actorProfileId ?? null,
        }).onConflictDoNothing();
      }
    });

    const user = await this.findByUserId(workspaceId, userId);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  async remove(workspaceId: string, userId: string) {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({ membershipId: workspaceMemberships.id })
      .from(profiles)
      .innerJoin(workspaceMemberships, and(
        eq(workspaceMemberships.profileId, profiles.id),
        eq(workspaceMemberships.workspaceId, workspaceId),
      ))
      .where(eq(profiles.userId, userId))
      .limit(1);
    if (!row) return;
    await db.delete(workspaceMemberships).where(eq(workspaceMemberships.id, row.membershipId));
  }

  async findByUserId(workspaceId: string, userId: string): Promise<BackofficeUser | null> {
    const all = await this.list(workspaceId);
    return all.find((user) => user.userId === userId) ?? null;
  }

  async writeAudit(workspaceId: string, actorProfileId: string, action: string, resourceId: string, metadata: Record<string, unknown> = {}) {
    const db = getDrizzleDatabase();
    await db.insert(auditLogs).values({ workspaceId, actorProfileId, action, resourceType: 'user', resourceId, metadata });
  }
}
