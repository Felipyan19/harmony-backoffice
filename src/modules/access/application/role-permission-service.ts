import type { PermissionCode, RoleCode } from '../domain/access';
import type { RolePermissionRepository } from './ports/role-permission-repository';

export class RolePermissionService {
  constructor(private readonly repository: RolePermissionRepository) {}

  listRoles() { return this.repository.listRoles(); }
  listPermissions() { return this.repository.listPermissions(); }

  setRolePermissions(roleCode: RoleCode, permissionCodes: PermissionCode[], actorProfileId: string) {
    return this.repository.setRolePermissions({ roleCode, permissionCodes, actorProfileId });
  }
}
