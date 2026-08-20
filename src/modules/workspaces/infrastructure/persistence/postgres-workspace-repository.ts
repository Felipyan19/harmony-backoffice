import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import type { RoleCode } from '@/modules/access/domain/access';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import {
  auditLogs,
  passwordCredentials,
  platformStaff,
  profiles,
  roles,
  users,
  workspaceBranding,
  workspaceMembershipRoles,
  workspaceMemberships,
  workspaces,
} from '@/shared/infrastructure/database/schema';
import type { CreateWorkspacePersistenceInput, WorkspaceRepository } from '../../application/ports/workspace-repository';
import type { PlatformRole, WorkspaceMembership, WorkspaceSummary } from '../../domain/workspace';

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export class PostgresWorkspaceRepository implements WorkspaceRepository {
  async listForProfile(profileId: string): Promise<WorkspaceSummary[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        status: workspaces.status,
        logoUrl: workspaceBranding.logoUrl,
        primaryColor: workspaceBranding.primaryColor,
        secondaryColor: workspaceBranding.secondaryColor,
        accentColor: workspaceBranding.accentColor,
      })
      .from(workspaceMemberships)
      .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
      .leftJoin(workspaceBranding, eq(workspaceBranding.workspaceId, workspaces.id))
      .where(and(eq(workspaceMemberships.profileId, profileId), eq(workspaceMemberships.status, 'active'), eq(workspaces.status, 'active')))
      .orderBy(asc(workspaces.name));

    return rows.map(mapWorkspace);
  }

  async getMembership(profileId: string, workspaceId: string): Promise<WorkspaceMembership | null> {
    const db = getDrizzleDatabase();
    const [membership] = await db
      .select({
        id: workspaceMemberships.id,
        workspaceId: workspaceMemberships.workspaceId,
        profileId: workspaceMemberships.profileId,
        status: workspaceMemberships.status,
      })
      .from(workspaceMemberships)
      .where(and(
        eq(workspaceMemberships.profileId, profileId),
        eq(workspaceMemberships.workspaceId, workspaceId),
      ))
      .limit(1);

    if (!membership) return null;

    const roleRows = await db
      .select({ code: roles.code })
      .from(workspaceMembershipRoles)
      .innerJoin(roles, eq(roles.id, workspaceMembershipRoles.roleId))
      .where(eq(workspaceMembershipRoles.membershipId, membership.id));

    return {
      ...membership,
      status: membership.status === 'disabled' ? 'disabled' : 'active',
      roles: roleRows.map((row) => row.code as RoleCode),
    };
  }

  async getPlatformRole(profileId: string): Promise<PlatformRole | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({ role: platformStaff.role })
      .from(platformStaff)
      .where(eq(platformStaff.profileId, profileId))
      .limit(1);
    if (!row || !['owner', 'admin', 'support'].includes(row.role)) return null;
    return row.role as PlatformRole;
  }

  async create(input: CreateWorkspacePersistenceInput): Promise<WorkspaceSummary> {
    const db = getDrizzleDatabase();
    let createdWorkspaceId = '';

    try {
      await db.transaction(async (tx) => {
        const email = input.adminEmail.trim().toLowerCase();
        const [existingUser] = await tx
          .select({ userId: users.id, profileId: profiles.id })
          .from(users)
          .innerJoin(profiles, eq(profiles.userId, users.id))
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        let adminProfileId = existingUser?.profileId;
        if (!adminProfileId) {
          const [createdUser] = await tx.insert(users).values({ email }).returning({ id: users.id });
          if (!createdUser) throw new Error('No se pudo crear el usuario administrador');

          await tx.insert(passwordCredentials).values({
            userId: createdUser.id,
            passwordHash: input.adminPasswordHash,
            mustChangePassword: true,
          });

          const [createdProfile] = await tx
            .insert(profiles)
            .values({ userId: createdUser.id, displayName: input.adminDisplayName, status: 'active' })
            .returning({ id: profiles.id });
          if (!createdProfile) throw new Error('No se pudo crear el perfil administrador');
          adminProfileId = createdProfile.id;
        }

        const [createdWorkspace] = await tx
          .insert(workspaces)
          .values({
            name: input.name.trim(),
            slug: input.slug.trim().toLowerCase(),
            status: 'active',
            createdByProfileId: input.actorProfileId,
          })
          .returning({ id: workspaces.id });
        if (!createdWorkspace) throw new Error('No se pudo crear el negocio');
        createdWorkspaceId = createdWorkspace.id;

        await tx.insert(workspaceBranding).values({
          workspaceId: createdWorkspaceId,
          logoUrl: input.logoUrl ?? null,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          accentColor: input.accentColor,
        });

        const [adminRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1);
        if (!adminRole) throw new Error('No existe el rol admin');

        for (const profileId of new Set([input.actorProfileId, adminProfileId])) {
          const [membership] = await tx
            .insert(workspaceMemberships)
            .values({ workspaceId: createdWorkspaceId, profileId, status: 'active' })
            .onConflictDoNothing()
            .returning({ id: workspaceMemberships.id });

          const membershipId = membership?.id ?? (await tx
            .select({ id: workspaceMemberships.id })
            .from(workspaceMemberships)
            .where(and(eq(workspaceMemberships.workspaceId, createdWorkspaceId), eq(workspaceMemberships.profileId, profileId)))
            .limit(1))[0]?.id;

          if (!membershipId) throw new Error('No se pudo crear la membresía');
          await tx.insert(workspaceMembershipRoles).values({
            membershipId,
            roleId: adminRole.id,
            assignedBy: input.actorProfileId,
          }).onConflictDoNothing();
        }

        await tx.insert(auditLogs).values({
          workspaceId: createdWorkspaceId,
          actorProfileId: input.actorProfileId,
          action: 'workspace.created',
          resourceType: 'workspace',
          resourceId: createdWorkspaceId,
          metadata: { slug: input.slug, adminEmail: email },
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error('Ya existe un negocio con ese slug o identidad');
      throw error;
    }

    const [created] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        status: workspaces.status,
        logoUrl: workspaceBranding.logoUrl,
        primaryColor: workspaceBranding.primaryColor,
        secondaryColor: workspaceBranding.secondaryColor,
        accentColor: workspaceBranding.accentColor,
      })
      .from(workspaces)
      .leftJoin(workspaceBranding, eq(workspaceBranding.workspaceId, workspaces.id))
      .where(eq(workspaces.id, createdWorkspaceId))
      .limit(1);

    if (!created) throw new Error('No se pudo cargar el negocio creado');
    return mapWorkspace(created);
  }
}

function mapWorkspace(row: {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
}): WorkspaceSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status === 'disabled' ? 'disabled' : 'active',
    branding: {
      logoUrl: row.logoUrl ?? undefined,
      primaryColor: row.primaryColor ?? '#33513a',
      secondaryColor: row.secondaryColor ?? '#22362a',
      accentColor: row.accentColor ?? '#b4894a',
    },
  };
}
