import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import type { RoleCode } from '@/modules/access/domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { auditLogs, authIdentities, profileRoles, profiles, roles, users } from '@/shared/infrastructure/database/schema';
import type { CreateInternalUserInput, UpdateInternalUserInput, UserRepository } from '../../application/ports/user-repository';
import type { BackofficeUser, RoleOption } from '../../domain/user';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export class PostgresUserRepository implements UserRepository {
  async list(): Promise<BackofficeUser[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({
        userId: users.id,
        profileId: profiles.id,
        email: users.email,
        displayName: profiles.displayName,
        phone: profiles.phone,
        status: profiles.status,
        createdAt: users.createdAt,
        authSubject: sql<string | null>`max(${authIdentities.subject}) filter (where ${authIdentities.provider} = 'neon-auth')`,
        userRoles: sql<string[]>`coalesce(array_agg(distinct ${roles.code}) filter (where ${roles.code} is not null), '{}')`,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(authIdentities, eq(authIdentities.userId, users.id))
      .leftJoin(profileRoles, eq(profileRoles.profileId, profiles.id))
      .leftJoin(roles, eq(roles.id, profileRoles.roleId))
      .groupBy(users.id, profiles.id)
      .orderBy(asc(profiles.displayName));

    return rows.map((row) => ({
      userId: row.userId,
      profileId: row.profileId,
      authSubject: row.authSubject,
      email: row.email,
      displayName: row.displayName,
      phone: row.phone ?? undefined,
      status: row.status === 'disabled' ? 'disabled' : 'active',
      roles: row.userRoles as RoleCode[],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listRoles(): Promise<RoleOption[]> {
    const db = getDrizzleDatabase();
    const rows = await db.select({ code: roles.code, name: roles.name, description: roles.description }).from(roles).orderBy(asc(roles.name));
    return rows.map((role) => ({ code: role.code as RoleCode, name: role.name, description: role.description ?? undefined }));
  }

  async createFromIdentity(input: CreateInternalUserInput): Promise<BackofficeUser> {
    const db = getDrizzleDatabase();

    // users_email_lower_key decides the race; a pre-check could not.
    const [createdUser] = await db
      .insert(users)
      .values({ email: input.email.toLowerCase() })
      .returning({ id: users.id })
      .catch((error: unknown) => {
        if (isUniqueViolation(error)) throw new Error('Ya existe un usuario con ese correo');
        throw error;
      });
    if (!createdUser) throw new Error('No se pudo crear el usuario interno');

    await db.insert(authIdentities).values({ userId: createdUser.id, provider: 'neon-auth', subject: input.authSubject });
    const [createdProfile] = await db.insert(profiles).values({ userId: createdUser.id, displayName: input.displayName, phone: input.phone ?? null, status: 'active' }).returning({ id: profiles.id });
    if (!createdProfile) throw new Error('No se pudo crear el perfil');

    for (const roleCode of input.roles) {
      const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (role) await db.insert(profileRoles).values({ profileId: createdProfile.id, roleId: role.id }).onConflictDoNothing();
    }

    const user = await this.findByUserId(createdUser.id);
    if (!user) throw new Error('No se pudo cargar el usuario creado');
    return user;
  }

  async update(userId: string, input: UpdateInternalUserInput): Promise<BackofficeUser> {
    const db = getDrizzleDatabase();
    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!profile) throw new Error('Usuario no encontrado');

    await db.update(profiles).set({ displayName: input.displayName, phone: input.phone ?? null, status: input.status, updatedAt: new Date() }).where(eq(profiles.id, profile.id));
    await db.delete(profileRoles).where(eq(profileRoles.profileId, profile.id));

    for (const roleCode of input.roles) {
      const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (role) await db.insert(profileRoles).values({ profileId: profile.id, roleId: role.id, assignedBy: input.actorProfileId ?? null }).onConflictDoNothing();
    }

    const user = await this.findByUserId(userId);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  async remove(userId: string) {
    const db = getDrizzleDatabase();
    await db.delete(users).where(eq(users.id, userId));
  }

  async findByUserId(userId: string): Promise<BackofficeUser | null> {
    const all = await this.list();
    return all.find((user) => user.userId === userId) ?? null;
  }

  async writeAudit(actorProfileId: string, action: string, resourceId: string, metadata: Record<string, unknown> = {}) {
    const db = getDrizzleDatabase();
    await db.insert(auditLogs).values({ actorProfileId, action, resourceType: 'user', resourceId, metadata });
  }
}
