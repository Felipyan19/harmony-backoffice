import type { RoleCode } from '@/modules/access/domain/access';

export interface BackofficeUser {
  userId: string;
  profileId: string;
  email: string;
  displayName: string;
  phone?: string;
  status: 'active' | 'disabled';
  roles: RoleCode[];
  createdAt: string;
}

export interface RoleOption {
  code: RoleCode;
  name: string;
  description?: string;
}
