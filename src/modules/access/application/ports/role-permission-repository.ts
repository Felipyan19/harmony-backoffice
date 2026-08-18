import type { PermissionCode, PermissionOption, RoleCode, RoleWithPermissions } from '../../domain/access';

export interface SetRolePermissionsInput {
  roleCode: RoleCode;
  permissionCodes: PermissionCode[];
  actorProfileId: string;
}

export interface RolePermissionRepository {
  listRoles(): Promise<RoleWithPermissions[]>;
  listPermissions(): Promise<PermissionOption[]>;
  setRolePermissions(input: SetRolePermissionsInput): Promise<void>;
}
