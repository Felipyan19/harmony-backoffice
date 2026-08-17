import type { RoleCode } from '@/modules/access/domain/access';
import type { IdentityAdmin } from './ports/identity-admin';
import type { UserRepository } from './ports/user-repository';

export class UserAdminService {
  constructor(private readonly users: UserRepository, private readonly identities: IdentityAdmin) {}

  list() { return this.users.list(); }
  listRoles() { return this.users.listRoles(); }

  async create(input: { email: string; password: string; displayName: string; phone?: string; roles: RoleCode[]; actorProfileId: string }) {
    const identity = await this.identities.createUser({ email: input.email, password: input.password, name: input.displayName });
    try {
      const user = await this.users.createFromIdentity({ authSubject: identity.subject, email: identity.email, displayName: input.displayName, phone: input.phone, roles: input.roles });
      await this.users.writeAudit(input.actorProfileId, 'user.created', user.userId, { roles: input.roles });
      return user;
    } catch (error) {
      await this.identities.removeUser(identity.subject).catch(() => undefined);
      throw error;
    }
  }

  async update(userId: string, input: { displayName: string; phone?: string; status: 'active' | 'disabled'; roles: RoleCode[]; actorProfileId: string }) {
    const current = await this.users.findByUserId(userId);
    if (!current) throw new Error('Usuario no encontrado');
    if (current.authSubject && current.status !== input.status) await this.identities.setDisabled(current.authSubject, input.status === 'disabled');
    const user = await this.users.update(userId, input);
    await this.users.writeAudit(input.actorProfileId, 'user.updated', userId, { status: input.status, roles: input.roles });
    return user;
  }

  async remove(userId: string, actorProfileId: string) {
    const current = await this.users.findByUserId(userId);
    if (!current) return;
    if (current.authSubject) await this.identities.removeUser(current.authSubject);
    await this.users.writeAudit(actorProfileId, 'user.deleted', userId, { email: current.email });
    await this.users.remove(userId);
  }
}
