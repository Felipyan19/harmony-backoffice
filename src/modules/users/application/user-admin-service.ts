import type { RoleCode } from '@/modules/access/domain/access';
import type { PasswordHasher } from '@/modules/authentication/application/ports/password-hasher';
import type { UserRepository } from './ports/user-repository';

export class UserAdminService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  list(workspaceId: string) { return this.users.list(workspaceId); }
  listRoles() { return this.users.listRoles(); }

  async create(workspaceId: string, input: { email: string; password: string; displayName: string; phone?: string; roles: RoleCode[]; actorProfileId: string }) {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create(workspaceId, {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      phone: input.phone,
      roles: input.roles,
      actorProfileId: input.actorProfileId,
    });
    await this.users.writeAudit(workspaceId, input.actorProfileId, 'user.created', user.userId, { roles: input.roles });
    return user;
  }

  async update(workspaceId: string, userId: string, input: { displayName: string; phone?: string; status: 'active' | 'disabled'; roles: RoleCode[]; actorProfileId: string }) {
    const current = await this.users.findByUserId(workspaceId, userId);
    if (!current) throw new Error('Usuario no encontrado en este negocio');
    const user = await this.users.update(workspaceId, userId, input);
    await this.users.writeAudit(workspaceId, input.actorProfileId, 'user.updated', userId, { status: input.status, roles: input.roles });
    return user;
  }

  async remove(workspaceId: string, userId: string, actorProfileId: string) {
    const current = await this.users.findByUserId(workspaceId, userId);
    if (!current) return;
    await this.users.writeAudit(workspaceId, actorProfileId, 'user.removed_from_workspace', userId, { email: current.email });
    await this.users.remove(workspaceId, userId);
  }
}
