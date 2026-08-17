import type { RoleCode } from '@/modules/access/domain/access';
import type { BackofficeUser, RoleOption } from '../../domain/user';

export interface CreateInternalUserInput {
  authSubject: string;
  email: string;
  displayName: string;
  phone?: string;
  roles: RoleCode[];
}

export interface UpdateInternalUserInput {
  displayName: string;
  phone?: string;
  status: 'active' | 'disabled';
  roles: RoleCode[];
  actorProfileId?: string;
}

export interface UserRepository {
  list(): Promise<BackofficeUser[]>;
  listRoles(): Promise<RoleOption[]>;
  createFromIdentity(input: CreateInternalUserInput): Promise<BackofficeUser>;
  update(userId: string, input: UpdateInternalUserInput): Promise<BackofficeUser>;
  remove(userId: string): Promise<void>;
  findByUserId(userId: string): Promise<BackofficeUser | null>;
  writeAudit(actorProfileId: string, action: string, resourceId: string, metadata?: Record<string, unknown>): Promise<void>;
}
