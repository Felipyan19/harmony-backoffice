import type { PermissionCode } from '../../domain/access';
import type { AccessRepository } from '../ports/access-repository';

export class HasPermission {
  constructor(private readonly repository: AccessRepository) {}

  execute(profileId: string, permission: PermissionCode): Promise<boolean> {
    return this.repository.hasPermission(profileId, permission);
  }
}
