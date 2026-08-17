import type { RoleCode } from '@/modules/access/domain/access';
import type { PasswordHasher } from '@/modules/authentication/application/ports/password-hasher';
import type { UserRepository } from './ports/user-repository';

export class UserAdminService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  list() { return this.users.list(); }
  listRoles() { return this.users.listRoles(); }

  async create(input: { email: string; password: string; displayName: string; phone?: string; roles: RoleCode[]; actorProfileId: string }) {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      phone: input.phone,
      roles: input.roles,
      actorProfileId: input.actorProfileId,
    });
    await this.users.writeAudit(input.actorProfileId, 'user.created', user.userId, { roles: input.roles });
    return user;
  }

  async update(userId: string, input: { displayName: string; phone?: string; status: 'active' | 'disabled'; roles: RoleCode[]; actorProfileId: string }) {
    const current = await this.users.findByUserId(userId);
    if (!current) throw new Error('Usuario no encontrado');
    const user = await this.users.update(userId, input);
    await this.users.writeAudit(input.actorProfileId, 'user.updated', userId, { status: input.status, roles: input.roles });
    return user;
  }

  async remove(userId: string, actorProfileId: string) {
    const current = await this.users.findByUserId(userId);
    if (!current) return;
    await this.users.writeAudit(actorProfileId, 'user.deleted', userId, { email: current.email });
    await this.users.remove(userId);
  }
}
