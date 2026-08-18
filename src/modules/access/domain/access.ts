export type RoleCode = 'admin' | 'agent' | 'receptionist';

export type PermissionCode =
  | 'customers.read'
  | 'customers.write'
  | 'conversations.read'
  | 'conversations.reply'
  | 'conversations.assign'
  | 'conversations.manage_status'
  | 'users.read'
  | 'users.manage'
  | 'roles.manage'
  | 'audit.read'
  | 'reservations.manage';

export interface AccessProfile {
  profileId: string;
  userId: string;
  email: string;
  displayName: string;
  status: 'active' | 'disabled';
  sessionVersion: number;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

export interface PermissionOption {
  code: PermissionCode;
  name: string;
  description?: string;
}

export interface RoleWithPermissions {
  code: RoleCode;
  name: string;
  description?: string;
  permissions: PermissionCode[];
}
